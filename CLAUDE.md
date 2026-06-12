# CLAUDE.md — AI Maintenance App

## Vue d'ensemble

Application web SaaS de **maintenance prédictive industrielle** basée sur l'analyse vibratoire, le monitoring IoT et la prédiction IA.

**Stack :**
- Frontend : React 19 + Vite + React Router 7 + Tailwind CSS 3 + Recharts + Lucide icons
- Backend : FastAPI (Python) + SQLite3 + ChromaDB (RAG)
- IA : Anthropic Claude API (chatbot RAG + narration EDA) + SentenceTransformers (embeddings)

**Démarrage :**
```
# Terminal 1 — Backend (port 8000)
cd ai-maintenance/backend
python -m uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend (port 5173)
cd ai-maintenance
npm run dev
```

---

## Structure du projet

```
ai-maintenance/
├── src/
│   ├── App.jsx                    # Routing principal, AuthProvider, DatasetProvider, ChatWidget
│   ├── contexts/
│   │   ├── AuthContext.tsx        # Session localStorage (ai-maint-session), login/signup
│   │   ├── DatasetContext.tsx     # État global des datasets avec polling
│   │   └── ThemeContext.tsx       # Dark/light theme
│   ├── services/api.ts            # Client API centralisé
│   ├── pages/
│   │   ├── Auth/
│   │   │   ├── LoginPage.tsx      # ← INTERVENTION PRÉVUE
│   │   │   └── OnboardingPage.tsx
│   │   ├── Dashboard/index.tsx    # ← INTERVENTION PRÉVUE
│   │   ├── Donnees/index.tsx      # ← INTERVENTION PRÉVUE (+ 13 sous-composants)
│   │   ├── Parametres/index.tsx   # ← INTERVENTION PRÉVUE
│   │   └── [autres pages]        # Predictions, Models, Agents, Outils, Maintenance — PAS D'INTERVENTION
│   └── components/chatbot/        # Widget chatbot (toujours monté dans App.jsx)
├── backend/
│   ├── main.py                    # Point d'entrée combiné (backend_data + training sur port 8000)
│   ├── backend_data/
│   │   ├── main.py                # FastAPI app setup, CORS, routers
│   │   ├── api/
│   │   │   ├── auth.py            # POST /api/auth/login|signup|onboarding
│   │   │   ├── dashboard.py       # GET /api/dashboard/hero|machines|alertes|categories|capteurs|series
│   │   │   ├── donnees.py         # 24 routes upload/EDA/download/analyse
│   │   │   ├── admin.py           # CRUD entreprise + machines + capteurs
│   │   │   ├── chatbot.py         # RAG chatbot streaming SSE
│   │   │   └── maintenance.py
│   │   ├── db/
│   │   │   ├── database.py        # Connection SQLite, session manager
│   │   │   ├── models.py          # Dataclasses/schemas Python
│   │   │   └── schema.sql         # 21 tables (~1100 lignes)
│   │   ├── services/
│   │   │   ├── dashboard_service.py
│   │   │   ├── donnees_service.py
│   │   │   ├── maintenance_service.py
│   │   │   └── admin_service.py
│   │   └── agents/
│   │       ├── eda_agent.py       # Agent EDA : parsing, qualité, preprocessing, génération PNG/PDF
│   │       └── dataset_signatures.py
│   └── training/                  # Pipeline ML indépendant (port 8000, routes /health /upload /jobs)
└── public/docs/data/              # JSONs de documentation (ISO, manuels) pour le chatbot RAG
```

---

## Pages concernées par les interventions

### 1. Dashboard (`src/pages/Dashboard/index.tsx`)

**Ce qu'il affiche :**
- 4 Hero KPIs : Disponibilité %, Économies YTD (€), Machines en alerte, Taux détection prédictif
- Visualisation fleur 9 piliers (SVG cliquable) : Revenue Recovery, Smart Replacement, CBM, IoT, Service Loss, Risk, Workforce, Asset Availability, Predictive Core
- Tableau machines à risque (trié par DRBF croissant = plus urgent en premier)
- Alertes temps réel (dernières 24h)
- Graphiques FFT et VRMS trend
- Grille de santé (50 cellules, code couleur ISO)
- Heatmap 12 mois (pannes par atelier)

**Endpoints backend :**
```
GET /api/dashboard/hero       → { disponibilite_7j, economies_ytd_k, machines_en_alerte, taux_detection_pct, ... }
GET /api/dashboard/machines   → MachineRow[] { id_machine, code_machine, vrms, zone_iso, drbf_jours, ... }
GET /api/dashboard/alertes    → AlerteRow[] { timestamp, niveau, type, title, message, code_machine }
GET /api/dashboard/categories → KpiCats (métriques des 9 piliers)
GET /api/dashboard/capteurs   → santé réseau capteurs
GET /api/dashboard/series     → série temporelle 30 jours
```

---

### 2. Login (`src/pages/Auth/LoginPage.tsx`)

**Mécanisme d'authentification :**
- Pas de JWT ; session stockée en **localStorage** sous la clé `ai-maint-session` (objet JSON)
- Mot de passe : hash SHA256 préfixé `sha256:` dans le champ `utilisateur.service` de SQLite
- Session object : `{ id, nom, prenom, email, role, id_entreprise, onboarding_done }`
- Si `id_entreprise == null` → redirection vers OnboardingPage après login

**Endpoints :**
```
POST /api/auth/login    → user object ou 401
POST /api/auth/signup   → user object créé
POST /api/auth/onboarding → crée entreprise + usine + atelier + machines + capteurs
```

**Flux complet :**
1. Signup → user créé sans `id_entreprise`
2. Redirect → OnboardingPage (wizard multi-étapes : entreprise → machines → capteurs)
3. POST onboarding → `id_entreprise` renseigné
4. Redirect → Dashboard

---

### 3. Donnees (`src/pages/Donnees/index.tsx`)

**13 sous-composants** organisés en groupes :
- **Données** : ChargementPage (upload drag-drop + liste), VueGenerale (5 onglets : Summary/Charts/Preprocessing/Recommendations/Preview)
- **Analyses** : AnalyseVibratoire (zones ISO 10816, calculateur défauts roulements BPFO/BPFI/BSF/FTF), PronosticPage (courbes RUL), KPIsPage (MTBF, MTTR, OEE, disponibilité)
- **Actifs** : DonneesParc (tableau parc machines filtrable), CapteurIoT (capteurs + batterie %), ClassificationVIS (NORMAL/ATTENTION/CRITIQUE/URGENCE)

**Endpoints principaux :**
```
POST /api/donnees/upload                           → { dataset_id, status }
GET  /api/donnees/datasets                         → liste datasets
GET  /api/donnees/datasets/{id}                    → dataset complet + résultats EDA
GET  /api/donnees/datasets/{id}/plots              → liste PNG
GET  /api/donnees/datasets/{id}/vibration-analysis → zones ISO, défauts roulements, raw_data
GET  /api/donnees/datasets/{id}/pronostic-analysis → prédictions RUL par machine
GET  /api/donnees/datasets/{id}/kpi-analysis       → MTBF, MTTR, OEE
GET  /api/donnees/datasets/{id}/preview?n=15       → N premières lignes
GET  /api/donnees/datasets/{id}/compatibility      → matrice compatibilité type dataset
GET  /api/donnees/datasets/{id}/download/processed → CSV nettoyé
GET  /api/donnees/datasets/{id}/download/report    → PDF rapport
POST /api/donnees/datasets/{id}/integrate          → ingestion manuelle en BD
DELETE /api/donnees/datasets/{id}                  → suppression

# Synthèses depuis tables BD (pas EDA)
GET /api/donnees/pronostic/synthese → machines + DRBF depuis table pronostic_drbf
GET /api/donnees/kpis/synthese      → agrégats KPI depuis table kpi_journalier
GET /api/donnees/parc/synthese      → parc machines depuis tables machine + mesure_globale
GET /api/donnees/parc/capteurs      → liste capteurs depuis table capteur
GET /api/donnees/parc/classification-vis → classification VIS depuis mesure_globale
```

**Pipeline EDA (background task après upload) :**
1. Parsing multi-format (CSV, XLSX, TXT, ARFF, ZIP)
2. Détection type dataset : `vibration | kpi | maintenance | machine | generic`
3. Score qualité 0–100 (pénalités : valeurs manquantes, doublons, outliers IQR, skewness)
4. Preprocessing 12 étapes (dédoublonnage, imputation, encoding, scaling RobustScaler/StandardScaler)
5. Génération plots PNG + rapport PDF + narration Claude
6. Status dataset : `uploaded → processing → processed` (ou `error`)

---

### 4. Parametres (`src/pages/Parametres/index.tsx`)

**3 onglets :**
1. **Profil** — informations utilisateur
2. **Entreprise** — formulaire infos société
3. **Parc Machines** — CRUD machines + capteurs associés

**Endpoints :**
```
GET    /api/admin/entreprise?user_id=X
PUT    /api/admin/entreprise
GET    /api/admin/machines?user_id=X
POST   /api/admin/machines
PUT    /api/admin/machines/{id}
DELETE /api/admin/machines/{id}
GET    /api/admin/machines/{id}/capteurs
POST   /api/admin/machines/{id}/capteurs
DELETE /api/admin/capteurs/{id}
```

---

### 5. Documentation / Chatbot

**Chatbot RAG (`src/components/chatbot/`) :**
- Widget toujours monté dans `App.jsx`
- Interroge les PDFs indexés (normes ISO, manuels vibratoires)
- Embeddings : `paraphrase-multilingual-MiniLM-L12-v2` → ChromaDB (`./chroma_db/`)
- LLM : Claude Sonnet via `ANTHROPIC_API_KEY` (fichier `.env`)
- Réponse streamée en SSE avec sources (doc_id, titre, page, extrait)

**Endpoints chatbot :**
```
GET  /api/chatbot/health  → santé RAG + nb chunks + modèle embedding
GET  /api/chatbot/themes  → thèmes documentaires disponibles
POST /api/chatbot/chat    → { message, stream: true } → SSE stream
```

**Documents indexés :** JSONs dans `public/docs/data/` (analyses vibratoires, SKF, ISO, formulaires fréquences)

---

## Base de données SQLite

**Fichier :** `backend/backend_data/db/ai_maintenance.db` (auto-créé au démarrage)
**Schema :** `backend/backend_data/db/schema.sql` (~1100 lignes, mode WAL)

**Tables clés pour les pages d'intervention :**

| Table | Usage |
|---|---|
| `utilisateur` | Auth, profil, rôle, hash mdp dans champ `service` |
| `entreprise` | Infos société (Paramètres, Onboarding) |
| `machine` | Parc machines (Paramètres, Dashboard, Donnees) |
| `capteur` | Capteurs IoT (Paramètres, Donnees) |
| `mesure_globale` | Mesures temps réel (VRMS, zone_iso_calculee) |
| `kpi_journalier` | KPIs quotidiens (disponibilité, MTBF, MTTR, OEE) |
| `pronostic_drbf` | Jours restants avant panne (DRBF) |
| `defaut_detecte` | Défauts actifs détectés |
| `alerte` | Alertes actives (dernières 24h) |
| `economie_predictive` | Économies évitées (Dashboard hero) |
| `dataset` (table EDA) | Upload/statut/résultats EDA des fichiers |

**Hiérarchie :** `entreprise` → `utilisateur` / `usine` → `atelier` → `machine` → `capteur` → `mesure_globale`

---

## Points importants à retenir

**Session & Auth :**
- Pas de JWT côté backend ; tout repose sur localStorage côté frontend
- La clé localStorage est `ai-maint-session`
- Rôles disponibles : `admin, manager_maintenance, analyste_vibratoire, technicien, operateur, direction`
- Pas de vérification de rôle côté backend (UI enforces restrictions)

**CORS :**
- En dev : `allow_origins=["*"]`, `allow_credentials=False`

**Thème (RÈGLE CRITIQUE) :**
- Dark/light via `ThemeContext.tsx` → applique `data-theme="dark"` sur `<html>`
- Variables CSS définies dans `src/index.css` (`:root` et `[data-theme="dark"]`)
- **JAMAIS** de couleurs neutres hardcodées (`#fff`, `white`, `#6b7280`, `#e5e7eb`, etc.) dans :
  - les styles inline JSX (`style={{ background: '#fff' }}` ❌)
  - les fichiers `.css` sans override `[data-theme="dark"]` correspondant
- **TOUJOURS** utiliser les variables de thème :
  - Fonds : `var(--theme-bg)` / `var(--theme-bg-deep)` / `var(--theme-bg-card)` / `var(--theme-bg-hover)` / `var(--theme-input-bg)`
  - Textes : `var(--theme-text)` / `var(--theme-text-muted)` / `var(--theme-text-faint)`
  - Bordures : `var(--theme-border)` / `var(--theme-border-bright)`
  - Ombres : `var(--theme-shadow)`
- Les **couleurs sémantiques** (vert succès `#16a34a`, orange `#f97316`, rouge critique `#dc2626`, jaune `#eab308`, bleu `#3b82f6`) peuvent rester hardcodées — elles ont le même sens en clair/sombre
- Pour les styles inline, utiliser `style={{ color: 'var(--theme-text-muted)' }}` (les CSS variables fonctionnent en inline)

**Recharts :**
- Bibliothèque de charts utilisée sur Dashboard et Donnees
- Version 3.8.1

**Variable d'environnement requise :**
- `ANTHROPIC_API_KEY` dans `backend/.env` (pour chatbot RAG + narration EDA)

**Pages sans intervention prévue :**
- Predictions, Models, Agents, Outils, Maintenance, Training, Onboarding
