"""
Configuration centrale du pipeline d'entraînement.
Les variables sensibles (clés API) sont chargées depuis le fichier .env
via python-dotenv — jamais écrites en dur dans le code.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# ── Chargement du .env ───────────────────────────────────────────────────────
_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_ENV_PATH)
print(f"[config] .env chargé depuis : {_ENV_PATH}")

# ── Chemins ──────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).resolve().parent.parent
MLFLOW_DIR = BASE_DIR / "mlruns"
MODELS_DIR = BASE_DIR / "models"
LOGS_DIR   = BASE_DIR / "logs"

for d in [MLFLOW_DIR, MODELS_DIR, LOGS_DIR]:
    d.mkdir(exist_ok=True)

# ── MLflow ───────────────────────────────────────────────────────────────────
# Windows : utiliser file:/// avec des slashes normaux
# Linux/Mac : file:// avec chemin absolu
if sys.platform == "win32":
    # Convertit C:\path\to\mlruns en C:/path/to/mlruns puis ajoute file:///
    mlflow_path = MLFLOW_DIR.resolve().as_posix()
    MLFLOW_TRACKING_URI = f"file:///{mlflow_path}"
else:
    MLFLOW_TRACKING_URI = f"file://{MLFLOW_DIR}"

print(f"[config] MLflow tracking URI: {MLFLOW_TRACKING_URI}")

MLFLOW_EXPERIMENT = os.getenv("MLFLOW_EXPERIMENT", "maintenance_predictive")

# ── Groq LLM ─────────────────────────────────────────────────────────────────
GROQ_API_KEY     = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL       = os.getenv("GROQ_MODEL", "llama3-70b-8192")
GROQ_MAX_TOKENS  = 4096
GROQ_TEMPERATURE = 0.0

# ── Prétraitement (outliers) ─────────────────────────────────────────────────
NORMALITY_ALPHA  = 0.05
ZSCORE_THRESHOLD = 3.0
ROLLING_WINDOW   = 5
HEALTH_WEIGHTS   = {"T": 0.3, "V": 0.3, "P": 0.2, "C": 0.2}

# ── Entraînement ─────────────────────────────────────────────────────────────
TEST_SIZE    = 0.2
RANDOM_STATE = 42
CV_FOLDS     = 5

# Random Forest
RF_PARAMS = {
    "n_estimators": 200,
    "max_depth": 10,
    "random_state": RANDOM_STATE
}

# XGBoost
XGB_PARAMS = {
    "n_estimators": 200,
    "max_depth": 6,
    "learning_rate": 0.05,
    "random_state": RANDOM_STATE,
    "eval_metric": "logloss"
}

# CatBoost
CATBOOST_PARAMS = {
    "iterations": 200,
    "depth": 6,
    "learning_rate": 0.05,
    "random_seed": RANDOM_STATE,
    "verbose": False,
    "auto_class_weights": "Balanced",
}

# Extra Trees (Bagging - plus aléatoire que Random Forest)
EXTRA_TREES_PARAMS = {
    "n_estimators": 200,
    "max_depth": 10,
    "random_state": RANDOM_STATE,
    "bootstrap": False,  # Extra Trees n'utilise pas bootstrap par défaut
}


# LightGBM (Boosting - plus rapide que XGBoost)
LIGHTGBM_PARAMS = {
    "n_estimators": 200,
    "max_depth": 6,
    "learning_rate": 0.05,
    "random_state": RANDOM_STATE,
    "verbose": -1,
}

# ── Modèles disponibles ───────────────────────────────────────────────────────
AVAILABLE_MODELS = ["random_forest", "extra_trees", "xgboost", "lightgbm", "catboost"]

# ── Colonnes brutes connues (référence) ───────────────────────────────────────
KNOWN_SENSOR_COLS = ["temperature", "vibration", "pressure",
                     "current", "voltage", "rpm", "humidity"]
KNOWN_DATE_COLS   = ["timestamp", "maintenance_date", "failure_date"]