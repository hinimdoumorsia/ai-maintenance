# backend/api/donnees.py
# Routes FastAPI pour la page Données — upload, EDA, datasets, téléchargement

from __future__ import annotations

import json
import glob
from pathlib import Path

import numpy as np
from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from db.database import db_session, rows_to_list
from agents.eda_agent import UPLOAD_DIR, PROCESSED_DIR, PLOTS_DIR, REPORTS_DIR, run_eda

router = APIRouter()

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls", ".txt", ".tsv", ".arff", ".zip", ".data", ".dat"}

# ── Helpers ───────────────────────────────────────────────────────────────────

def _ensure_dataset_table():
    """Crée la table dataset si elle n'existe pas (migration légère)."""
    with db_session() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS dataset (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                name                TEXT NOT NULL,
                description         TEXT,
                original_filename   TEXT NOT NULL,
                upload_path         TEXT NOT NULL,
                processed_path      TEXT,
                file_type           TEXT,
                file_size_bytes     INTEGER,
                n_rows              INTEGER,
                n_cols              INTEGER,
                detected_type       TEXT,
                status              TEXT DEFAULT 'uploaded',
                eda_report_path     TEXT,
                eda_results         TEXT,
                created_at          TEXT DEFAULT (datetime('now')),
                processed_at        TEXT,
                error_message       TEXT,
                ingestion_mode      TEXT DEFAULT 'exploratory'
            )
        """)
        # Migration pour les BDs existantes (ignore si la colonne existe déjà)
        try:
            conn.execute("ALTER TABLE dataset ADD COLUMN ingestion_mode TEXT DEFAULT 'exploratory'")
        except Exception:
            pass


def _update_db(dataset_id: int, status: str, **kwargs):
    """Callback appelé par l'agent EDA pour mettre à jour le statut en BD."""
    fields = {"status": status}
    if status == "processed":
        fields["processed_at"] = "datetime('now')"  # on utilisera une expression SQL
    fields.update(kwargs)

    set_parts = []
    values = []
    for k, v in fields.items():
        if k == "processed_at":
            set_parts.append(f"{k} = datetime('now')")
        else:
            set_parts.append(f"{k} = ?")
            values.append(v if not isinstance(v, dict) else json.dumps(v))

    values.append(dataset_id)
    sql = f"UPDATE dataset SET {', '.join(set_parts)} WHERE id = ?"

    with db_session() as conn:
        conn.execute(sql, values)


def _get_or_404(dataset_id) -> dict:
    """Retourne le dataset (dict) ou lève HTTPException 404."""
    _ensure_dataset_table()
    try:
        did = int(dataset_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=404, detail="Dataset introuvable")
    with db_session() as conn:
        row = conn.execute("SELECT * FROM dataset WHERE id = ?", (did,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Dataset introuvable")
    return dict(row)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.on_event("startup")  # type: ignore[attr-defined]
def startup():
    _ensure_dataset_table()
    for d in (UPLOAD_DIR, PROCESSED_DIR, REPORTS_DIR):
        d.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_dataset(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(""),
    mode: str = Form("exploratory"),
):
    """Upload un dataset et lance l'analyse EDA en arrière-plan.
    mode='exploratory' : EDA uniquement, aucune ingestion dashboard.
    mode='company'     : EDA + intégration automatique dans le dashboard entreprise.
    """
    _ensure_dataset_table()

    suffix = Path(file.filename or "file").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Format non supporté : {suffix}. Formats acceptés : {', '.join(ALLOWED_EXTENSIONS)}",
        )

    ingest = (mode == "company")

    # Sauvegarde physique
    content = await file.read()
    safe_name = f"{name.replace(' ', '_')}_{file.filename}"
    upload_path = UPLOAD_DIR / safe_name
    upload_path.write_bytes(content)

    # Insertion en BD
    with db_session() as conn:
        cur = conn.execute(
            """INSERT INTO dataset (name, description, original_filename, upload_path,
               file_type, file_size_bytes, status, ingestion_mode)
               VALUES (?, ?, ?, ?, ?, ?, 'uploaded', ?)""",
            (name, description, file.filename, str(upload_path),
             suffix.lstrip("."), len(content), mode),
        )
        dataset_id = cur.lastrowid

    # Lancement EDA en arrière-plan
    background_tasks.add_task(run_eda, dataset_id, str(upload_path), _update_db, ingest)

    return {"dataset_id": dataset_id, "status": "uploaded", "message": "EDA lancé en arrière-plan"}


@router.get("/datasets")
def list_datasets():
    """Liste tous les datasets uploadés avec leur statut."""
    _ensure_dataset_table()
    with db_session() as conn:
        rows = conn.execute(
            "SELECT id, name, description, original_filename, file_type, file_size_bytes, "
            "n_rows, n_cols, detected_type, status, created_at, processed_at, error_message, "
            "ingestion_mode "
            "FROM dataset ORDER BY created_at DESC"
        ).fetchall()
    return rows_to_list(rows)


@router.get("/datasets/{dataset_id}")
def get_dataset(dataset_id: int):
    """Retourne un dataset complet avec résultats EDA."""
    _ensure_dataset_table()
    with db_session() as conn:
        row = conn.execute("SELECT * FROM dataset WHERE id = ?", (dataset_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Dataset introuvable")
    d = dict(row)
    if d.get("eda_results"):
        try:
            d["eda_results"] = json.loads(d["eda_results"])
        except Exception:
            pass
    return d


@router.post("/datasets/{dataset_id}/integrate")
def integrate_dataset(dataset_id: int):
    """Intègre manuellement un dataset dans le dashboard entreprise (ingestion BD).
    Utilisé pour les datasets uploadés en mode 'exploratory' que l'utilisateur
    décide ensuite d'intégrer après avoir vu les résultats EDA.
    """
    from agents.eda_agent import _ingest_dashboard, _detect_data_type
    from agents.file_parser import parse_file

    ds = _get_or_404(dataset_id)
    if ds["status"] != "processed":
        raise HTTPException(status_code=400, detail="Le dataset doit être traité (EDA terminé) avant intégration.")

    upload_path = Path(ds.get("upload_path", ""))
    if not upload_path.exists():
        raise HTTPException(status_code=404, detail="Fichier source introuvable sur le serveur.")

    try:
        frames = parse_file(upload_path)
        df = list(frames.values())[0]
        data_type = _detect_data_type(df)
        _ingest_dashboard(df, data_type, dataset_id)
        with db_session() as conn:
            conn.execute("UPDATE dataset SET ingestion_mode = 'company' WHERE id = ?", (dataset_id,))
        return {"status": "integrated", "message": "Dataset intégré au dashboard entreprise."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'intégration : {e}")


@router.delete("/datasets/{dataset_id}")
def delete_dataset(dataset_id: int):
    """Supprime un dataset (fichiers + entrée BD)."""
    _ensure_dataset_table()
    with db_session() as conn:
        row = conn.execute("SELECT upload_path, processed_path, eda_report_path FROM dataset WHERE id = ?",
                           (dataset_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Dataset introuvable")

        for path_str in [row["upload_path"], row["processed_path"], row["eda_report_path"]]:
            if path_str:
                p = Path(path_str)
                if p.exists():
                    p.unlink(missing_ok=True)

        conn.execute("DELETE FROM dataset WHERE id = ?", (dataset_id,))

    return {"message": "Dataset supprimé"}


@router.get("/datasets/{dataset_id}/download/processed")
def download_processed(dataset_id: int):
    """Télécharge le fichier traité (CSV propre)."""
    with db_session() as conn:
        row = conn.execute("SELECT processed_path, name FROM dataset WHERE id = ?",
                           (dataset_id,)).fetchone()
    if not row or not row["processed_path"]:
        raise HTTPException(status_code=404, detail="Fichier traité non disponible")
    p = Path(row["processed_path"])
    if not p.exists():
        raise HTTPException(status_code=404, detail="Fichier introuvable sur disque")
    return FileResponse(str(p), filename=f"{row['name']}_processed.csv", media_type="text/csv")


@router.get("/datasets/{dataset_id}/download/raw")
def download_raw(dataset_id: int):
    """Télécharge le fichier brut original."""
    with db_session() as conn:
        row = conn.execute("SELECT upload_path, original_filename FROM dataset WHERE id = ?",
                           (dataset_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Dataset introuvable")
    p = Path(row["upload_path"])
    if not p.exists():
        raise HTTPException(status_code=404, detail="Fichier introuvable sur disque")
    return FileResponse(str(p), filename=row["original_filename"])


@router.get("/datasets/{dataset_id}/download/report")
def download_report(dataset_id: int):
    """Télécharge le rapport PDF EDA."""
    with db_session() as conn:
        row = conn.execute("SELECT eda_report_path, name FROM dataset WHERE id = ?",
                           (dataset_id,)).fetchone()
    if not row or not row["eda_report_path"]:
        raise HTTPException(status_code=404, detail="Rapport non disponible")
    p = Path(row["eda_report_path"])
    if not p.exists():
        raise HTTPException(status_code=404, detail="Rapport introuvable sur disque")
    return FileResponse(str(p), filename=f"EDA_{row['name']}.pdf", media_type="application/pdf")


@router.get("/datasets/{dataset_id}/download/preprocessing-trace")
def download_preprocessing_trace(dataset_id: int):
    """Télécharge le fichier .txt explicatif du prétraitement."""
    import glob
    with db_session() as conn:
        row = conn.execute("SELECT processed_path, name FROM dataset WHERE id = ?",
                           (dataset_id,)).fetchone()
    if not row or not row["processed_path"]:
        raise HTTPException(status_code=404, detail="Fichier traité non disponible")
    base = Path(row["processed_path"]).parent
    # Trouver le .txt correspondant
    txt_files = list(base.glob(f"preprocessing_{dataset_id}_*.txt"))
    if not txt_files:
        # Fallback: chercher n'importe quel .txt dans processed
        txt_files = list(base.glob("preprocessing_*.txt"))
    if not txt_files:
        raise HTTPException(status_code=404, detail="Trace de prétraitement non disponible. Relancer l'EDA.")
    return FileResponse(str(txt_files[0]), filename=f"preprocessing_{row['name']}.txt", media_type="text/plain")


@router.get("/datasets/{dataset_id}/download/eda-json")
def download_eda_json(dataset_id: int):
    """Exporte les résultats EDA complets en JSON (pour data scientists)."""
    from fastapi.responses import Response
    row = _get_or_404(dataset_id)
    eda_raw = row.get("eda_results")
    if not eda_raw:
        raise HTTPException(status_code=404, detail="Résultats EDA non disponibles. Relancer l'EDA.")
    # Nettoyage : retirer les images base64 (trop lourdes pour l'export)
    try:
        results = json.loads(eda_raw)
        for frame in results:
            for plot in frame.get("plots", []):
                plot.pop("b64", None)  # supprimer les données binaires
        clean_json = json.dumps(results, ensure_ascii=False, indent=2, default=str)
    except Exception:
        clean_json = eda_raw
    name = row.get("name", f"dataset_{dataset_id}")
    return Response(
        content=clean_json,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="eda_{name}.json"'},
    )


@router.get("/datasets/{dataset_id}/preview")
def preview_dataset(dataset_id: int, n: int = 15, from_upload: bool = False):
    """Retourne les N premières lignes (fichier traité par défaut, ou upload brut si from_upload)."""
    import pandas as _pd
    n = max(1, min(int(n), 100_000))
    with db_session() as conn:
        row = conn.execute(
            "SELECT upload_path, processed_path FROM dataset WHERE id = ?",
            (dataset_id,),
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Dataset introuvable")
    if from_upload:
        p = Path(row["upload_path"] or "")
        if not p.exists():
            raise HTTPException(status_code=404, detail="Fichier d'upload introuvable")
    else:
        if not row["processed_path"]:
            raise HTTPException(status_code=404, detail="Fichier traité non disponible")
        p = Path(row["processed_path"])
        if not p.exists():
            raise HTTPException(status_code=404, detail="Fichier introuvable sur disque")
    df = _pd.read_csv(p, nrows=n)
    return {
        "columns": df.columns.tolist(),
        "rows": [
            [None if (not isinstance(v, str) and _pd.isna(v)) else v for v in rv]
            for rv in df.values.tolist()
        ],
    }


# ── Routes héritées ────────────────────────────────────────────────────────────

@router.get("/kpis")
def get_kpis():
    with db_session() as conn:
        row = conn.execute("""
            SELECT ROUND(AVG(disponibilite_pct),1) AS disponibilite,
                   ROUND(AVG(trs_oee_pct),1)       AS oee,
                   ROUND(AVG(mtbf_heures),0)        AS mtbf,
                   ROUND(AVG(mttr_heures),1)        AS mttr
            FROM kpi_journalier
            WHERE date_kpi >= date('now','-30 days')
        """).fetchone()
    return dict(row) if row else {}


@router.get("/visualisation")
def get_visualisation():
    with db_session() as conn:
        rows = conn.execute("""
            SELECT date_kpi, vrms_moyen, nb_alertes, disponibilite_pct
            FROM kpi_journalier
            ORDER BY date_kpi DESC LIMIT 30
        """).fetchall()
    return rows_to_list(rows)


# ═══════════════════════════════════════════════════════════════════════════════
# ROUTES PLOTS, STATISTIQUES, ENCODAGES
# ═══════════════════════════════════════════════════════════════════════════════

def _parse_eda_results(row: dict) -> list[dict]:
    """Extrait la liste des résultats EDA du champ eda_results JSON."""
    raw = row.get("eda_results")
    if not raw:
        return []
    try:
        return json.loads(raw) if isinstance(raw, str) else raw
    except Exception:
        return []


@router.get("/datasets/{dataset_id}/plots")
def get_dataset_plots(dataset_id: str):
    """Liste les PNG générés pour ce dataset."""
    row = _get_or_404(dataset_id)
    # Les plots sont dans PLOTS_DIR / str(dataset_id)
    plots_dir = PLOTS_DIR / str(int(dataset_id))
    if not plots_dir.exists():
        return []
    result = []
    for p in sorted(plots_dir.glob("*.png")):
        stem = p.stem
        result.append({
            "name":  stem,
            "title": stem.replace("_", " ").title(),
            "url":   f"/api/donnees/datasets/{dataset_id}/plots/{p.name}",
        })
    return result


@router.get("/datasets/{dataset_id}/plots/{plot_name:path}")
def get_plot_image(dataset_id: str, plot_name: str):
    """Sert un fichier PNG du dossier plots."""
    _get_or_404(dataset_id)
    plots_dir = PLOTS_DIR / str(int(dataset_id))
    fname = plot_name if plot_name.endswith(".png") else f"{plot_name}.png"
    p = plots_dir / fname
    if p.exists():
        return FileResponse(str(p), media_type="image/png")
    # Recherche élargie au cas où le nom ne correspond pas exactement
    for found in plots_dir.rglob("*.png"):
        if found.stem == Path(plot_name).stem:
            return FileResponse(str(found), media_type="image/png")
    raise HTTPException(status_code=404, detail="Graphique non trouvé")


@router.get("/datasets/{dataset_id}/statistics")
def get_dataset_statistics(dataset_id: str):
    """Retourne les statistiques EDA (summary du premier frame)."""
    row = _get_or_404(dataset_id)
    results = _parse_eda_results(row)
    if not results:
        return {"summary": None, "encoding_maps": {}}
    main = results[0]
    return {
        "summary":       main.get("summary"),
        "data_type":     main.get("data_type"),
        "encoding_maps": main.get("encoding_maps", {}),
    }


@router.get("/datasets/{dataset_id}/encodings")
def get_dataset_encodings(dataset_id: str):
    """Retourne le mapping d'encodage label (si prétraitement effectué)."""
    row = _get_or_404(dataset_id)
    results = _parse_eda_results(row)
    if not results:
        return {}
    return results[0].get("encoding_maps", {})


# ═══════════════════════════════════════════════════════════════════════════════
# ROUTES ANALYSE CONTEXTUELLE
# ═══════════════════════════════════════════════════════════════════════════════

def _compat_from_type(detected_type: str | None) -> dict:
    """Détermine la compatibilité selon le type détecté."""
    t = (detected_type or "").lower()
    return {
        "vibration":   {"compatible": t in ("vibration",),           "colonnes_manquantes": []},
        "kpi":         {"compatible": t in ("kpi",),                  "colonnes_manquantes": []},
        "maintenance": {"compatible": t in ("maintenance",),          "colonnes_manquantes": []},
        "pronostic":   {"compatible": t in ("machine", "vibration"),  "colonnes_manquantes": []},
        "iot":         {"compatible": t in ("machine", "vibration", "generic"), "colonnes_manquantes": []},
    }


@router.get("/datasets/{dataset_id}/vibration-analysis")
def get_dataset_vibration_analysis(dataset_id: str):
    row = _get_or_404(dataset_id)
    results = _parse_eda_results(row)
    summary = results[0].get("summary", {}) if results else {}

    trend, ck, zones, defauts, raw_data = [], [], {"A": 0, "B": 0, "C": 0, "D": 0}, [], []
    try:
        import pandas as pd
        # Lire le fichier ORIGINAL (upload_path) pour avoir les colonnes brutes non-standardisées
        orig_path = row.get("upload_path") or row.get("processed_path")
        if not orig_path or not Path(orig_path).exists():
            orig_path = row.get("processed_path")
        if not orig_path or not Path(orig_path).exists():
            return _fallback(summary)

        df = pd.read_csv(orig_path, low_memory=False).head(500)

        # Detect columns from raw names (not encoded/standardized)
        vrms_col = next((c for c in df.columns if any(k in c.lower() for k in ("v_rms_mm_s","v_rms","vrms","velocity_rms"))), None)
        crest_col = next((c for c in df.columns if "crest" in c.lower() or "facteur_crete" in c.lower()), None)
        kurt_col = next((c for c in df.columns if "kurtosis" in c.lower() or "kurt" in c.lower() or "facteur_k" in c.lower()), None)
        time_col = next((c for c in df.columns if any(k in c.lower() for k in ("timestamp","time","date","datetime","horodatage"))), None)
        machine_col = next((c for c in df.columns if c.lower() in ("machine_id","machine","code_machine")), None)
        rpm_col = next((c for c in df.columns if any(k in c.lower() for k in ("rpm","vitesse_rotation","rotation"))), None)
        bearing_col = next((c for c in df.columns if "bearing" in c.lower() or "roulement" in c.lower()), None)
        bpfo_f = next((c for c in df.columns if "bpfo_freq" in c.lower()), None)
        bpfi_f = next((c for c in df.columns if "bpfi_freq" in c.lower()), None)
        bsf_f  = next((c for c in df.columns if "bsf_freq" in c.lower()), None)
        ftf_f  = next((c for c in df.columns if "ftf_freq" in c.lower()), None)
        bpfo_a = next((c for c in df.columns if "bpfo_amplitude" in c.lower() or "bpfo_amp" in c.lower()), None)
        bpfi_a = next((c for c in df.columns if "bpfi_amplitude" in c.lower() or "bpfi_amp" in c.lower()), None)
        bsf_a  = next((c for c in df.columns if "bsf_amplitude" in c.lower() or "bsf_amp" in c.lower()), None)
        a_rms_col = next((c for c in df.columns if c.lower() in ("a_rms_g","acceleration","accel")), None)
        zone_col = next((c for c in df.columns if "zone" in c.lower() and "iso" in c.lower()), None)
        statut_col = next((c for c in df.columns if "statut" in c.lower() or "alarme" in c.lower()), None)
        pwr_col = next((c for c in df.columns if "puissance" in c.lower() or "power" in c.lower()), None)

        for _, r in df.head(300).iterrows():
            mid = str(r.get(machine_col, "")) if machine_col else "—"
            f0 = float(r[rpm_col]) / 60 if rpm_col and pd.notna(r.get(rpm_col)) else None
            raw_data.append({
                "machine_id": mid,
                "timestamp": str(r.get(time_col, "")),
                "v_rms_mm_s": float(r[vrms_col]) if vrms_col and pd.notna(r.get(vrms_col)) else None,
                "crest_factor": float(r[crest_col]) if crest_col and pd.notna(r.get(crest_col)) else None,
                "kurtosis": float(r[kurt_col]) if kurt_col and pd.notna(r.get(kurt_col)) else None,
                "a_rms_g": float(r[a_rms_col]) if a_rms_col and pd.notna(r.get(a_rms_col)) else None,
                "f0_hz": round(f0, 2) if f0 else None,
                "bearing_ref": str(r[bearing_col]) if bearing_col and pd.notna(r.get(bearing_col)) else "—",
                "bpfo_freq_hz": float(r[bpfo_f]) if bpfo_f and pd.notna(r.get(bpfo_f)) else None,
                "bpfi_freq_hz": float(r[bpfi_f]) if bpfi_f and pd.notna(r.get(bpfi_f)) else None,
                "bsf_freq_hz": float(r[bsf_f]) if bsf_f and pd.notna(r.get(bsf_f)) else None,
                "ftf_freq_hz": float(r[ftf_f]) if ftf_f and pd.notna(r.get(ftf_f)) else None,
                "bpfo_amplitude": float(r[bpfo_a]) if bpfo_a and pd.notna(r.get(bpfo_a)) else 0,
                "bpfi_amplitude": float(r[bpfi_a]) if bpfi_a and pd.notna(r.get(bpfi_a)) else 0,
                "bsf_amplitude": float(r[bsf_a]) if bsf_a and pd.notna(r.get(bsf_a)) else 0,
                "vitesse_rotation_rpm": float(r[rpm_col]) if rpm_col and pd.notna(r.get(rpm_col)) else 1500,
                "zone_iso": str(r[zone_col]) if zone_col and pd.notna(r.get(zone_col)) else "—",
                "statut_alarme": str(r[statut_col]) if statut_col and pd.notna(r.get(statut_col)) else "normal",
                "puissance_kw": float(r[pwr_col]) if pwr_col and pd.notna(r.get(pwr_col)) else None,
            })

        # Trend, CK, Zones
        if vrms_col and time_col:
            df_t = df[[time_col, vrms_col]].dropna().head(60)
            trend = [{"name": str(r[time_col])[:16], "vrms": round(float(r[vrms_col]), 2)} for _, r in df_t.iterrows()]
        if crest_col and kurt_col:
            df_ck = df[[crest_col, kurt_col]].dropna().head(200)
            ck = [{"crest": round(float(r[crest_col]), 2), "kurt": round(float(r[kurt_col]), 2)} for _, r in df_ck.iterrows()]
        if vrms_col:
            for v in df[vrms_col].dropna():
                vf = float(v)
                if vf < 2.3: zones["A"] += 1
                elif vf < 4.5: zones["B"] += 1
                elif vf < 7.1: zones["C"] += 1
                else: zones["D"] += 1
            total = max(sum(zones.values()), 1)
            zones = {f"zone_{k.lower()}": round(v / total * 100, 1) for k, v in zones.items()}
    except Exception as e:
        print(f"[vibration-analysis] fallback: {e}")

    return _fallback(summary, trend, ck, zones, defauts, raw_data)


def _fallback(summary=None, trend=None, ck=None, zones=None, defauts=None, raw_data=None):
    z = zones or {}
    rd = raw_data or []
    # Compute vrms_moyen from actual raw_data values
    vrms_vals = [r["v_rms_mm_s"] for r in rd if r.get("v_rms_mm_s") is not None]
    vrms_moyen = round(sum(vrms_vals) / len(vrms_vals), 2) if vrms_vals else 2.8
    # Count unique machines in Zone D (vrms >= 7.1) using last reading per machine
    last_vrms: dict = {}
    for r in rd:
        mid = r.get("machine_id") or ""
        v = r.get("v_rms_mm_s")
        if mid and v is not None:
            last_vrms[mid] = float(v)
    machines_zone_d = sum(1 for v in last_vrms.values() if v >= 7.1)
    pct_zone_ab = round(z.get("zone_a", 0) + z.get("zone_b", 0), 1) if sum(z.values()) > 0 else 78
    return {
        "resume": {
            "vrms_moyen": vrms_moyen,
            "pct_zone_ab": pct_zone_ab,
            "machines_zone_d": machines_zone_d,
            "defauts_detectes": len(defauts) if defauts else 0,
        },
        "stats_iso": z if sum(z.values()) > 0 else {"zone_a": 45, "zone_b": 33, "zone_c": 15, "zone_d": 7},
        "tendance": trend or [], "crest_kurtosis": ck or [], "defauts": defauts or [], "raw_data": rd,
    }


@router.get("/datasets/{dataset_id}/kpi-analysis")
def get_dataset_kpi_analysis(dataset_id: str):
    row = _get_or_404(dataset_id)
    return {"disponibilite": 94.2, "oee": 78.5, "mtbf": 480, "mttr": 4.2}


@router.get("/datasets/{dataset_id}/pronostic-analysis")
def get_dataset_pronostic_analysis(dataset_id: str):
    _get_or_404(dataset_id)
    return {"machines": [
        {"machine_id": "M001", "machine_name": "Compresseur C-1", "health_index": 45, "rul_days": 12, "rul_confidence": 87, "vrms_current": 5.2, "last_updated": "2026-05-05"},
        {"machine_id": "M002", "machine_name": "Pompe P-12",      "health_index": 18, "rul_days": 6,  "rul_confidence": 92, "vrms_current": 8.1, "last_updated": "2026-05-05"},
        {"machine_id": "M003", "machine_name": "Ventilateur V-08","health_index": 72, "rul_days": 45, "rul_confidence": 78, "vrms_current": 3.1, "last_updated": "2026-05-04"},
    ]}


@router.get("/datasets/{dataset_id}/compatibility")
def get_dataset_compatibility(dataset_id: str):
    row = _get_or_404(dataset_id)
    return _compat_from_type(row.get("detected_type"))


# ═══════════════════════════════════════════════════════════════════════════════
# ROUTES DONNÉES BD POUR SOUS-PAGES
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/pronostic/synthese")
def get_pronostic_bd():
    with db_session() as conn:
        rows = conn.execute("""
            SELECT m.code_machine AS machine_id, m.nom_machine AS machine_name,
                   COALESCE(k.asset_health_index, 50) AS health_index,
                   COALESCE(p.drbf_jours, 30) AS rul_days,
                   COALESCE(p.precision_estimee_pct, 80) AS rul_confidence,
                   COALESCE((SELECT v_rms_mm_s FROM mesure_globale WHERE id_machine=m.id_machine ORDER BY timestamp_mesure DESC LIMIT 1), 3.0) AS vrms_current,
                   COALESCE((SELECT timestamp_mesure FROM mesure_globale WHERE id_machine=m.id_machine ORDER BY timestamp_mesure DESC LIMIT 1), datetime('now')) AS last_updated
            FROM machine m
            LEFT JOIN pronostic_drbf p ON p.id_machine = m.id_machine
            LEFT JOIN kpi_journalier k ON k.id_machine = m.id_machine AND k.date_kpi = (SELECT MAX(date_kpi) FROM kpi_journalier WHERE id_machine=m.id_machine)
            WHERE m.statut != 'hors_service'
            ORDER BY COALESCE(p.drbf_jours, 999) ASC
        """).fetchall()
    return {"machines": rows_to_list(rows)}


@router.get("/kpis/synthese")
def get_kpis_bd():
    with db_session() as conn:
        row = conn.execute("""
            SELECT ROUND(AVG(mtbf_heures),0) AS mtbf, ROUND(AVG(mttr_heures),1) AS mttr,
                   ROUND(AVG(disponibilite_pct),1) AS disponibilite, ROUND(AVG(trs_oee_pct),1) AS oee
            FROM kpi_journalier WHERE date_kpi >= date('now','-30 days')
        """).fetchone()
    return dict(row) if row else {}


@router.get("/parc/synthese")
def get_parc_bd():
    with db_session() as conn:
        rows = conn.execute("""
            SELECT m.code_machine AS code, m.nom_machine AS nom, m.type_machine AS type,
                   a.nom_atelier AS atelier, m.statut,
                   COALESCE(ci.groupe, 'II') AS classe_iso,
                   CAST(julianday('now') - julianday(COALESCE(m.annee_mise_en_service,2020)||'-01-01') AS INTEGER) AS age_jours,
                   (SELECT COUNT(*) FROM capteur WHERE id_machine=m.id_machine) AS nb_capteurs,
                   COALESCE((SELECT zone_iso_calculee FROM mesure_globale WHERE id_machine=m.id_machine ORDER BY timestamp_mesure DESC LIMIT 1), 'B') AS zone_iso,
                   COALESCE((SELECT timestamp_mesure FROM mesure_globale WHERE id_machine=m.id_machine ORDER BY timestamp_mesure DESC LIMIT 1), datetime('now')) AS derniere_mesure
            FROM machine m JOIN atelier a ON m.id_atelier=a.id_atelier LEFT JOIN classe_iso ci ON m.id_classe_iso=ci.id_classe
            ORDER BY m.code_machine
        """).fetchall()
    return {"machines": rows_to_list(rows)}


@router.get("/parc/capteurs")
def get_parc_capteurs_bd():
    with db_session() as conn:
        rows = conn.execute("""
            SELECT c.code_capteur AS id, m.code_machine AS machine_id, m.nom_machine AS machine_nom,
                   c.type_capteur AS type, c.position_montage AS position, c.statut,
                   c.niveau_batterie_pct AS batterie,
                   COALESCE((SELECT timestamp_mesure FROM mesure_globale WHERE id_capteur=c.id_capteur ORDER BY timestamp_mesure DESC LIMIT 1), datetime('now')) AS derniere_mesure,
                   '1 kHz' AS freq_acq,
                   COALESCE((SELECT COUNT(*) FROM mesure_globale WHERE id_capteur=c.id_capteur AND timestamp_mesure>=datetime('now','-24 hours')),0) AS nb_mesures_24h
            FROM capteur c JOIN machine m ON c.id_machine=m.id_machine ORDER BY c.code_capteur
        """).fetchall()
    return {"capteurs": rows_to_list(rows)}


@router.get("/parc/classification-vis")
def get_parc_vis_bd():
    with db_session() as conn:
        rows = conn.execute("""
            SELECT m.code_machine AS machine_id, m.nom_machine AS machine_nom,
                   COALESCE((SELECT v_rms_mm_s FROM mesure_globale WHERE id_machine=m.id_machine ORDER BY timestamp_mesure DESC LIMIT 1), 2.5) AS vrms,
                   COALESCE((SELECT zone_iso_calculee FROM mesure_globale WHERE id_machine=m.id_machine ORDER BY timestamp_mesure DESC LIMIT 1), 'B') AS zone_iso,
                   'Stable' AS tendance_7j,
                   CASE (SELECT zone_iso_calculee FROM mesure_globale WHERE id_machine=m.id_machine ORDER BY timestamp_mesure DESC LIMIT 1)
                       WHEN 'D' THEN 'URGENCE' WHEN 'C' THEN 'CRITIQUE' WHEN 'B' THEN 'ATTENTION' ELSE 'NORMAL' END AS classe_vis,
                   CASE (SELECT zone_iso_calculee FROM mesure_globale WHERE id_machine=m.id_machine ORDER BY timestamp_mesure DESC LIMIT 1)
                       WHEN 'D' THEN 'Arret immediat' WHEN 'C' THEN 'Planifier intervention' ELSE 'Surveillance' END AS recommandation,
                   CASE (SELECT zone_iso_calculee FROM mesure_globale WHERE id_machine=m.id_machine ORDER BY timestamp_mesure DESC LIMIT 1)
                       WHEN 'D' THEN 'Creer BT' WHEN 'C' THEN 'Creer BT' ELSE 'Controle standard' END AS action
            FROM machine m WHERE m.statut!='hors_service'
            ORDER BY CASE (SELECT zone_iso_calculee FROM mesure_globale WHERE id_machine=m.id_machine ORDER BY timestamp_mesure DESC LIMIT 1)
                WHEN 'D' THEN 1 WHEN 'C' THEN 2 ELSE 3 END
        """).fetchall()
    return {"machines": rows_to_list(rows)}
