# 🧠 AI Maintenance — Training Pipeline

Pipeline d'entraînement ML intelligent piloté par un **agent Groq (LLaMA 3-70B)**  
avec sauvegarde automatique dans **MLflow Model Registry**.

---

## 🗂️ Architecture

```
training/
│
├── agent/
│   ├── __init__.py
│   └── training_agent.py       ← Agent Groq (function calling)
│
├── tools/
│   ├── __init__.py
│   ├── registry.py             ← Dispatcher central de tous les tools
│   ├── tool_ingest_data.py     ← Chargement + détection des types
│   ├── tool_preprocess_data.py ← Normalité, imputation, encodage
│   ├── tool_engineer_features.py ← 20+ features (formules physiques)
│   ├── tool_train_model.py     ← Entraînement baseline vs cleaned + MLflow
│   └── tool_save_model.py      ← MLflow Model Registry
│
├── pipeline/
│   ├── __init__.py
│   └── orchestrator.py         ← Pipeline direct (sans LLM)
│
├── api/
│   ├── __init__.py
│   └── main.py                 ← FastAPI + SSE streaming des logs
│
├── config/
│   ├── __init__.py
│   └── settings.py             ← Constantes centralisées
│
├── mlruns/                     ← Tracking MLflow (auto-créé)
├── models/                     ← Artefacts modèles (auto-créé)
├── logs/                       ← Logs API (auto-créé)
├── uploads/                    ← Fichiers uploadés (auto-créé)
│
├── demo.py                     ← Démo sans Groq
└── requirements.txt
```

---

## 🔄 Pipeline de l'Agent

```
Upload fichier
     │
     ▼
[1] ingest_data          → Détecte types (numeric / categorical / date)
     │                     Stats, missing %, candidats cible
     ▼
[2] preprocess_data      → Test Shapiro-Wilk par colonne numérique
     │                     Imputation : moyenne (normale) ou médiane (non-normale)
     │                     Entiers → int (pas de float !)
     │                     Catégorielles → mode + Label Encoding
     │                     Dates → Unix timestamp (ffill + bfill)
     ▼
[3] engineer_features    → 20+ features conditionnelles :
     │                     mean/std/max/min/slope/diff/rolling_mean (température)
     │                     vibration_std, pressure_temp_ratio
     │                     voltage_current_ratio, power_consumption
     │                     zscore_temperature, anomaly_flag (|Z|>3)
     │                     days_since_last_maintenance / failure
     │                     cumulative_runtime, failure_frequency
     │                     temp_x_vibration, health_index, remaining_useful_life
     ▼
[4] train_model          → Run 1 : Baseline (sans suppression outliers)
     │                     Run 2 : Cleaned  (IQR outlier removal)
     │                     Cross-validation (StratifiedKFold)
     │                     Métriques : accuracy / precision / recall / F1 / RMSE / R²
     │                     Les 2 runs loggués dans MLflow
     │                     Comparaison → sélection du meilleur
     ▼
[5] save_model           → MLflow Model Registry
                           Tag "production" si score ≥ 0.80
                           Artefacts : feature_cols.json, preprocessing_report.json
```

---

## 🚀 Démarrage rapide

### 1. Installation
```bash
cd training
pip install -r requirements.txt
```

### 2. Variables d'environnement
```bash
export GROQ_API_KEY="gsk_..."
```

### 3. Démo sans Groq (pipeline direct)
```bash
python demo.py
```

### 4. Lancer l'API (avec agent Groq)
```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

### 5. Consulter MLflow UI
```bash
mlflow ui --backend-store-uri ./mlruns --port 5000
```
→ Ouvrir http://localhost:5000

---

## 🔌 API Endpoints

| Méthode | URL | Description |
|---------|-----|-------------|
| `POST` | `/upload` | Upload fichier + lancer pipeline |
| `GET`  | `/logs/{job_id}` | SSE — logs temps réel |
| `GET`  | `/results/{job_id}` | Résultats complets |
| `GET`  | `/jobs` | Liste des jobs |
| `GET`  | `/health` | Santé de l'API |

### Exemple POST /upload
```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@sensors.csv" \
  -F "model_id=random_forest" \
  -F "target_col=failure" \
  -F "groq_api_key=gsk_..."
```

### Connexion Frontend (SSE)
```typescript
const es = new EventSource(`http://localhost:8000/logs/${jobId}`);
es.onmessage = (e) => {
  const log = JSON.parse(e.data);
  // { type: "dataset"|"preprocess"|"training"|"model"|"explain"|"done"
  //   title: string, detail: string, time: string }
};
```

---

## 🧩 Ajouter un nouveau Tool

1. Créer `tools/tool_mon_outil.py` avec :
   - Fonction `mon_outil(args) → dict`
   - `TOOL_DEFINITION` (JSON Schema Groq)

2. L'importer dans `tools/registry.py` :
   ```python
   from tools.tool_mon_outil import mon_outil, TOOL_DEFINITION as DEF_MON_OUTIL
   TOOL_DEFINITIONS.append(DEF_MON_OUTIL)
   ```

3. Ajouter le cas dans `dispatch_tool()`.

---

## 📈 MLflow

Chaque run loggue :
- **Params** : model_id, run_label, task, n_features, remove_outliers
- **Métriques** : accuracy, precision, recall, f1, cv_mean, cv_std, train_sec
- **Artefacts** : model pickle, feature_cols.json, preprocessing_report.json
- **Tags** : is_production, primary_metric, score

Modèles enregistrés sous le nom `maintenance_<model_id>`.

---

## 🛡️ Règles de preprocessing

| Type | Valeurs manquantes | Condition spéciale |
|------|--------------------|--------------------|
| Numérique (normale) | Moyenne | Si colonne d'entiers → `int(round(mean))` |
| Numérique (non-normale) | Médiane | Si colonne d'entiers → `int(round(median))` |
| Catégorielle | Mode | + Label Encoding automatique |
| Date | ffill → bfill → Unix ts | Conversion en secondes |

Normalité testée via **Shapiro-Wilk** (α = 0.05, max 5000 obs. pour la vitesse).