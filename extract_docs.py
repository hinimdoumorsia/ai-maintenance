#!/usr/bin/env python3
"""
extract_docs.py — Extraction batch PDF → JSON pour DocsTechniques (AI Maintenance)

Usage :
    python extract_docs.py

Dépendances :
    pip install pymupdf pdfplumber Pillow

Sortie :
    public/docs/data/index.json          — manifeste de navigation
    public/docs/data/{slug}.json         — contenu JSON par document
    public/docs/img/{slug}/p{N}_img{M}.png — images extraites
"""
from __future__ import annotations

import io
import json
import re
import sys
from io import BytesIO
from pathlib import Path

# Forcer l'encodage UTF-8 sur la console Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# ── Vérification des dépendances ──────────────────────────────────────────────
try:
    import fitz  # PyMuPDF
except ImportError:
    sys.exit("❌ PyMuPDF manquant. Installer : pip install pymupdf")

try:
    import pdfplumber
except ImportError:
    sys.exit("❌ pdfplumber manquant. Installer : pip install pdfplumber")

try:
    from PIL import Image
except ImportError:
    sys.exit("❌ Pillow manquant. Installer : pip install Pillow")

# ── Chemins ───────────────────────────────────────────────────────────────────
ROOT     = Path(__file__).parent
PDF_DIR  = ROOT / "documentation"
OUT_DIR  = ROOT / "public" / "docs" / "data"
IMG_DIR  = ROOT / "public" / "docs" / "img"
OUT_DIR.mkdir(parents=True, exist_ok=True)
IMG_DIR.mkdir(parents=True, exist_ok=True)

# ── Classification par thème (du plus spécifique au plus général) ─────────────
THEMES: list[tuple[str, list[str]]] = [
    ("roulements",               ["bearing", "roulement", "skf", "nsk", "bpfo", "bpfi",
                                   "bsf", "cooper", "ball", "roller", "inner", "outer"]),
    ("analyse-vibratoire",       ["vibrat", "spectre", "fft", "vrms", "kurtosis", "crest",
                                   "01db", "frequenc", "oneprod", "accelr", "deplacem"]),
    ("defauts-machines",         ["defaut", "fault", "anomalie", "deterioration",
                                   "usure", "balourd", "desalign", "cavitat"]),
    ("normes-surveillance",      ["norme", "iso", "standard", "surveillance",
                                   "seuil", "zone", "classe", "10816", "13374"]),
    ("maintenance-conditionnelle", ["maintenance", "preventi", "conditionn",
                                    "prognos", "pdm", "cbm", "rul"]),
    ("organisation-maintenance", ["organis", "cours", "gestion", "strategi",
                                  "curatif", "preventif", "planif"]),
]


# ── Utilitaires ───────────────────────────────────────────────────────────────

def _slugify(name: str) -> str:
    """Convertit un nom de fichier en slug URL-safe."""
    name = re.sub(r"[^\w\s-]", "", name.lower()).strip()
    name = re.sub(r"[\s]+", "-", name)
    return re.sub(r"-+", "-", name)[:60]


def _detect_theme(filename: str, sample_text: str) -> str:
    """Détecte automatiquement le thème du document."""
    combined = (filename + " " + sample_text).lower()
    for theme, keywords in THEMES:
        if any(kw in combined for kw in keywords):
            return theme
    return "general"


def _analyse_font_sizes(doc: fitz.Document) -> dict:
    """
    Analyse la distribution des tailles de police sur les premières pages
    pour calibrer les seuils h1/h2/h3/body.
    """
    size_counts: dict[float, int] = {}
    for page in list(doc)[:min(5, len(doc))]:
        for b in page.get_text("dict").get("blocks", []):
            if b["type"] != 0:
                continue
            for line in b.get("lines", []):
                for span in line.get("spans", []):
                    s = round(span["size"], 1)
                    size_counts[s] = size_counts.get(s, 0) + 1

    if not size_counts:
        return {"h1": 20.0, "h2": 16.0, "h3": 13.0, "body": 11.0}

    # La taille la plus fréquente = corps de texte
    body = max(size_counts, key=lambda s: size_counts[s])
    # Tailles supérieures au corps = niveaux de titre
    bigger = sorted([s for s in size_counts if s > body + 1.0], reverse=True)
    h1 = bigger[0] if len(bigger) > 0 else body + 8.0
    h2 = bigger[1] if len(bigger) > 1 else body + 4.0
    h3 = bigger[2] if len(bigger) > 2 else body + 2.0
    return {"h1": h1, "h2": h2, "h3": h3, "body": body}


def _heading_level(size: float, flags: int, thresholds: dict) -> int | None:
    """Retourne le niveau de titre (1/2/3) ou None si c'est du corps."""
    is_bold = bool(flags & 16)
    if size >= thresholds["h1"] - 0.5:
        return 1
    if size >= thresholds["h2"] - 0.5:
        return 2
    if size >= thresholds["h3"] - 0.5 or (is_bold and size > thresholds["body"] + 1.0):
        return 3
    return None


def _save_image(img_data: bytes, slug: str, page_n: int, img_n: int) -> str | None:
    """
    Sauvegarde l'image extraite du PDF dans public/docs/img/{slug}/.
    Retourne l'URL publique (ex: /docs/img/slug/p001_img00.png) ou None si ignorée.
    """
    try:
        img = Image.open(BytesIO(img_data))
        w, h = img.size
        if w < 50 or h < 50:
            return None  # Ignorer les icônes / traits de décoration

        img_dir = IMG_DIR / slug
        img_dir.mkdir(parents=True, exist_ok=True)

        fname = f"p{page_n:03d}_img{img_n:02d}.png"
        out_path = img_dir / fname

        # Normaliser en RGB(A) avant de sauvegarder en PNG
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGB")
        img.save(out_path, "PNG", optimize=True)

        return f"/docs/img/{slug}/{fname}"
    except Exception as exc:
        print(f"    ⚠ Image ignorée ({exc})")
        return None


def _extract_tables_from_plumber_page(plumber_page) -> list[dict]:
    """Extrait les tableaux d'une page via pdfplumber et les retourne comme blocs JSON."""
    tables = []
    try:
        raw_tables = plumber_page.extract_tables() if plumber_page else []
        for tbl in (raw_tables or []):
            if not tbl or len(tbl) < 2:
                continue
            headers = [str(c or "").strip() for c in tbl[0]]
            rows = [
                [str(cell or "").strip() for cell in row]
                for row in tbl[1:]
                if any(str(cell or "").strip() for cell in row)
            ]
            if headers and rows:
                tables.append({
                    "type": "table",
                    "headers": headers,
                    "rows": rows,
                    "_y0": 9000,  # insérer après le texte de la page
                })
    except Exception:
        pass
    return tables


def _extract_page_blocks(
    fitz_page: fitz.Page,
    plumber_page,
    slug: str,
    page_n: int,
    thresholds: dict,
) -> list[dict]:
    """
    Extrait tous les blocs d'une page (texte, images, tableaux)
    triés par position verticale pour respecter l'ordre naturel de lecture.
    """
    raw: list[dict] = []

    # ── Blocs texte ──────────────────────────────────────────────────────────
    for b in fitz_page.get_text("dict").get("blocks", []):
        if b["type"] != 0:
            continue
        y0 = b["bbox"][1]
        parts, max_size, max_flags = [], 0.0, 0
        for line in b.get("lines", []):
            for span in line.get("spans", []):
                t = span["text"].strip()
                if t:
                    parts.append(t)
                if span["size"] > max_size:
                    max_size = span["size"]
                    max_flags = span.get("flags", 0)
        text = " ".join(parts).strip()
        if len(text) < 3:
            continue
        raw.append({"_type": "text", "_y0": y0,
                    "size": max_size, "flags": max_flags, "text": text})

    # ── Images ───────────────────────────────────────────────────────────────
    seen_xrefs: set[int] = set()
    img_n = 0
    for img_info in fitz_page.get_images(full=True):
        xref = img_info[0]
        if xref in seen_xrefs:
            continue
        seen_xrefs.add(xref)
        try:
            base_img = fitz_page.parent.extract_image(xref)
            img_data = base_img["image"]

            # Position Y de l'image sur la page
            try:
                bboxes = fitz_page.get_image_bbox(img_info)
                y0 = float(bboxes.y0) if hasattr(bboxes, "y0") else 5000
            except Exception:
                y0 = 5000

            url = _save_image(img_data, slug, page_n, img_n)
            if url:
                raw.append({"_type": "image", "_y0": y0,
                             "src": url, "caption": f"Figure — page {page_n + 1}"})
                img_n += 1
        except Exception:
            pass

    # ── Tableaux (pdfplumber) ─────────────────────────────────────────────────
    raw.extend(_extract_tables_from_plumber_page(plumber_page))

    # ── Trier par position Y ──────────────────────────────────────────────────
    raw.sort(key=lambda b: b.get("_y0", 9999))

    # ── Construire les blocs finaux ───────────────────────────────────────────
    result: list[dict] = []
    for b in raw:
        btype = b.get("_type") or b.get("type")
        if btype == "image":
            result.append({"type": "image", "src": b["src"], "caption": b["caption"]})
        elif btype == "table":
            result.append({"type": "table",
                           "headers": b["headers"], "rows": b["rows"]})
        else:  # text
            level = _heading_level(b["size"], b.get("flags", 0), thresholds)
            if level:
                result.append({"type": "heading", "level": level, "text": b["text"]})
            else:
                result.append({"type": "text", "text": b["text"]})

    return result


def _detect_title(doc: fitz.Document, pdf_path: Path) -> str:
    """Tente de trouver le titre du document (première grande ligne de texte)."""
    try:
        lines = [l.strip() for l in doc[0].get_text("text").split("\n") if l.strip()]
        # Retourner la première ligne non vide de longueur raisonnable
        for line in lines:
            if 4 < len(line) < 150:
                return line
    except Exception:
        pass
    return pdf_path.stem.replace("-", " ").replace("_", " ").title()


def process_pdf(pdf_path: Path) -> dict | None:
    """
    Traite un PDF et retourne sa structure JSON complète.
    Retourne None en cas d'erreur.
    """
    print(f"\n📄 {pdf_path.name}")
    slug = _slugify(pdf_path.stem)

    try:
        fitz_doc = fitz.open(str(pdf_path))
    except Exception as exc:
        print(f"  ❌ Ouverture impossible : {exc}")
        return None

    thresholds = _analyse_font_sizes(fitz_doc)
    print(f"  📏 Seuils : h1≥{thresholds['h1']:.0f}  h2≥{thresholds['h2']:.0f}  "
          f"h3≥{thresholds['h3']:.0f}  body≈{thresholds['body']:.0f}")

    title = _detect_title(fitz_doc, pdf_path)

    # Échantillon de texte pour détecter le thème
    sample = ""
    for i in range(min(3, len(fitz_doc))):
        sample += fitz_doc[i].get_text("text")[:400]
    theme = _detect_theme(pdf_path.stem, sample)

    # Ouvrir pdfplumber pour les tableaux
    try:
        plumber_doc = pdfplumber.open(str(pdf_path))
        plumber_pages = plumber_doc.pages
    except Exception:
        plumber_doc = None
        plumber_pages = []

    pages = []
    total = len(fitz_doc)
    for page_n in range(total):
        print(f"  ⏳ {page_n + 1}/{total}…", end="\r", flush=True)
        fitz_page  = fitz_doc[page_n]
        plmb_page  = plumber_pages[page_n] if plumber_pages and page_n < len(plumber_pages) else None
        blocks     = _extract_page_blocks(fitz_page, plmb_page, slug, page_n, thresholds)
        if blocks:
            pages.append({"pageNumber": page_n + 1, "blocks": blocks})

    print(f"  ✅ {total} pages  |  thème : {theme}  |  titre : {title[:60]}")

    if plumber_doc:
        try:
            plumber_doc.close()
        except Exception:
            pass
    fitz_doc.close()

    return {
        "id":     slug,
        "title":  title[:120],
        "source": pdf_path.name,
        "theme":  theme,
        "pages":  pages,
    }


def main() -> None:
    if not PDF_DIR.exists():
        sys.exit(f"❌ Dossier documentation/ introuvable : {PDF_DIR}")

    pdf_files = sorted(PDF_DIR.glob("*.pdf"))
    if not pdf_files:
        sys.exit(f"❌ Aucun PDF dans {PDF_DIR}")

    print(f"🔍  {len(pdf_files)} PDFs dans {PDF_DIR}\n")

    index: list[dict] = []

    for pdf_path in pdf_files:
        result = process_pdf(pdf_path)
        if not result:
            continue

        # Vérifier la taille estimée (images exclues = texte seul)
        out_file = OUT_DIR / f"{result['id']}.json"
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, separators=(",", ":"))

        size_kb = out_file.stat().st_size // 1024
        n_imgs  = sum(
            1
            for page in result["pages"]
            for b in page["blocks"]
            if b["type"] == "image"
        )
        print(f"  💾  {out_file.name}  ({size_kb} KB, {n_imgs} images)")

        index.append({
            "id":      result["id"],
            "title":   result["title"],
            "source":  result["source"],
            "theme":   result["theme"],
            "n_pages": len(result["pages"]),
        })

    # Index global
    index_file = OUT_DIR / "index.json"
    with open(index_file, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    print(f"\n✅  {len(index)} documents indexés")
    print(f"   Index   : {index_file}")
    print(f"   Docs    : {OUT_DIR}")
    print(f"   Images  : {IMG_DIR}")
    print("\n▶  Prochain : relancer le frontend (npm run dev)")


if __name__ == "__main__":
    main()
