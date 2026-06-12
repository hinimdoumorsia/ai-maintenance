# backend/agents/vibration_pdf.py
# Génération du rapport PDF d'analyse vibratoire (fpdf2)
# Appelé par GET /api/donnees/datasets/{id}/download/vibration-report

from __future__ import annotations
from pathlib import Path
from datetime import datetime

from fpdf import FPDF
from agents.eda_agent import REPORTS_DIR


# ─── Helpers PDF (même style qu'eda_agent.py) ────────────────────────────────

def _S(v) -> str:
    if v is None:
        return ""
    text = str(v)
    replacements = {
        '—': '-', '–': '-', '‘': "'", '’': "'",
        '“': '"', '”': '"', '•': '*', '…': '...',
        '→': '->', 'é': 'e', 'è': 'e', 'ê': 'e',
        'à': 'a', 'â': 'a', 'î': 'i', 'ô': 'o',
        'ù': 'u', 'û': 'u', 'ç': 'c', 'ü': 'u',
        'ë': 'e', 'ï': 'i', 'ï': 'i', 'á': 'a',
        '²': '2', '³': '3', '°': 'deg', '×': 'x',
        ' ': ' ',
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text.encode('latin-1', errors='replace').decode('latin-1')


def _section(pdf: FPDF, number: str, title: str) -> None:
    pdf.ln(5)
    pdf.set_draw_color(249, 115, 22)
    pdf.set_fill_color(255, 247, 237)
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(180, 83, 9)
    pdf.cell(0, 9, _S(f"  {number}.  {title}"), new_x="LMARGIN", new_y="NEXT", fill=True)
    pdf.set_text_color(55, 65, 81)
    pdf.set_font("Helvetica", "", 10)
    pdf.ln(2)


def _subsection(pdf: FPDF, title: str) -> None:
    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(37, 99, 235)
    pdf.cell(0, 6, _S(f"  > {title}"), new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(55, 65, 81)
    pdf.ln(1)


def _kv(pdf: FPDF, label: str, value: str, lw: int = 70) -> None:
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(75, 85, 99)
    pdf.cell(lw, 6, _S(f"  {label}"), border=0)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 6, _S(str(value)), new_x="LMARGIN", new_y="NEXT")


def _para(pdf: FPDF, text: str, size: int = 9) -> None:
    pdf.set_font("Helvetica", "", size)
    pdf.set_text_color(55, 65, 81)
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(0, 5, _S(text))


def _tbl_header(pdf: FPDF, widths: list[int], headers: list[str], bg=(249, 115, 22)) -> None:
    pdf.set_fill_color(*bg)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 8)
    for w, h in zip(widths, headers):
        pdf.cell(w, 7, _S(f"  {h}"), border=1, fill=True)
    pdf.ln()


# ─── Classification ISO ───────────────────────────────────────────────────────

def _classify_iso(vrms: float | None) -> tuple[str, str, tuple]:
    """Retourne (zone, verdict, fill_rgb) selon ISO 10816 Classe II."""
    if vrms is None:
        return "—", "Non mesure", (245, 245, 245)
    if vrms < 2.3:
        return "A", "Bon - aucune action", (240, 253, 244)
    if vrms < 4.5:
        return "B", "Satisfaisant - surveiller", (239, 246, 255)
    if vrms < 7.1:
        return "C", "Inacceptable - planifier", (255, 247, 237)
    return "D", "Dangereux - arreter", (254, 242, 242)


def _zone_text_rgb(zone: str) -> tuple:
    return {"A": (22, 163, 74), "B": (37, 99, 235), "C": (180, 83, 9), "D": (185, 28, 28)}.get(zone, (75, 85, 99))


def _vrms_rgb(vrms: float | None) -> tuple:
    if not vrms:
        return (107, 114, 128)
    if vrms < 2.3:
        return (22, 163, 74)
    if vrms < 4.5:
        return (59, 130, 246)
    if vrms < 7.1:
        return (249, 115, 22)
    return (220, 38, 38)


# ─── Recommandations ─────────────────────────────────────────────────────────

def _build_recs(resume: dict, stats_iso: dict, raw_data: list, spectral_params) -> list[tuple[str, str]]:
    recs: list[tuple[str, str]] = []
    mzd = resume.get("machines_zone_d", 0)
    pct_ab = resume.get("pct_zone_ab", 0)
    pct_c = stats_iso.get("zone_c", 0)
    pct_d = stats_iso.get("zone_d", 0)

    if mzd > 0:
        recs.append(("URGENT", f"{mzd} machine(s) en Zone D : arret immediat et inspection physique requis"))
    if pct_d > 5:
        recs.append(("URGENT", f"{pct_d:.1f}% des mesures en Zone D : risque de defaillance imminente"))
    if pct_c > 20:
        recs.append(("ATTENTION", f"{pct_c:.1f}% des mesures en Zone C : maintenance preventive recommandee sous 2 semaines"))

    high_bpfo = [r for r in raw_data if (r.get("bpfo_amplitude") or 0) >= 0.3]
    high_bpfi = [r for r in raw_data if (r.get("bpfi_amplitude") or 0) >= 0.3]
    if high_bpfo:
        mids = list({r.get("machine_id") for r in high_bpfo})[:3]
        recs.append(("ATTENTION", f"Amplitude BPFO elevee ({', '.join(str(m) for m in mids)}) : defaut bague externe roulement probable"))
    if high_bpfi:
        mids = list({r.get("machine_id") for r in high_bpfi})[:3]
        recs.append(("ATTENTION", f"Amplitude BPFI elevee ({', '.join(str(m) for m in mids)}) : defaut bague interne roulement probable"))

    high_kurt = [r for r in raw_data if (r.get("kurtosis") or 0) > 4]
    if high_kurt:
        recs.append(("ATTENTION", f"{len(high_kurt)} mesure(s) avec kurtosis > 4 : chocs impulsionnels detectes, surveiller roulements"))

    high_cf = [r for r in raw_data if (r.get("crest_factor") or 0) > 6]
    if high_cf:
        recs.append(("ATTENTION", f"{len(high_cf)} mesure(s) avec Crest Factor > 6 : degre de choc eleve"))

    if pct_ab >= 80:
        recs.append(("OK", f"{pct_ab:.1f}% des mesures en zone A+B : etat general satisfaisant, maintenir surveillance periodique"))
    elif pct_ab >= 60 and not recs:
        recs.append(("OK", f"{pct_ab:.1f}% en zones saines : surveillance mensuelle recommandee"))

    if spectral_params and spectral_params.get("gmf_hz"):
        recs.append(("OK", f"Surveiller le pic GMF a {spectral_params['gmf_hz']} Hz lors des prochaines mesures"))

    if not recs:
        recs.append(("OK", "Aucun defaut majeur detecte. Maintenir le programme de surveillance actuel."))

    return recs


# ─── Fonction principale ──────────────────────────────────────────────────────

def generate_vibration_pdf(dataset_name: str, analysis: dict, dataset_id: int) -> Path:
    """
    Genere un rapport PDF complet d'analyse vibratoire.
    Retourne le chemin du fichier PDF genere dans REPORTS_DIR.
    """
    resume = analysis.get("resume", {})
    stats_iso = analysis.get("stats_iso", {})
    raw_data: list[dict] = analysis.get("raw_data", [])
    machine_params: dict = analysis.get("machine_params", {})
    spectral_params = analysis.get("spectral_params")

    # Derniere mesure par machine
    machine_last: dict[str, dict] = {}
    for r in raw_data:
        mid = r.get("machine_id") or "—"
        if mid != "—":
            machine_last[mid] = r

    vrms_mean: float = resume.get("vrms_moyen") or 0
    pct_ab: float = resume.get("pct_zone_ab") or 0
    mzd: int = resume.get("machines_zone_d") or 0
    defauts_nb: int = resume.get("defauts_detectes") or 0

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.set_margins(15, 15, 15)

    # ══════════════════════════════════════════════════════════════════════════
    # PAGE DE COUVERTURE
    # ══════════════════════════════════════════════════════════════════════════
    pdf.add_page()

    # Bande orange supérieure
    pdf.set_fill_color(249, 115, 22)
    pdf.rect(0, 0, 210, 10, "F")

    pdf.ln(18)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(249, 115, 22)
    pdf.cell(0, 8, "AI MAINTENANCE", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(0, 5, "Systeme de maintenance predictive industrielle", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(22)

    # Titre principal
    pdf.set_font("Helvetica", "B", 24)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 14, "ANALYSE VIBRATOIRE", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(75, 85, 99)
    pdf.cell(0, 8, "Rapport de diagnostic", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(0, 6, "Classification ISO 10816  |  Spectre FFT  |  Defauts roulements", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(12)
    # Séparateur
    pdf.set_draw_color(249, 115, 22)
    pdf.set_line_width(0.6)
    pdf.line(35, pdf.get_y(), 175, pdf.get_y())
    pdf.ln(10)

    # Carte dataset
    card_y = pdf.get_y()
    pdf.set_fill_color(255, 247, 237)
    pdf.set_draw_color(249, 115, 22)
    pdf.set_line_width(0.5)
    card_h = 36 if machine_params.get("vitesse_rpm") else 28
    pdf.rect(30, card_y, 150, card_h, "DF")
    # Barre orange gauche
    pdf.set_fill_color(249, 115, 22)
    pdf.rect(30, card_y, 3, card_h, "F")

    pdf.set_xy(38, card_y + 5)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(180, 83, 9)
    pdf.cell(140, 7, _S(f"Dataset : {dataset_name}"))

    pdf.set_xy(38, card_y + 13)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(75, 85, 99)
    pdf.cell(140, 6, _S(f"Genere le {datetime.now().strftime('%d/%m/%Y')} a {datetime.now().strftime('%H:%M')}"))

    if machine_params.get("vitesse_rpm"):
        pdf.set_xy(38, card_y + 21)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(107, 114, 128)
        pdf.cell(140, 6, _S(f"Vitesse nominale : {machine_params['vitesse_rpm']} tr/min"))

    pdf.set_y(card_y + card_h + 14)

    # Verdict global
    if mzd > 0:
        vtext, vrgb = "ETAT CRITIQUE - INTERVENTION IMMEDIATE REQUISE", (220, 38, 38)
    elif stats_iso.get("zone_c", 0) > 20:
        vtext, vrgb = "ETAT INACCEPTABLE - MAINTENANCE URGENTE", (249, 115, 22)
    elif pct_ab >= 70:
        vtext, vrgb = "ETAT SATISFAISANT - SURVEILLANCE NORMALE", (22, 163, 74)
    else:
        vtext, vrgb = "ETAT ACCEPTABLE - ATTENTION REQUISE", (217, 119, 6)

    pdf.set_fill_color(*vrgb)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 13, _S(f"   {vtext}"), new_x="LMARGIN", new_y="NEXT", fill=True)

    # 4 KPIs de synthèse
    pdf.ln(12)
    kpis_cover = [
        ("V-RMS moyen", f"{vrms_mean:.2f} mm/s", _vrms_rgb(vrms_mean)),
        ("Zone A+B (sain)", f"{pct_ab:.1f} %", (22, 163, 74) if pct_ab >= 70 else (249, 115, 22)),
        ("Machines Zone D", str(mzd), (220, 38, 38) if mzd > 0 else (22, 163, 74)),
        ("Defauts detectes", str(defauts_nb), (249, 115, 22) if defauts_nb > 0 else (22, 163, 74)),
    ]
    box_w, box_h = 40, 20
    spacing = (180 - 4 * box_w) // 3
    bx0 = pdf.l_margin
    by = pdf.get_y()
    for i, (label, value, rgb) in enumerate(kpis_cover):
        bx = bx0 + i * (box_w + spacing)
        pdf.set_xy(bx, by)
        pdf.set_fill_color(250, 250, 250)
        pdf.set_draw_color(*rgb)
        pdf.set_line_width(0.5)
        pdf.rect(bx, by, box_w, box_h, "DF")
        pdf.set_fill_color(*rgb)
        pdf.rect(bx, by, 2.5, box_h, "F")
        pdf.set_xy(bx + 5, by + 2)
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(*rgb)
        pdf.cell(box_w - 7, 8, _S(value))
        pdf.set_xy(bx + 5, by + 11)
        pdf.set_font("Helvetica", "", 7)
        pdf.set_text_color(107, 114, 128)
        pdf.cell(box_w - 7, 6, _S(label))

    # Bande orange inférieure
    pdf.set_y(-18)
    pdf.set_fill_color(249, 115, 22)
    pdf.rect(0, pdf.get_y(), 210, 10, "F")
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "", 7)
    pdf.cell(0, 10, _S(f"  Confidentiel - AI Maintenance | Rapport d'analyse vibratoire | {datetime.now().strftime('%Y')}"))

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 1 — RESUME EXECUTIF
    # ══════════════════════════════════════════════════════════════════════════
    pdf.add_page()
    _section(pdf, "1", "Resume executif")

    _kv(pdf, "V-RMS moyen global", f"{vrms_mean:.2f} mm/s")
    _kv(pdf, "Pourcentage mesures zones A+B (saines)", f"{pct_ab:.1f} %")
    _kv(pdf, "Machines en Zone D (danger)", f"{mzd}")
    _kv(pdf, "Defauts roulements detectes", f"{defauts_nb}")
    _kv(pdf, "Nombre de machines analysees", str(len(machine_last)))
    _kv(pdf, "Nombre de mesures traitees", str(len(raw_data)))
    pdf.ln(3)

    # Barres de distribution ISO
    _subsection(pdf, "Distribution ISO 10816 — repartition des mesures")

    zone_data = [
        ("Zone A — Bon (< 2.3 mm/s)", stats_iso.get("zone_a", 0), (22, 163, 74)),
        ("Zone B — Satisfaisant (2.3-4.5)", stats_iso.get("zone_b", 0), (59, 130, 246)),
        ("Zone C — Inacceptable (4.5-7.1)", stats_iso.get("zone_c", 0), (249, 115, 22)),
        ("Zone D — Dangereux (> 7.1 mm/s)", stats_iso.get("zone_d", 0), (220, 38, 38)),
    ]
    bar_max_w = 110
    for zname, zpct, zrgb in zone_data:
        bar_w = max(1.5, bar_max_w * zpct / 100) if zpct else 1.5
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(55, 65, 81)
        pdf.cell(68, 7, _S(zname))
        pdf.set_fill_color(*zrgb)
        pdf.cell(bar_w, 6, "", fill=True)
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_text_color(*zrgb)
        pdf.cell(0, 6, _S(f"  {zpct:.1f}%"), new_x="LMARGIN", new_y="NEXT")
        pdf.ln(1)

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 2 — CLASSIFICATION ISO PAR MACHINE
    # ══════════════════════════════════════════════════════════════════════════
    _section(pdf, "2", "Classification ISO 10816 par machine")

    if machine_last:
        col_w = [42, 28, 18, 50, 35]
        _tbl_header(pdf, col_w, ["Machine", "V-RMS (mm/s)", "Zone", "Verdict", "Statut"])

        for i, (mid, row) in enumerate(list(machine_last.items())[:25]):
            vrms_m = row.get("v_rms_mm_s")
            zone, verdict, fill_rgb = _classify_iso(vrms_m)
            row_fill = i % 2 == 0

            pdf.set_fill_color(*(fill_rgb if zone != "—" else ((252, 252, 252) if row_fill else (255, 255, 255))))
            pdf.set_text_color(55, 65, 81)
            pdf.set_font("Helvetica", "", 8)

            pdf.cell(col_w[0], 7, _S(f"  {mid}"), border=1, fill=True)
            pdf.cell(col_w[1], 7, _S(f"  {vrms_m:.2f}" if vrms_m is not None else "  —"), border=1, fill=True)

            # Zone avec couleur
            pdf.set_font("Helvetica", "B", 9)
            pdf.set_text_color(*_zone_text_rgb(zone))
            pdf.cell(col_w[2], 7, _S(f"  {zone}"), border=1, fill=True)

            pdf.set_font("Helvetica", "", 8)
            pdf.set_text_color(55, 65, 81)
            pdf.cell(col_w[3], 7, _S(f"  {verdict}"), border=1, fill=True)

            statut = row.get("statut_alarme") or "normal"
            pdf.cell(col_w[4], 7, _S(f"  {statut}"), border=1, fill=True, new_x="LMARGIN", new_y="NEXT")

        pdf.ln(2)
        pdf.set_font("Helvetica", "I", 7)
        pdf.set_text_color(107, 114, 128)
        pdf.cell(0, 5, _S("Classification selon ISO 10816 Classe II (machines 15-75 kW). Seuils : A < 2.3 | B < 4.5 | C < 7.1 | D >= 7.1 mm/s"), new_x="LMARGIN", new_y="NEXT")
    else:
        _para(pdf, "Aucune donnee machine disponible pour la classification.")

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 3 — PARAMETRES SPECTRAUX (si disponibles)
    # ══════════════════════════════════════════════════════════════════════════
    sec_n = 3
    if spectral_params:
        _section(pdf, str(sec_n), "Parametres spectraux de la machine")
        sec_n += 1

        _kv(pdf, "Vitesse de rotation", _S(f"{machine_params.get('vitesse_rpm', '—')} tr/min"))
        _kv(pdf, "Frequence de rotation F0 (fr)", _S(f"{spectral_params.get('fr_hz', '—')} Hz"))
        if spectral_params.get("nb_paires_poles") or machine_params.get("nb_paires_poles"):
            _kv(pdf, "Paires de poles", str(machine_params.get("nb_paires_poles") or "—"))
        if spectral_params.get("fe_hz"):
            _kv(pdf, "Frequence electrique (fe = p x fr)", _S(f"{spectral_params['fe_hz']} Hz  —  {spectral_params.get('fe_label', '')}"))
        if machine_params.get("nb_dents_engrenage"):
            _kv(pdf, "Nombre de dents engrenage (Z)", str(machine_params["nb_dents_engrenage"]))
        if spectral_params.get("gmf_hz"):
            _kv(pdf, "GMF engrenage (Z x fr)", _S(f"{spectral_params['gmf_hz']} Hz  —  {spectral_params.get('gmf_label', '')}"))

        harmoniques = spectral_params.get("harmoniques", {})
        if harmoniques:
            pdf.ln(2)
            _subsection(pdf, "Harmoniques de rotation")
            col_h = [50, 50]
            _tbl_header(pdf, col_h, ["Harmonique", "Frequence (Hz)"], bg=(75, 85, 99))
            for harm_name, freq in harmoniques.items():
                pdf.set_fill_color(255, 247, 237)
                pdf.set_text_color(55, 65, 81)
                pdf.set_font("Helvetica", "", 9)
                pdf.cell(col_h[0], 6, _S(f"  {harm_name}"), border=1, fill=True)
                pdf.cell(col_h[1], 6, _S(f"  {freq} Hz"), border=1, fill=True, new_x="LMARGIN", new_y="NEXT")

        # Tableau comparaison signatures spectrales
        pdf.ln(4)
        _subsection(pdf, "Signatures spectrales et diagnostics associes")
        fr = spectral_params.get("fr_hz") or 0
        gmf = spectral_params.get("gmf_hz") or "—"

        sig_rows = [
            ("Balourd", f"1 pic dominant a F0 = {fr} Hz", "1xfr", "Masse excentree, usure"),
            ("Desalignement", f"Pics 2F0 ({round(2*fr,1)} Hz) et 3F0 dominants", "2xfr, 3xfr", "Defaut alignement arbre"),
            ("Defaut engrenage", f"Pic a GMF = {gmf} Hz", "Z x fr", "Usure denture, ecaillage"),
            ("Defaut roulement", "Famille Fd non-synchrone", "BPFO / BPFI / BSF", "Usure bague, bille, cage"),
        ]
        col_sig = [38, 52, 30, 52]
        _tbl_header(pdf, col_sig, ["Defaut", "Signature FFT", "Freq. cle", "Cause probable"], bg=(75, 85, 99))
        for i, (d, sig, freq, cause) in enumerate(sig_rows):
            fill = i % 2 == 0
            pdf.set_fill_color(250, 250, 252) if fill else pdf.set_fill_color(255, 255, 255)
            pdf.set_text_color(55, 65, 81)
            pdf.set_font("Helvetica", "", 8)
            pdf.cell(col_sig[0], 6, _S(f"  {d}"), border=1, fill=fill)
            pdf.cell(col_sig[1], 6, _S(f"  {sig}"), border=1, fill=fill)
            pdf.cell(col_sig[2], 6, _S(f"  {freq}"), border=1, fill=fill)
            pdf.cell(col_sig[3], 6, _S(f"  {cause}"), border=1, fill=fill, new_x="LMARGIN", new_y="NEXT")

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION — ANALYSE DEFAUTS ROULEMENTS
    # ══════════════════════════════════════════════════════════════════════════
    _section(pdf, str(sec_n), "Analyse des defauts roulements")
    sec_n += 1

    has_bearing = any(
        (r.get("bpfo_amplitude") or 0) + (r.get("bpfi_amplitude") or 0) + (r.get("bsf_amplitude") or 0) > 0
        for r in raw_data
    )

    if has_bearing and machine_last:
        col_b = [38, 26, 26, 26, 26, 25, 26]
        _tbl_header(pdf, col_b, ["Machine", "F0 (Hz)", "BPFO amp", "BPFI amp", "BSF amp", "Max amp", "Severite"])

        for mid, row in list(machine_last.items())[:20]:
            bpfo = row.get("bpfo_amplitude") or 0
            bpfi = row.get("bpfi_amplitude") or 0
            bsf = row.get("bsf_amplitude") or 0
            f0 = row.get("f0_hz")
            max_amp = max(bpfo, bpfi, bsf)

            if max_amp >= 0.5:
                sev, sev_rgb = "CRITIQUE", (220, 38, 38)
            elif max_amp >= 0.2:
                sev, sev_rgb = "ATTENTION", (249, 115, 22)
            else:
                sev, sev_rgb = "Normal", (22, 163, 74)

            pdf.set_text_color(55, 65, 81)
            pdf.set_font("Helvetica", "", 8)
            pdf.cell(col_b[0], 6, _S(f"  {mid}"), border=1)
            pdf.cell(col_b[1], 6, _S(f"  {f0:.1f}" if f0 else "  —"), border=1)
            pdf.cell(col_b[2], 6, _S(f"  {bpfo:.3f}" if bpfo else "  —"), border=1)
            pdf.cell(col_b[3], 6, _S(f"  {bpfi:.3f}" if bpfi else "  —"), border=1)
            pdf.cell(col_b[4], 6, _S(f"  {bsf:.3f}" if bsf else "  —"), border=1)
            pdf.cell(col_b[5], 6, _S(f"  {max_amp:.3f}" if max_amp else "  —"), border=1)
            pdf.set_font("Helvetica", "B", 8)
            pdf.set_text_color(*sev_rgb)
            pdf.cell(col_b[6], 6, _S(f"  {sev}"), border=1, new_x="LMARGIN", new_y="NEXT")

        pdf.ln(2)
        pdf.set_font("Helvetica", "I", 7)
        pdf.set_text_color(107, 114, 128)
        _para(pdf, "Seuils de severite amplitude normalisee : Normal < 0.2  |  Attention 0.2-0.5  |  Critique >= 0.5", 7)
    else:
        _para(pdf, "Colonnes BPFO/BPFI/BSF non detectees dans ce dataset. Chargez un dataset vibratoire avec colonnes d'amplitude de defaut.")

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION — INDICATEURS COMPLEMENTAIRES
    # ══════════════════════════════════════════════════════════════════════════
    _section(pdf, str(sec_n), "Indicateurs complementaires")
    sec_n += 1

    cf_vals = [r["crest_factor"] for r in raw_data if r.get("crest_factor") is not None]
    kurt_vals = [r["kurtosis"] for r in raw_data if r.get("kurtosis") is not None]
    arms_vals = [r["a_rms_g"] for r in raw_data if r.get("a_rms_g") is not None]

    if cf_vals:
        cf_mean = sum(cf_vals) / len(cf_vals)
        cf_max = max(cf_vals)
        _kv(pdf, "Crest Factor moyen", f"{cf_mean:.2f}  (max : {cf_max:.2f})")
        if cf_mean > 6:
            pdf.set_font("Helvetica", "I", 8)
            pdf.set_text_color(249, 115, 22)
            pdf.cell(0, 5, _S("    -> CF > 6 : presence probable de chocs (defaut roulement ou engrenage)"), new_x="LMARGIN", new_y="NEXT")
            pdf.set_text_color(55, 65, 81)

    if kurt_vals:
        k_mean = sum(kurt_vals) / len(kurt_vals)
        k_max = max(kurt_vals)
        _kv(pdf, "Kurtosis moyen", f"{k_mean:.2f}  (max : {k_max:.2f})")
        if k_mean > 4:
            pdf.set_font("Helvetica", "I", 8)
            pdf.set_text_color(249, 115, 22)
            pdf.cell(0, 5, _S("    -> Kurtosis > 4 : distribution non-gaussienne, defaut impulsionnel probable"), new_x="LMARGIN", new_y="NEXT")
            pdf.set_text_color(55, 65, 81)

    if arms_vals:
        arms_mean = sum(arms_vals) / len(arms_vals)
        _kv(pdf, "Acceleration RMS moyenne", f"{arms_mean:.3f} g")

    if cf_vals and arms_vals and len(cf_vals) == len(arms_vals):
        fk_vals = [cf * (a ** 2) for cf, a in zip(cf_vals, arms_vals)]
        _kv(pdf, "Facteur K moyen (CF x A_RMS^2)", f"{sum(fk_vals)/len(fk_vals):.4f}")

    if not cf_vals and not kurt_vals and not arms_vals:
        _para(pdf, "Donnees Crest Factor / Kurtosis / A-RMS non disponibles dans ce dataset.")

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION — RECOMMANDATIONS
    # ══════════════════════════════════════════════════════════════════════════
    _section(pdf, str(sec_n), "Recommandations et plan d'action")

    recs = _build_recs(resume, stats_iso, raw_data, spectral_params)
    for priority, text in recs:
        if priority == "URGENT":
            prgb = (220, 38, 38)
        elif priority == "ATTENTION":
            prgb = (249, 115, 22)
        else:
            prgb = (22, 163, 74)

        pdf.set_fill_color(*prgb)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("Helvetica", "B", 8)
        pdf.cell(22, 7, _S(f"  {priority}"), fill=True)
        pdf.set_fill_color(255, 255, 255)
        pdf.set_text_color(55, 65, 81)
        pdf.set_font("Helvetica", "", 9)
        # Multi-cell pour le texte long
        x_after = pdf.get_x()
        y_after = pdf.get_y()
        pdf.set_xy(x_after, y_after)
        pdf.multi_cell(0, 7, _S(f"  {text}"))
        pdf.ln(1)

    # ══════════════════════════════════════════════════════════════════════════
    # NOTE METHODOLOGIQUE
    # ══════════════════════════════════════════════════════════════════════════
    pdf.ln(4)
    pdf.set_draw_color(229, 231, 235)
    pdf.set_line_width(0.2)
    pdf.line(pdf.l_margin, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(3)
    pdf.set_font("Helvetica", "I", 7)
    pdf.set_text_color(156, 163, 175)
    pdf.multi_cell(0, 4, _S(
        "Methodologie : Classification ISO 10816 Classe II (machines 15-75 kW, hauteur arbre 160-315 mm). "
        "Zones : A < 2.3 mm/s (bon) | B 2.3-4.5 (satisfaisant) | C 4.5-7.1 (inacceptable) | D > 7.1 (dangereux). "
        "Seuils Crest Factor : normal < 3.0 | attention 3-6 | critique > 6. "
        "Rapport genere automatiquement par AI Maintenance - Pour usage informatif uniquement."
    ))

    # Sauvegarde
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = REPORTS_DIR / f"vibration_report_{dataset_id}.pdf"
    pdf.output(str(out_path))
    return out_path
