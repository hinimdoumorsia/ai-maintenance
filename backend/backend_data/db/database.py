# backend/db/database.py
# Connexion SQLite — accès direct sqlite3 (pas d'ORM pour les vues SQL)

import sqlite3
from pathlib import Path
from contextlib import contextmanager

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH  = BASE_DIR / "db" / "ai_maintenance.db"


def get_connection() -> sqlite3.Connection:
    """Ouvre une connexion SQLite avec row_factory et FK activées."""
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


@contextmanager
def db_session():
    """Context manager — ouvre / ferme proprement la connexion."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def rows_to_list(rows) -> list[dict]:
    """Convertit des sqlite3.Row en liste de dicts JSON-sérialisables."""
    return [dict(row) for row in rows]


def init_db():
    """Initialise la BD depuis schema.sql si elle n'existe pas encore."""
    if not DB_PATH.exists():
        schema_path = BASE_DIR / "db" / "schema.sql"
        if schema_path.exists():
            conn = sqlite3.connect(str(DB_PATH))
            with open(schema_path, "r", encoding="utf-8") as f:
                conn.executescript(f.read())
            conn.close()
            print(f"[DB] Base créée depuis schema.sql : {DB_PATH}")
        else:
            print("[DB] schema.sql introuvable — BD non initialisée")
    else:
        print(f"[DB] BD existante : {DB_PATH}")


def get_dataset_paths(dataset_id: str) -> dict:
    """Retourne les chemins des sous-dossiers pour un dataset donné.
    Crée les dossiers s'ils n'existent pas."""
    base = BASE_DIR / "data" / "datasets" / dataset_id
    paths = {
        "base": base,
        "raw": base / "raw",
        "processed": base / "processed",
        "plots": base / "plots",
        "reports": base / "reports"
    }
    for path in paths.values():
        path.mkdir(parents=True, exist_ok=True)
    return {k: str(v) for k, v in paths.items()}

