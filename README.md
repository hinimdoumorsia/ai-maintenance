# AI Maintenance — Maintenance Prédictive Industrielle

## Présentation du projet

Application web de maintenance prédictive pour la surveillance vibratoire des machines tournantes. L'application combine un **agent EDA intelligent** (analyse exploratoire, prétraitement automatique, narration IA via Claude), un **dashboard temps réel** (9 piliers KPI, machines à risque, alertes), et **8 sous-pages d'analyse spécialisée** (vibratoire ISO 10816/20816, pronostic DRBF, KPIs, parc machines, capteurs IoT, classification VIS).

Le système supporte **deux modes** : données temps réel depuis la base SQLite (seed automatique) **ou** analyse de datasets uploadés (CSV, XLSX, TXT, ARFF, ZIP — NASA C-MAPSS, Weka, tabulaires).

**Normes implémentées** : ISO 10816, ISO 20816, ISO 18436, ISO 13306, NF X 60-020, NF E 60-182.

---

## Lancement rapide

```bash
# 1. Backend
cd backend_data
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000

# 2. Frontend (autre terminal)
npm install
npm run dev
```

Accès : **http://localhost:5173**

---

## Architecture

```
src/                              # Frontend React + Vite + Recharts
├── App.jsx                       # Routes + DatasetProvider
├── contexts/
│   ├── DatasetContext.tsx         # Contexte global datasets + polling
│   └── ThemeContext.tsx           # Thème clair/sombre
├── hooks/
│   └── useDatasetForPage.ts      # Compatibilité dataset/page
├── components/
│   └── AppLayout/                # Sidebar + sélecteur dataset global
└── pages/
    ├── Dashboard/                # Tableau de bord (5 composants, 9 piliers KPI)
    ├── Donnees/                  # ★ Page principale — 13 composants
    │   └── components/
    │       ├── ChargementPage.tsx        # Upload drag-drop + liste datasets
    │       ├── VueGenerale.tsx           # 5 onglets EDA (Synthèse, Graphiques...)
    │       ├── AnalyseVibratoire.tsx     # ISO 10816/20816, spectre FFT, roulements
    │       ├── PronosticPage.tsx         # DRBF, courbe dégradation, baignoire
    │       ├── KPIsPage.tsx              # 6 KPI, Pareto, radar ateliers, ratios NF
    │       ├── DonneesParc.tsx           # Parc machines (filtres, expansion)
    │       ├── CapteurIoT.tsx            # Capteurs (batterie, types, statuts)
    │       ├── ClassificationVIS.tsx     # VIS (NORMAL/ATTENTION/CRITIQUE/URGENCE)
    │       └── IncompatibleDatasetMessage.tsx
    ├── Predictions/
    ├── Training/
    ├── Models/
    ├── Agents/
    ├── Outils/
    ├── Maintenance/
    └── Parametres/

backend_data/                    # Backend Python FastAPI
├── main.py                      # Point d'entrée, CORS, routes
├── api/
│   ├── donnees.py               # 24 routes (upload, EDA, plots, téléchargement)
│   ├── dashboard.py             # 6 routes (hero KPI, machines, alertes)
│   ├── admin.py                 # 9 routes (entreprise, machines, capteurs)
│   └── maintenance.py           # 6 routes (planning, BTs, stocks)
├── agents/
│   ├── eda_agent.py             # Agent EDA 10 étapes + ingestion dashboard
│   ├── file_parser.py           # Parser multi-format (CSV/XLSX/TXT/ARFF/ZIP)
│   └── dataset_signatures.py    # Signatures types datasets + seuils ISO
├── db/
│   ├── schema.sql               # 1100 lignes — 21 tables + données seed
│   ├── database.py              # Connexion SQLite + get_dataset_paths()
│   └── ai_maintenance.db        # Base de données (générée au 1er lancement)
├── services/                    # Logique métier par module
└── schemas/                     # Modèles Pydantic

generate_datasets/               # Scripts de génération de données test
└── output/                      # 9 datasets CSV prêts à uploader
```

---

## Pages de l'application

| Page | Route | Composants | Description |
|------|-------|-----------|-------------|
| **Dashboard** | `/` | 5 composants | KPIs temps réel, machines à risque, alertes, fleur 9 piliers |
| **Données — Chargement** | `/donnees` | ChargementPage | Upload CSV/XLSX/TXT/ARFF/ZIP, drag-drop, liste datasets |
| **Données — Vue Générale** | `/donnees` | VueGenerale | 5 onglets EDA : Synthèse, Graphiques, Prétraitement, Recommandations, Aperçu |
| **Données — Analyse Vibratoire** | `/donnees` | AnalyseVibratoire | ISO 10816/20816, spectre FFT simulé, Crest/Kurtosis, roulements, défauts |
| **Données — Pronostic & DRBF** | `/donnees` | PronosticPage | RUL, courbe dégradation, baignoire, distribution RUL |
| **Données — KPIs & Performance** | `/donnees` | KPIsPage | 6 KPI, évolution temporelle, Pareto, radar ateliers, ratios NF |
| **Données — Parc Machines** | `/donnees` | DonneesParc | Tableau filtrable, expansion par machine (capteurs, défauts) |
| **Données — Capteurs IoT** | `/donnees` | CapteurIoT | Compteurs, types capteurs, batterie %, statuts |
| **Données — Classification VIS** | `/donnees` | ClassificationVIS | NORMAL/ATTENTION/CRITIQUE/URGENCE, histogramme |
| **Predictions** | `/predictions` | 9 composants | Soumission fichier, modèle, résultats |
| **Training** | `/entrainement` | 7 composants | Upload dataset, progression, sélection modèle |
| **Models** | `/models` | 8 composants | Registre, performances, déploiement |
| **Agents** | `/agents` | 4 composants | Supervision multi-agents |
| **Outils** | `/outils` | 4 composants | Diagnostic, export, qualité données, logs |
| **Maintenance** | `/maintenance` | 3 composants | Planning, BTs, stocks pièces |
| **Paramètres** | `/parametres` | 2 composants | Entreprise, parc machines config |

---

## Agent EDA — Pipeline de prétraitement

L'agent exécute automatiquement à chaque upload :

| Étape | Action |
|-------|--------|
| 0 | Détection unités (mm/s, °C, bar, A, %, €) |
| 1 | Suppression doublons |
| 2 | Drop colonnes constantes/vides |
| 3 | Parsing datetime + feature engineering |
| 4 | Imputation intelligente (médiane + flag binaire si >5% manquants) |
| 5 | Encodage automatique : one-hot ≤10 cat, label 10-25, frequency >25 |
| 6 | StandardScaler (z-score) |
| 7 | Conversion booléens → int, drop texte résiduel |
| 📄 | Génération rapport PDF + pipeline trace (.txt + .json) |
| 📊 | Génération graphiques PNG (distributions, corrélation, séries temporelles, vibratoires) |
| 🤖 | Narration IA (Claude) — analyse, recommandations, plan prétraitement |
| 📥 | Ingestion automatique dashboard (mesures, KPIs, défauts → BD SQLite) |

---

## Backend — Routes API principales

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/donnees/upload` | Upload dataset + lancement EDA |
| `GET` | `/api/donnees/datasets` | Liste datasets |
| `GET` | `/api/donnees/datasets/{id}` | Détail dataset + résultats EDA |
| `GET` | `/api/donnees/datasets/{id}/download/processed` | CSV propre téléchargeable |
| `GET` | `/api/donnees/datasets/{id}/download/raw` | Fichier brut original |
| `GET` | `/api/donnees/datasets/{id}/download/report` | Rapport PDF |
| `GET` | `/api/donnees/datasets/{id}/download/preprocessing-trace` | Trace prétraitement (.txt) |
| `GET` | `/api/donnees/datasets/{id}/plots` | Liste graphiques PNG |
| `GET` | `/api/donnees/datasets/{id}/vibration-analysis` | Analyse vibratoire calculée |
| `GET` | `/api/donnees/datasets/{id}/kpi-analysis` | KPIs calculés |
| `GET` | `/api/donnees/datasets/{id}/pronostic-analysis` | Pronostic calculé |
| `GET` | `/api/donnees/pronostic/synthese` | Synthèse pronostic BD |
| `GET` | `/api/donnees/parc/synthese` | Parc machines BD |
| `GET` | `/api/donnees/parc/capteurs` | Capteurs IoT BD |
| `GET` | `/api/dashboard/hero` | KPIs dashboard |
| `GET` | `/api/dashboard/machines` | Machines à risque |
| `GET` | `/api/dashboard/categories` | 9 piliers KPI |

---

## Datasets de test

| Fichier | Lignes | Usage |
|---------|--------|-------|
| `vibration_monitoring.csv` | 2880 | Analyse vibratoire (BPFO/BPFI/BSF, roulements) |
| `maintenance_complete.csv` | 600 | Dataset complet (vibration + KPI + pronostic + défauts) |
| `kpi_performance.csv` | 200 | KPIs & Performance (MTBF, MTTR, OEE, disponibilité) |
| `pronostic_drbf.csv` | 270 | Pronostic & DRBF (health_index, RUL) |
| `alerts_anomalies.csv` | 106 | Détection anomalies (pattern_detecte, statut) |
| `daily_kpis.csv` | 2420 | KPIs journaliers multi-ateliers |
| `iot_sensors.csv` | — | Capteurs IoT |
| `machine_health.csv` | — | Santé machines |
| `maintenance_records.csv` | — | Historique maintenance |

---

## Dashboard — Alimentation des données

Le dashboard s'alimente automatiquement :

1. **Au 1er lancement** : `schema.sql` crée les tables et injecte les données seed (12 machines, 18 capteurs, 7 défauts, 30j KPIs, alertes, BTs, pièces)
2. **Script de seed enrichi** : `generate_datasets/5_dashboard_seed.py` injecte 126 capteurs, 48 BTs, 120j KPIs supplémentaires
3. **Ingestion automatique** : chaque dataset uploadé avec colonnes vibration/KPI injecte automatiquement mesures + KPIs + défauts dans la BD

---

## Technologies

| Domaine | Technologie |
|---------|-------------|
| Frontend | React 19, Vite 8, TypeScript/JSX, Recharts 3, Tailwind CSS 3, Lucide React |
| Backend | Python 3.12, FastAPI, SQLite, Pandas, Matplotlib, Seaborn, Scikit-learn, FPDF2 |
| IA / LLM | Claude (Anthropic) — narration EDA + recommandations features |
| Parsing | Chardet, openpyxl, liac-arff, zipfile36 |
| Build | Vite, ESLint, PostCSS |

---

## Statut

Le projet est en phase de finalisation. Toutes les pages Données (8 sous-pages), le Dashboard (9 piliers), et l'agent EDA (10 étapes) sont fonctionnels. Les pages Predictions, Training, Models, Agents, Outils, Maintenance et Paramètres sont en cours.

---

## Contributeurs

- **HINIMDOU MORSIA GUITDAM** — Élève ingénieur IA & Technologie des Données
- **Nankouli Marc Thierry** — Élève ingénieur IA & Technologie des Données
- **Djeri Alassani Oubenoupou** — Élève ingénieur IA & Technologie des Données

**Encadrant : Professeur Zaki**
