# Rapport d'état d'avancement
## Projet : Système de Maintenance Prédictive Industrielle — *AI Maintenance*

---

|                     |                                                              |
|---------------------|--------------------------------------------------------------|
| **Date du rapport** | 28 avril 2026                                                |
| **Auteur**          | DJERI                                                         |
| **Statut global**   | En cours de développement — noyau fonctionnel opérationnel   |

---

## Table des matières

1. [Présentation du projet](#1-présentation-du-projet)
2. [Architecture technique](#2-architecture-technique)
3. [Base de données](#3-base-de-données)
4. [Backend — API FastAPI](#4-backend--api-fastapi)
5. [Agents intelligents](#5-agents-intelligents)
6. [Frontend — Interface utilisateur](#6-frontend--interface-utilisateur)
7. [Détail des pages réalisées](#7-détail-des-pages-réalisées)
8. [Fonctionnalités transverses](#8-fonctionnalités-transverses)
9. [Travaux restants et perspectives](#9-travaux-restants-et-perspectives)
10. [Commandes de démarrage](#10-commandes-de-démarrage)

---

## 1. Présentation du projet

### 1.1 Contexte et objectif

**AI Maintenance** est une application web de **maintenance prédictive industrielle** développée dans le cadre du projet de fin d'études. L'application s'adresse aux entreprises industrielles souhaitant passer d'une maintenance curative (on répare après la panne) ou préventive systématique (on entretient à intervalles fixes) à une **maintenance conditionnelle pilotée par les données** : on intervient uniquement quand les capteurs et les algorithmes détectent un risque réel de défaillance.

Le projet cible le secteur industriel marocain (référence interne : *Atlas Industries Maroc*) et intègre les normes internationales de surveillance vibratoire **ISO 10816**, **ISO 20816** et **ISO 18436** pour la classification de l'état de santé des machines tournantes.

### 1.2 Valeur apportée

L'application centralise en un seul outil :

- La **collecte et l'analyse des données capteurs** (vibrations, température, courant)
- La **détection automatique de défauts** sur les machines tournantes
- Le **pronostic de durée résiduelle avant bris de fatigue** (DRBF)
- Le **suivi en temps réel** de l'état du parc machines
- La **gestion des interventions** (bons de travail, techniciens, pièces de rechange)
- L'**analyse exploratoire de données (EDA)** assistée par intelligence artificielle (modèle Claude d'Anthropic)
- L'**entraînement et le déploiement de modèles** de Machine Learning

### 1.3 Tableau de bord de l'avancement global

| Module | Statut | Niveau de complétude |
|--------|--------|----------------------|
| Architecture frontend (React + TypeScript) | ✅ Terminé | 100 % |
| Architecture backend (FastAPI + SQLite) | ✅ Terminé | 100 % |
| Schéma base de données (26 tables) | ✅ Terminé | 100 % |
| Dashboard analytique | ✅ Terminé | 100 % |
| Page Données — Chargement et EDA | ✅ Terminé | 95 % |
| Page Paramètres (entreprise + machines + capteurs) | ✅ Terminé | 90 % |
| Agent EDA (analyse + LLM + PDF) | ✅ Terminé | 95 % |
| Page Prédictions (structure + UI) | 🟡 Partiel | 60 % |
| Page Entraînement (structure + UI) | 🟡 Partiel | 60 % |
| Page Modèles (structure + UI) | 🟡 Partiel | 50 % |
| Page Maintenance (structure + UI) | 🟡 Partiel | 50 % |
| Page Agents (structure + UI) | 🟡 Partiel | 40 % |
| Page Outils (structure + UI) | 🟡 Partiel | 40 % |
| Authentification utilisateur | ⏳ Prévu | 0 % |

---

## 2. Architecture technique

### 2.1 Vue d'ensemble de l'architecture

L'application suit une architecture **client-serveur** classique séparée en deux processus indépendants communicant via une API REST :

```
┌──────────────────────────────────┐         HTTP / REST         ┌──────────────────────────┐
│        FRONTEND (React)          │  ◄─────────────────────►    │     BACKEND (FastAPI)    │
│  http://localhost:5173           │      JSON / FormData         │  http://localhost:8000   │
│                                  │                              │                          │
│  • Vite (bundler)                │                              │  • SQLite (données)      │
│  • TypeScript (typage)           │                              │  • Agent EDA             │
│  • React Router (navigation)     │                              │  • File Parser           │
│  • Recharts (graphiques)         │                              │  • Claude LLM            │
│  • Lucide (icônes)               │                              │  • FPDF (rapports PDF)   │
└──────────────────────────────────┘                              └──────────────────────────┘
```

Le frontend ne connaît que les URLs de l'API — il n'accède jamais directement à la base de données. Toute la logique métier et les accès aux données passent par le backend.

### 2.2 Technologies frontend

| Technologie | Version | Rôle dans le projet |
|-------------|---------|---------------------|
| **React** | 19.2 | Bibliothèque UI principale — tout le rendu est basé sur des composants React fonctionnels avec hooks |
| **TypeScript** | via Vite | Tous les fichiers composants sont en `.tsx` : typage fort des props, des états, des réponses API. Permet de détecter les erreurs à la compilation |
| **Vite** | 8.0 | Serveur de développement ultra-rapide avec HMR (hot module reload) ; bundler optimisé pour la production |
| **React Router DOM** | 7.14 | Gestion de la navigation SPA (Single Page Application) — 9 routes déclarées dans `App.jsx`, aucun rechargement de page |
| **Recharts** | 3.8 | Bibliothèque de graphiques basée sur D3 — utilisée pour les courbes KPI, histogrammes, graphiques en barres |
| **Lucide React** | 1.8 | Plus de 1 100 icônes SVG modernes — remplace tous les emojis pour une interface professionnelle |
| **CSS par page** | — | Chaque page possède son propre fichier `.css` avec des noms de classes scopés : aucun conflit de styles entre pages |

### 2.3 Technologies backend

| Technologie | Rôle |
|-------------|------|
| **FastAPI** | Framework web Python asynchrone — génère automatiquement la documentation Swagger interactive (`/docs`) |
| **SQLite 3.40+** | Base de données relationnelle embarquée, sans serveur séparé — fichier unique `backend/db/ai_maintenance.db` |
| **SQLAlchemy** | ORM (Object Relational Mapper) pour les accès à la base de données via Python |
| **Pandas / NumPy** | Manipulation et calcul vectorisé sur les tableaux de données (DataFrames) |
| **Matplotlib / Seaborn** | Génération de graphiques PNG en mémoire (mode non-interactif `Agg`, sans affichage GUI) |
| **Scikit-learn** | Bibliothèque de Machine Learning — preprocessing : label encoding, imputation de valeurs manquantes |
| **FPDF2** | Génération de rapports PDF complets avec sections textuelles et graphiques intégrés |
| **Anthropic (Claude)** | LLM `claude-sonnet-4-6` — narration des analyses EDA, plans de prétraitement, recommandations de features |
| **Chardet** | Détection automatique de l'encodage des fichiers texte (UTF-8, ISO-8859-1, Windows-1252, etc.) |
| **liac-arff** | Parser pour le format ARFF utilisé par le logiciel de Machine Learning Weka |
| **python-multipart** | Traitement des uploads de fichiers via le protocole `multipart/form-data` |

### 2.4 Structure complète des dossiers

```
ai-maintenance/
├── src/                            # Sources frontend React
│   ├── App.jsx                     # Routeur racine + DatasetProvider
│   ├── main.jsx                    # Point d'entrée React (monte <App/>)
│   ├── components/
│   │   └── AppLayout.tsx           # Layout partagé (sidebar, header, thème)
│   ├── contexts/
│   │   ├── ThemeContext.tsx         # Thème clair/sombre persisté globalement
│   │   └── DatasetContext.tsx       # Datasets uploadés accessibles à toutes les pages
│   └── pages/
│       ├── Dashboard/              # Page principale (index.tsx + dashboard.css + composants)
│       ├── Donnees/                # Données + sous-pages EDA (donnees.css + ChargementPage…)
│       ├── Predictions/            # Prédictions (9 composants)
│       ├── Training/               # Entraînement (7 composants)
│       ├── Models/                 # Gestion modèles (8 composants)
│       ├── Agents/                 # Agents IA (4 composants)
│       ├── Outils/                 # Outils (4 composants)
│       ├── Parametres/             # Configuration (EntrepriseForm + ParcMachines)
│       └── Maintenance/            # Gestion maintenance
│
├── backend/
│   ├── main.py                     # Point d'entrée FastAPI (CORS, routes, init BD)
│   ├── requirements.txt            # Dépendances Python
│   ├── api/
│   │   ├── dashboard.py            # 6 routes /api/dashboard/*
│   │   ├── donnees.py              # 8 routes /api/donnees/*
│   │   ├── admin.py                # Routes /api/admin/*
│   │   └── maintenance.py          # Routes /api/maintenance/*
│   ├── services/
│   │   ├── dashboard_service.py    # Requêtes SQL complexes pour le dashboard
│   │   ├── donnees_service.py      # Logique métier données
│   │   ├── admin_service.py        # Logique admin
│   │   └── maintenance_service.py  # Logique maintenance
│   ├── agents/
│   │   ├── eda_agent.py            # Agent EDA complet (7 étapes)
│   │   └── file_parser.py          # Parser multi-format (CSV, XLSX, TXT, ARFF, ZIP)
│   ├── db/
│   │   ├── database.py             # Connexion SQLite + helpers (db_session, rows_to_list)
│   │   ├── models.py               # Descriptions des tables (documentation)
│   │   ├── schema.sql              # Schéma SQL complet (26 tables, clés étrangères)
│   │   └── ai_maintenance.db       # Fichier base de données SQLite
│   └── data/
│       ├── uploads/                # Fichiers bruts uploadés par l'utilisateur
│       ├── processed/              # CSV nettoyés et traités par l'agent EDA
│       ├── plots/                  # Graphiques PNG générés (sous-dossiers par dataset_id)
│       └── reports/                # Rapports PDF générés (eda_report_{id}.pdf)
│
├── ETATAVANCEMENT.md               # Ce rapport
├── package.json                    # Dépendances et scripts frontend
└── vite.config.js                  # Configuration Vite
```

---

## 3. Base de données

### 3.1 Choix de SQLite

SQLite a été choisi pour plusieurs raisons pratiques adaptées au contexte du projet :
- **Zéro configuration** : pas de serveur à installer, la base est un simple fichier
- **Portabilité** : le fichier `.db` peut être copié, sauvegardé, partagé facilement
- **Intégration Python native** : module `sqlite3` inclus dans la bibliothèque standard Python
- **Performances suffisantes** pour un système mono-site industriel (milliers de mesures par jour)

Le fichier de base de données est `backend/db/ai_maintenance.db`. L'initialisation est automatique au démarrage du backend via le décorateur `@app.on_event("startup")` — la fonction `init_db()` lit et exécute le fichier `schema.sql` si les tables n'existent pas encore.

### 3.2 Choix techniques du schéma

Le schéma active deux pragmas SQLite importants :

```sql
PRAGMA foreign_keys = ON;      -- Les clés étrangères sont respectées à l'insertion/suppression
PRAGMA journal_mode = WAL;     -- Mode Write-Ahead Logging : lectures et écritures simultanées sans blocage
```

Chaque enregistrement possède un horodatage automatique via `DEFAULT (datetime('now'))`, et de nombreuses tables utilisent un **soft-delete** (champ `actif` ou `statut`) pour conserver l'historique au lieu de supprimer physiquement les lignes.

### 3.3 Les 26 tables — description complète

#### Module 1 — Référentiel entreprise

| Table | Description détaillée |
|-------|----------------------|
| `entreprise` | Fiche identité de la société cliente : nom, secteur industriel (enum contraint : pétrochimie, automobile, etc.), coordonnées, adresse |
| `usine` | Chaque site de production appartenant à l'entreprise |
| `atelier` | Subdivision d'une usine par zone géographique ou département de production |
| `utilisateur` | Comptes utilisateurs avec rôle (admin, ingénieur, technicien), hachage du mot de passe |

#### Module 2 — Parc machines et équipements

| Table | Description détaillée |
|-------|----------------------|
| `machine` | Chaque machine surveillée : code unique, type (pompe, moteur, compresseur…), classe ISO, statut, appartenance à un atelier |
| `composant` | Pièces internes d'une machine (palier, roulement, arbre, courroie) — niveau de détail pour le diagnostic |
| `capteur` | Capteurs IoT attachés à chaque composant : type de mesure, position physique, fréquence d'acquisition, état de la batterie |
| `passerelle_iot` | Passerelles réseau qui agrègent les données de plusieurs capteurs (protocoles MQTT, Modbus, OPC-UA) |
| `configuration_acquisition` | Paramètres d'échantillonnage : fréquence d'acquisition (Hz), durée de mesure, type de fenêtrage FFT |

#### Module 3 — Mesures et signaux

| Table | Description détaillée |
|-------|----------------------|
| `mesure_globale` | Indicateurs synthétiques horodatés : Velocity-RMS (mm/s), température (°C), courant absorbé (A) — lecture rapide pour le dashboard |
| `mesure_spectrale` | Spectre FFT complet stocké en JSON : tableau de bins fréquentiels avec leur amplitude |
| `bande_fine_mesure` | Énergie mesurée dans des bandes fréquentielles précises caractéristiques des défauts (BPFO, BPFI, BSF) |

#### Module 4 — Diagnostic et prédiction

| Table | Description détaillée |
|-------|----------------------|
| `seuil_alarme` | Valeurs limites ISO 10816/20816 par type de machine et classe : zones A (bon), B (acceptable), C (surveillance), D (danger) |
| `defaut_detecte` | Défauts identifiés automatiquement par les algorithmes : type de défaut, gravité (1→5), stade de dégradation, statut (actif/résolu) |
| `pronostic_drbf` | Durée Résiduelle Avant Bris de Fatigue estimée par le modèle prédictif, avec intervalle de confiance à 90 % |
| `alerte` | Alertes générées automatiquement : niveau (info/avertissement/critique/urgent), horodatage, message, acquittement |
| `classe_iso` | Référentiel des 4 classes ISO de qualité vibratoire pour chaque famille de machine |
| `categorie_vis` | Catégories de classification VIS (Vibration Intelligent Surveillance) |

#### Module 5 — Maintenance opérationnelle

| Table | Description détaillée |
|-------|----------------------|
| `bon_de_travail` | Ordres de travail avec statut (planifié/en cours/terminé/annulé), priorité, machine concernée, type d'intervention |
| `historique_maintenance` | Toutes les interventions réalisées avec date, durée réelle, type (curatif/préventif/prédictif), observations |
| `panne` | Historique des pannes réelles avec durée d'arrêt, cause identifiée — utilisé pour calculer le taux de détection du système |
| `intervention_technicien` | Affectation des techniciens aux bons de travail (un BT peut nécessiter plusieurs techniciens) |
| `certification` | Certifications et qualifications du personnel (ISO CAT I/II/III, habilitations électriques, etc.) |

#### Module 6 — Stocks, KPIs et finances

| Table | Description détaillée |
|-------|----------------------|
| `piece_rechange` | Catalogue des pièces avec référence, quantité en stock, seuil de réapprovisionnement, délai fournisseur |
| `mouvement_stock` | Traçabilité des entrées et sorties de pièces (utilisée pour quel BT, par quel technicien) |
| `kpi_journalier` | Indicateurs de performance calculés chaque jour : disponibilité (%), OEE (%), MTBF (h), MTTR (h), TRS (%) |
| `economie_predictive` | Enregistrement des économies financières générées : pannes évitées, maintenances préventives reportées, réduction des stocks |
| `incident_securite` | Incidents HSE (Hygiène Sécurité Environnement) liés aux défaillances machines |

#### Table créée dynamiquement

| Table | Description détaillée |
|-------|----------------------|
| `dataset` | Métadonnées des fichiers uploadés via l'EDA : nom, description, chemin, dimensions, type détecté, statut de traitement, résultats EDA en JSON |

---

## 4. Backend — API FastAPI

### 4.1 Point d'entrée (`main.py`)

Le fichier `main.py` est le bootstrap de l'application backend :

```python
app = FastAPI(
    title="AI Maintenance API",
    description="API de maintenance prédictive — Atlas Industries Maroc",
    version="1.0.0",
)
```

Configurations importantes :
- **CORS** activé pour `http://localhost:5173` — autorise le frontend React à appeler l'API cross-origin
- **Initialisation automatique de la BD** : `init_db()` appelé au démarrage, crée les tables si elles n'existent pas
- **4 routeurs** montés : `/api/dashboard`, `/api/donnees`, `/api/admin`, `/api/maintenance`
- **Documentation Swagger** auto-générée : `http://localhost:8000/docs` (interface web interactive pour tester les routes)

### 4.2 Module Dashboard — `dashboard.py` + `dashboard_service.py`

Ce module expose les données analytiques pour le tableau de bord. La séparation entre `api/dashboard.py` (routes HTTP) et `services/dashboard_service.py` (logique SQL) respecte le principe de séparation des responsabilités.

#### Calcul des 4 KPIs héros

Chaque KPI est calculé par une sous-requête SQL dédiée. Voici comment la disponibilité est calculée :

```sql
SELECT ROUND((
    SELECT AVG(disponibilite_pct)
    FROM kpi_journalier
    WHERE date_kpi >= date('now','-7 days')
), 1) AS disponibilite_7j
```

Le **taux de détection prédictif** mesure l'efficacité du système :
```
taux = pannes_évitées / (pannes_évitées + pannes_réelles) × 100
```

Cette formule traduit une question fondamentale : sur toutes les défaillances qui auraient pu survenir, quelle proportion le système a-t-il réussi à anticiper et éviter ?

**Règle d'affichage :** toutes les valeurs sont `null` si la base est vide — le frontend affiche `—` au lieu d'un zéro trompeur. Ce choix est intentionnel : afficher `0%` de disponibilité alors que la base n'est pas alimentée induirait l'utilisateur en erreur.

| Route | Description |
|-------|-------------|
| `GET /hero` | 4 KPIs principaux calculés par sous-requêtes SQL |
| `GET /machines` | Machines avec V-RMS, zone ISO, type de défaut, DRBF |
| `GET /alertes` | Alertes actives des 24 dernières heures |
| `GET /categories` | 9 catégories KPI pour le diagramme fleur |
| `GET /capteurs` | État réseau IoT |
| `GET /series` | Série temporelle 30 jours |

### 4.3 Module Données — `donnees.py`

Ce module gère le cycle de vie complet des datasets uploadés par l'utilisateur.

| Route | Méthode | Description |
|-------|---------|-------------|
| `/upload` | POST | Reçoit fichier + métadonnées, sauvegarde en `data/uploads/`, déclenche l'agent EDA en **tâche de fond** (non-bloquant) |
| `/datasets` | GET | Liste tous les datasets avec leur statut en temps réel |
| `/datasets/{id}` | GET | Détail complet : métadonnées + résultats EDA (JSON imbriqué complet) |
| `/datasets/{id}/preview` | GET | Lit le CSV traité et retourne les N premières lignes pour l'aperçu DataFrame |
| `/datasets/{id}` | DELETE | Supprime le dataset, ses fichiers traités, ses plots et son rapport PDF |
| `/datasets/{id}/download/processed` | GET | Télécharge le CSV nettoyé par l'agent EDA |
| `/datasets/{id}/download/raw` | GET | Télécharge le fichier brut original tel qu'uploadé |
| `/datasets/{id}/download/report` | GET | Télécharge le rapport PDF d'analyse EDA |

**Mécanisme asynchrone :** après réception du fichier, FastAPI utilise `BackgroundTasks` pour lancer l'analyse EDA sans bloquer la réponse HTTP. Le client reçoit immédiatement le statut `uploaded`, puis le frontend effectue un polling automatique toutes les 3 secondes pour suivre la progression : `uploaded → processing → processed` (ou `error`).

---

## 5. Agents intelligents

### 5.1 Agent EDA — `eda_agent.py`

L'agent EDA est le cœur analytique du système. Il traite automatiquement tout dataset uploadé en 7 étapes séquentielles, sans aucune intervention manuelle de l'utilisateur.

---

#### Étape 1 — Parsing multi-format (`file_parser.py`)

Avant l'analyse, le fichier est parsé selon son extension. Le parser est conçu pour être **tolérant aux erreurs** :

| Format | Mécanisme technique |
|--------|-------------------|
| **CSV** | Détection automatique de l'encodage (chardet sur les 50 000 premiers octets), puis essai successif des séparateurs `,` `;` `\t` `|` — le premier qui produit plus d'une colonne est retenu |
| **XLSX / XLS** | Lecture de toutes les feuilles via `pd.ExcelFile` — chaque feuille non vide devient un DataFrame indépendant |
| **TXT / TSV** | Traité identiquement au CSV avec détection automatique du séparateur |
| **ARFF** | Format Weka parsé avec `liac-arff` ; fallback automatique sur lecture ligne par ligne si la bibliothèque est absente |
| **ZIP** | Décompression et parsing récursif de tous les fichiers supportés contenus dans l'archive |

---

#### Étape 2 — Détection automatique du type de données

L'agent analyse les noms des colonnes et leur compare à 4 dictionnaires de mots-clés :

```python
VIBRATION_KEYWORDS   = {"vibration", "vrms", "rms", "rpm", "bearing", "fft", "kurtosis", "bpfo", ...}
KPI_KEYWORDS         = {"oee", "mtbf", "mttr", "availability", "uptime", "downtime", "trs", ...}
MAINTENANCE_KEYWORDS = {"maintenance", "failure", "repair", "work_order", "panne", "intervention", ...}
MACHINE_KEYWORDS     = {"machine", "equipment", "motor", "pump", "compressor", "machine_id", ...}
```

Chaque dictionnaire reçoit un **score = nombre de colonnes dont le nom contient au moins un de ses mots-clés**. Le type avec le score le plus élevé est retenu. Si aucun score n'est positif, le type est `generic`.

Ce classement automatique permet à l'interface d'afficher le bon badge de couleur sur chaque dataset et d'orienter les recommandations du LLM.

---

#### Étape 3 — Calcul du résumé statistique

Pour chaque colonne, l'agent calcule :
- **Type** : numérique (int, float) ou catégoriel (object, bool)
- **Valeurs manquantes** : nombre absolu et pourcentage
- **Cardinalité** : nombre de valeurs uniques
- **Colonnes numériques** : moyenne, écart-type, minimum, maximum
- **Colonnes catégorielles** : top 5 des valeurs les plus fréquentes avec leur effectif

Au niveau global du dataset : dimensions (lignes × colonnes), nombre de colonnes numériques vs catégorielles, nombre total de doublons, taux moyen de valeurs manquantes.

---

#### Étape 4 — Appel au LLM Claude

Si la variable `ANTHROPIC_API_KEY` est configurée, l'agent construit un prompt structuré et l'envoie au modèle `claude-sonnet-4-6`. Le prompt contient le résumé statistique complet et le contexte de maintenance prédictive.

Claude retourne un JSON à 3 champs :

| Champ | Contenu |
|-------|---------|
| `preprocessing_plan` | Liste numérotée des étapes de prétraitement recommandées pour ce dataset spécifique |
| `narrative` | Analyse EDA narrative de 300-400 mots : qualité des données, patterns identifiés, anomalies, insights clés |
| `feature_recommendations` | Recommandations sur le choix des variables explicatives pour les algorithmes de maintenance prédictive |

En l'absence de clé API, des messages heuristiques de substitution sont retournés — l'application reste entièrement fonctionnelle sans abonnement LLM.

---

#### Étape 5 — Prétraitement automatique

L'agent applique un pipeline de nettoyage en 4 sous-étapes :

1. **Suppression des doublons** exacts (lignes identiques sur toutes les colonnes)
2. **Suppression des colonnes vides** (100 % de valeurs manquantes — ne portent aucune information)
3. **Imputation des valeurs manquantes** : médiane pour les colonnes numériques (robuste aux valeurs extrêmes), mode pour les colonnes catégorielles
4. **Encodage label** des colonnes catégorielles avec ≤ 30 valeurs uniques : chaque modalité reçoit un entier, la correspondance est enregistrée dans `encoding_maps` pour être restituée dans l'interface

Le CSV nettoyé est sauvegardé dans `data/processed/` et mis à disposition en téléchargement.

---

#### Étape 6 — Génération des graphiques

Matplotlib génère entre 3 et 6 graphiques selon la composition du dataset :

| Graphique | Condition |
|-----------|-----------|
| Matrice des valeurs manquantes | Si des valeurs manquantes existent |
| Histogrammes de distribution | Pour les colonnes numériques (max 6) |
| Heatmap de corrélation | Si au moins 2 colonnes numériques |
| Séries temporelles | Si une colonne date/time est détectée |
| Diagrammes en barres | Pour les colonnes catégorielles (max 4) |

Les graphiques sont générés en mémoire (sans affichage écran) et encodés en **Base64 PNG**. Ce format permet de les intégrer directement dans le rapport PDF et de les afficher dans React via `<img src="data:image/png;base64,..."/>`, sans serveur de fichiers statiques supplémentaire.

---

#### Étape 7 — Génération du rapport PDF

FPDF2 génère un rapport PDF structuré comprenant :
- Page de couverture (titre, type détecté, dimensions, date de génération)
- Récapitulatif statistique (tableau des colonnes)
- Narration analytique (texte Claude ou heuristique)
- Plan de prétraitement appliqué (liste numérotée)
- Tables de correspondance d'encodage
- Tous les graphiques générés
- Recommandations de features

Le PDF est sauvegardé dans `data/reports/eda_report_{id}.pdf` et mis à disposition en téléchargement.

---

## 6. Frontend — Interface utilisateur

### 6.1 Architecture SPA (Single Page Application)

L'application est une SPA : une seule page HTML (`index.html`) est chargée au démarrage, et la navigation entre les 9 sections s'effectue côté client via React Router sans rechargement de page. Chaque changement d'URL met à jour uniquement le contenu principal, en conservant le layout (sidebar, header) à l'écran.

Tous les fichiers de composants sont en TypeScript (`.tsx`). TypeScript est configuré en mode strict : les types des props, des états et des réponses API sont déclarés explicitement, ce qui élimine toute une catégorie de bugs à la compilation.

### 6.2 Composant partagé — `AppLayout`

Toutes les pages utilisent le composant `AppLayout` comme enveloppe. Il fournit :
- La **barre latérale de navigation** avec les 9 liens et icônes Lucide
- Le **lien actif** surligné selon l'URL courante
- L'**en-tête** de page avec titre, sous-titre et icône
- Le **bouton de thème** (soleil/lune)
- La **zone de contenu** principale (`children`)

### 6.3 Contextes React globaux

#### `DatasetContext`

Ce contexte rend la liste des datasets accessible à toutes les pages sans prop-drilling. Il encapsule :
- L'appel `GET /api/donnees/datasets` au montage (et à chaque `refresh()`)
- La sélection globale d'un dataset (`selectedId`)
- Le chargement du détail complet quand `selectedId` change
- Le polling : `pollUntilDone(id)` appelle `GET /api/donnees/datasets/{id}` toutes les 3 secondes jusqu'à ce que le statut soit `processed` ou `error`, puis s'arrête automatiquement

#### `ThemeContext`

Gère le basculement clair/sombre :
- Le choix est persisté dans `localStorage` (survit aux rechargements)
- Un seul attribut HTML `data-theme="dark"` sur `<html>` suffit à changer toute l'interface
- Tous les fichiers CSS utilisent des variables CSS (`--bg-primary`, `--text-primary`, etc.) redéfinies selon `data-theme`

---

## 7. Détail des pages réalisées

### 7.1 Dashboard (`/`)

**État : ✅ Complet et fonctionnel**

Le dashboard est la page d'accueil. Il offre une vision analytique globale et en temps réel de l'état du parc industriel.

#### 4 cartes indicateurs héros

Affichées en haut de page, calculées dynamiquement depuis la base :

| Indicateur | Formule |
|------------|---------|
| **Disponibilité 7j** | Moyenne de `disponibilite_pct` sur les 7 derniers jours |
| **Économies YTD** | Somme des montants économisés depuis le 1er janvier, en k€ |
| **Machines en alerte** | Nombre de machines avec au moins un défaut actif en base |
| **Taux de détection** | `pannes_évitées / (pannes_évitées + pannes_réelles) × 100` |

Si la base est vide, toutes ces valeurs affichent `—`. Il n'y a aucune valeur codée en dur dans l'interface.

#### Diagramme fleur SVG cliquable

C'est l'élément visuel central du dashboard. Il est composé de **9 cercles-pétales** disposés autour d'un centre, représentant les 9 catégories de performance. Chaque pétale est implémenté en SVG natif :

```tsx
<g className="flower-petal" onClick={() => onPetalClick("kpi-smart")} style={{cursor:"pointer"}}>
  <circle cx="0" cy="-115" r="48" fill="rgba(139,92,246,0.18)" stroke="#a855f7" strokeWidth="1.5"/>
  <text ...>Smart Replacement</text>
</g>
```

Un clic déclenche `document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })` — l'utilisateur est amené directement à la section KPI correspondante. Cette navigation contextuelle est particulièrement utile sur un dashboard long.

#### 9 sections KPI détaillées

Chaque pétale correspond à une section en bas de page avec des métriques précises provenant de `/api/dashboard/categories` :

| Pétale | KPIs affichés |
|--------|---------------|
| Revenue Recovery | Économies YTD, pannes évitées, coût moyen d'une panne, ROI % |
| Asset Availability | Disponibilité moyenne, OEE, MTBF, MTTR |
| Risk Reduction | Machines en zone D, défauts actifs, incidents, DRBF minimum du parc |
| Smart Replacement | Remplacements optimaux, économies réalisées, PM supprimées |
| IoT Network | Total capteurs, actifs, batterie faible, en panne, passerelles actives |
| Planned Maintenance | BT planifiés, en cours, terminés, urgents, durée moyenne |
| Service Loss | Nb pannes historique, arrêt moyen, pertes financières |
| Workforce | Nb techniciens, certifications, équipe active, interventions |
| Predictive Power | Taux de détection, confiance moyenne, défauts actifs, lead time |

#### Grille de santé machines

50 cellules colorées représentent l'état du parc. Les couleurs correspondent aux zones ISO :
- Vert = zone A/B (état acceptable)
- Orange = zone C (surveillance renforcée)
- Rouge = zone D (arrêt recommandé)
- Gris = inactif ou données manquantes

La légende calcule les proportions dynamiquement et affiche `—` si les variables sont nulles — aucune arithmétique sur `null` n'est effectuée.

#### Tableau machines à risque

Liste les machines classées par urgence avec : code, nom, V-RMS mesuré, zone ISO courante, type de défaut détecté, stade de dégradation, DRBF restant en jours.

#### Feed d'alertes

Liste chronologique des alertes actives des 24 dernières heures avec leur niveau de criticité et message détaillé.

---

### 7.2 Page Données (`/donnees`)

**État : ✅ Sous-page Chargement opérationnelle — autres en cours**

#### Navbar horizontale

La page adopte une navigation horizontale par groupes thématiques, remplaçant une ancienne sidebar verticale pour mieux utiliser la largeur d'écran sur des données tabulaires :

| Groupe | Items |
|--------|-------|
| **Données** | Chargement · Vue générale |
| **Analyses disponibles** | Analyse vibratoire · Pronostic & DRBF · KPIs & Performance |
| **Actifs** | Parc machines · Capteurs IoT · Classification VIS |

#### Sous-page Chargement — Fonctionnement détaillé

**Zone d'upload drag-and-drop :**
- L'utilisateur peut glisser-déposer un fichier ou cliquer pour ouvrir le sélecteur de fichiers
- Formats acceptés : CSV, XLSX, XLS, TXT, ARFF, ZIP, DAT
- Champ "Nom du dataset" obligatoire (pré-rempli automatiquement avec le nom du fichier sans extension)
- Description optionnelle
- Barre de progression pendant l'upload
- Messages d'erreur précis et localisés

**Mécanisme de polling et retour utilisateur :**
Après upload, l'interface affiche immédiatement le dataset avec le statut "En attente", puis "Traitement en cours…" (badge orange animé). Le polling automatique (toutes les 3 secondes) met à jour le statut jusqu'à "Prêt" (vert) ou "Erreur" (rouge). L'utilisateur n'a rien à faire.

**Panel résultats EDA — 5 onglets :**

| Onglet | Contenu détaillé |
|--------|-----------------|
| **Synthèse** | Narration analytique générée par Claude ; tableau complet de toutes les colonnes avec type, taux de manquants, statistiques ; clic sur une ligne → expansion des top valeurs de la colonne |
| **Graphiques** | Grille de plots PNG générés automatiquement (distributions, heatmap de corrélation, valeurs manquantes, séries temporelles, catégorielles) |
| **Prétraitement** | Plan de prétraitement appliqué (liste numérotée) ; correspondances d'encodage label (variable textuelle → entier) sous forme de chips colorées |
| **Recommandations** | Suggestions IA pour la sélection des features les plus pertinentes pour la maintenance prédictive ; 3 boutons de téléchargement (CSV traité, fichier brut original, rapport PDF) |
| **Aperçu données** | Tableau DataFrame des 15 premières lignes du fichier traité — données récupérées en temps réel depuis `/api/donnees/datasets/{id}/preview` |

---

### 7.3 Page Paramètres (`/parametres`)

**État : ✅ Complet**

#### Onglet Entreprise

Formulaire complet pour configurer l'identité de l'entreprise cliente :
- Raison sociale, domaine industriel (liste contrôlée de 10 secteurs)
- Coordonnées : téléphone, email, adresse complète (rue, ville, pays, code postal)
- Logo (upload image)
- Description libre de l'activité

#### Onglet Parc Machines

Interface complète de gestion des machines et capteurs associés, avec expérience utilisateur soignée :

**Vue globale :** compteurs en temps réel du nombre total de machines et du total de capteurs configurés sur tout le parc.

**Ajout de machine :** formulaire inline avec code unique, nom, type (9 types disponibles), rôle fonctionnel, document technique (PDF/Word).

**Liste accordéon :** chaque machine est un item dépliable. Deux innovations UX notables :
1. **Badge capteur visible sans déplier** : chaque ligne de machine affiche un badge indiquant le nombre de capteurs associés. Il est gris si aucun capteur n'est lié, et violet si au moins un capteur existe — l'opérateur voit d'un seul coup d'œil quelles machines ne sont pas encore équipées.
2. **Bouton "+ Capteur" direct** sur chaque ligne : au lieu de devoir d'abord déplier la machine puis trouver le bouton d'ajout, l'utilisateur peut cliquer directement sur "+ Capteur" depuis la liste — la machine se déplie et le formulaire d'ajout s'ouvre immédiatement.

**Formulaire capteur :** type (accéléromètre, vélocimètre, température, courant, pression, autre), position physique sur la machine, fréquence d'acquisition.

---

### 7.4 Pages en construction

Les 6 pages suivantes disposent d'une structure UI complète (composants TypeScript, layout, CSS) mais leur connexion au backend est partielle ou en cours. Elles sont navigables et montrent l'organisation prévue.

#### Page Prédictions (`/predictions`) — 9 composants réalisés
Upload d'un fichier CSV, sélection du modèle, paramétrage, déclenchement de la prédiction, affichage des résultats et explications SHAP.

#### Page Entraînement (`/entrainement`) — 7 composants réalisés
Sélection du dataset (connecté à `DatasetContext`), choix de l'algorithme, configuration des hyperparamètres, suivi de la progression, métriques finales.

#### Page Modèles (`/models`) — 8 composants réalisés
Liste des modèles entraînés, registre versionné, gestion du déploiement, comparaison des performances entre modèles.

#### Page Maintenance (`/maintenance`)
Gestion des bons de travail, calendrier, suivi des interventions. Le backend dispose déjà des routes `/api/maintenance/*`.

#### Page Agents (`/agents`) — 4 composants réalisés
Tableau de bord de l'orchestration des agents IA, délégation de tâches, flux de traitement, métriques de performance.

#### Page Outils (`/outils`) — 4 composants réalisés
Contrôle qualité des données, diagnostics système, export multi-format, consultation des logs système.

---

## 8. Fonctionnalités transverses

### 8.1 Thème clair / sombre

L'ensemble de l'interface supporte le basculement entre thème clair et sombre en un seul clic. Techniquement, un seul attribut HTML (`data-theme="dark"` ou `"light"` sur `<html>`) suffit à changer toute l'interface : tous les fichiers CSS définissent leurs couleurs via des variables CSS qui prennent des valeurs différentes selon `data-theme`. Le choix est mémorisé dans `localStorage` et appliqué dès le chargement de la page.

### 8.2 Données absentes = affichage `—`

Toutes les valeurs numériques proviennent exclusivement du backend. Si la base de données est vide ou si une requête retourne `null`, l'interface affiche le tiret long `—` plutôt qu'un zéro ou une valeur par défaut. Ce comportement est systématique sur tout le dashboard et les pages de données.

Exemple de code TypeScript qui gère ce cas :
```typescript
const eco = hero?.economies_ytd_k ?? null;
// Rendu :
{eco != null ? <>{Math.round(eco)}k<em> €</em></> : "—"}
```

### 8.3 Icônes vectorielles cohérentes

La bibliothèque **Lucide React** fournit plus de 1 100 icônes SVG accessibles comme composants React. Elle est utilisée sur l'ensemble de l'application (navigation, boutons, badges, en-têtes). Les icônes sont vectorielles : elles restent nettes à toutes les résolutions.

### 8.4 TypeScript strict sur tous les composants

Chaque interface de données (réponse API, état local, props de composant) est déclarée avec son type TypeScript explicite. Les erreurs de type sont détectées à la compilation, avant même d'exécuter le code.

---

## 9. Travaux restants et perspectives

### 9.1 Court terme — Sous-pages Données

| Tâche | Description |
|-------|-------------|
| **Analyse vibratoire** | Affichage FFT, spectres, bandes ISO, tendances V-RMS depuis le dataset de type `vibration` sélectionné |
| **Pronostic & DRBF** | Courbes de dégradation, DRBF calculé avec intervalles de confiance, horizon de prédiction |
| **KPIs & Performance** | OEE, MTBF, MTTR, disponibilité calculés depuis le dataset ou la base de données |
| **Parc machines** | Affichage des machines depuis la BD SQLite, synchronisation avec la page Paramètres |
| **Capteurs IoT** | Tableau de bord réseau : signaux, niveaux de batterie, horodatage de la dernière mesure |
| **Classification VIS** | Classification automatique des signaux vibratoires selon la norme VIS |

### 9.2 Moyen terme — Backend des pages partielles

| Page | À implémenter |
|------|--------------|
| **Prédictions** | Endpoint de prédiction batch sur CSV, calcul des valeurs SHAP, retour des résultats en JSON |
| **Entraînement** | Endpoint d'entraînement scikit-learn, streaming de logs en temps réel (WebSocket ou SSE), sauvegarde du modèle |
| **Modèles** | Listing des modèles depuis `trained_models/`, métriques réelles stockées en base, versioning et déploiement |
| **Maintenance** | CRUD complet des bons de travail, calendrier interactif, affectation des techniciens, suivi du stock |

### 9.3 Long terme — Infrastructure et sécurité

| Fonctionnalité | Description |
|----------------|-------------|
| **Authentification JWT** | Login/logout, rôles (admin, ingénieur, technicien), tokens avec expiration |
| **Persistance Paramètres** | Remplacer `localStorage` par des appels API vers la BD SQLite |
| **Variables d'environnement** | Fichier `.env` pour `ANTHROPIC_API_KEY`, URL de l'API configurable |
| **Tests automatisés** | Tests unitaires (pytest) sur les services backend et les agents |
| **Alimentation de la BD** | Script de données de test industrielles pour valider les KPIs du dashboard |
| **Déploiement** | Containerisation Docker, reverse proxy Nginx, configuration production |

---

## 10. Commandes de démarrage

### Lancer le frontend
```bash
cd c:\Users\djeri\Documents\VISUALSTUDIOCODE\ZAKI\ai-maintenance
npm run dev
# Interface accessible sur : http://localhost:5173
```

### Lancer le backend
```bash
cd c:\Users\djeri\Documents\VISUALSTUDIOCODE\ZAKI\ai-maintenance\backend
uvicorn main:app --reload --port 8000
# API REST              : http://localhost:8000
# Documentation Swagger : http://localhost:8000/docs
# Documentation ReDoc   : http://localhost:8000/redoc
```

### Réinitialiser la base de données
```bash
cd backend
python -c "from db.database import init_db; init_db()"
```

---

*Rapport d'état d'avancement — Projet AI Maintenance — 28 avril 2026*



Ran terminal command: find "c:/Users/djeri/Documents/VISUALSTUDIOCODE/ZAKI/ai-maintenance/generate_datasets" -type f | head -20

Read [](file:///c%3A/Users/djeri/Documents/VISUALSTUDIOCODE/ZAKI/ai-maintenance/src/pages/Dashboard/index.tsx)

*Conversation compacted*I'll continue the audit by examining the existing pages and dataset structure.

Read [](file:///c%3A/Users/djeri/Documents/VISUALSTUDIOCODE/ZAKI/ai-maintenance/src/pages/Donnees/index.tsx)

Read [](file:///c%3A/Users/djeri/Documents/VISUALSTUDIOCODE/ZAKI/ai-maintenance/src/pages/Dashboard/index.tsx)

Searched for files matching `generate_datasets/*.py`

Now examining generator scripts and checking for the Maintenance page.

Searched for files matching `src/pages/Maintenance/*`

Read [](file:///c%3A/Users/djeri/Documents/VISUALSTUDIOCODE/ZAKI/ai-maintenance/generate_datasets/1_vibration_monitoring.py)

Read [](file:///c%3A/Users/djeri/Documents/VISUALSTUDIOCODE/ZAKI/ai-maintenance/generate_datasets/2_maintenance_records.py)

Read [](file:///c%3A/Users/djeri/Documents/VISUALSTUDIOCODE/ZAKI/ai-maintenance/generate_datasets/3_daily_kpis.py)

Read [](file:///c%3A/Users/djeri/Documents/VISUALSTUDIOCODE/ZAKI/ai-maintenance/generate_datasets/4_iot_sensors.py)

Read [](file:///c%3A/Users/djeri/Documents/VISUALSTUDIOCODE/ZAKI/ai-maintenance/generate_datasets/5_machine_health.py)

Read [](file:///c%3A/Users/djeri/Documents/VISUALSTUDIOCODE/ZAKI/ai-maintenance/generate_datasets/6_alerts_anomalies.py)

Read [](file:///c%3A/Users/djeri/Documents/VISUALSTUDIOCODE/ZAKI/ai-maintenance/src/pages/Maintenance/index.tsx)

**AUDIT REPORT: Application Architecture & Dataset Structure**

## Current Page Analysis

### 1. **Données Page** (`src/pages/Donnees/index.tsx`)
**Current State:**
- Navigation with 8 analysis options grouped in 3 categories (Données, Analyses disponibles, Actifs)
- **Implemented tabs:**
  - `chargement` - Data loading (renders `ChargementPage` component)
  - `default` - General view showing sample data with 3 cards (Prediction, Visualization, KPI)
- **Placeholder tabs** - Show "coming soon" messages for:
  - Vibratoire (7 analyses)
  - Pronostic & DRBF
  - KPIs & Performance
  - Parc machines (3 machines)
  - Capteurs IoT
  - VIS Classification

**Data Display:**
- Mock data with 300 observations, 15 features, sample machine readings
- KPI cards for reliability, costs, productivity, model performance
- All other sections are empty placeholders

---

### 2. **Dashboard Page** (`src/pages/Dashboard/index.tsx`)
**Current State:**
- Comprehensive hero stats (4 cards): Availability, Savings, Alerts, Detection rate
- Flower SVG with 9 interactive KPI pillars (clickable to scroll)
- 9 detailed KPI sections covering:
  - Revenue Recovery, Smart Replacement, Planned Maintenance Reduction
  - IoT Network, Service Loss Reduction, Risk Reduction
  - Workforce Improvement, Asset Availability, Predictive Maintenance Core
- Operational view with:
  - Top machines at risk (sortable by DRBF)
  - Real-time alerts (last 24h)
  - FFT spectrum chart visualization
  - VRMS trend chart (90-day history)
  - Asset health grid (50 machines)
  - Heatmap of downtime by workshop × month

**Data Integration:**
- Fetches from 4 API endpoints (`/api/dashboard/hero`, `/machines`, `/alertes`, `/categories`)
- Falls back to demo data when API unavailable
- Maps real machine data to UI components with color coding (danger/warn/ok)

---

### 3. **Maintenance Page** (`src/pages/Maintenance/index.tsx`)
**Current State:**
- 3 tabs: Planning, Bons de travail (Work Orders), Stocks pièces (Parts Inventory)
- Stats bar showing: Open BTs, In-progress, Urgent P1, Critical stocks
- Loads data from 4 API endpoints (`/stats`, `/planning`, `/bons-de-travail`, `/stocks`)
- Shows urgent count notification in AppLayout
- Has dedicated component imports for each tab (Planning, BonsDeTravail, StocksPieces)

**Data Integration:**
- Retrieves maintenance metrics, work order lists, stock levels
- Filters urgent items (priority=1, not closed/cancelled)

---

## Dataset Structure (`generate_datasets/`)

| Generator | Output CSV | Rows | Key Columns | Data Type Detection | Use Case |
|-----------|-----------|------|------------|---------------------|-----------|
| **1_vibration_monitoring.py** | vibration_monitoring.csv | 1000 | timestamp, machine_id, vrms, acceleration, rpm, bearing_ref, zone, temperature | **VIBRATION** - Contains: vrms, acceleration, rpm, bearing | FFT analysis, defect diagnosis, threshold monitoring |
| **2_maintenance_records.py** | maintenance_records.csv | 500+ | bt_id, machine_id, type_maintenance, priorite, statut, defaut_detecte, technicien_id, duree_reelle_h, cost_total_eur | **MAINTENANCE** - Contains: maintenance, intervention, panne, BT, technicien, priorite | Work order planning, technician performance, RCA analysis |
| **3_daily_kpis.py** | daily_kpis.csv | 450+ (5 ateliers × 120 days) | date_kpi, atelier, mtbf, mttr, disponibilite, oee, vrms_moyen, nb_alertes, cout_maintenance | **KPI** - Contains: oee, mtbf, mttr, disponibilite, trs | Performance trending, OEE analysis, availability calculations |
| **4_iot_sensors.py** | iot_sensors.csv | 700+ | timestamp, machine_id, capteur_type, grandeur, valeur_mesuree, seuil_alerte, statut, batterie_pct, passerelle_iot | **GENERIC/MACHINE** - Multi-sensor monitoring data | Sensor health, anomaly detection, signal quality |
| **5_machine_health.py** | machine_health.csv | 585 (13 machines × 45 obs) | machine_id, age_jours, mtbf_actuel_h, v_rms_mm_s, crest_factor, kurtosis, asset_health_index, rul_estime_jours, score_degradation | **MACHINE** - Contains: rul, degradation, asset_health | Remaining Useful Life (RUL) predictions, health scoring |
| **6_alerts_anomalies.py** | alerts_anomalies.csv | 600+ | timestamp, machine_id, type_alerte, level_severite, score_ml, pattern_detecte, statut_resolue | Generic alert/anomaly log | Dashboard alerts, pattern recognition, ML confidence tracking |

---

## Data Integration Points

**What each page displays:**

- **Donnees Page** → Currently shows mock data; will integrate uploaded datasets after EDA processing
- **Dashboard** → Fetches from `/api/dashboard/*` endpoints; displays aggregated KPIs from 3_daily_kpis & 6_alerts_anomalies patterns
- **Maintenance** → Fetches from `/api/maintenance/*` endpoints; displays work orders (2_maintenance_records) and planning

**What's missing:**

- Dashboard/Maintenance endpoints don't yet use the SQLite dataset table
- No dataset selection context across pages (user can't choose which processed dataset to use)
- EDA results not displayed on Donnees page after upload
- No cross-page dataset switching mechanism

---

## Architecture Recommendations

### Phase 1 (Quick Win)
1. **Implement DatasetContext** - Global state for selected dataset across all pages
2. **Add dataset switcher** to navbar/sidebar
3. **Display EDA results** in Donnees page after processing
4. **Connect Dashboard/Maintenance** to query specific dataset from SQLite (fallback to kpi_journalier table)

### Phase 2 (Integration)
1. Replace mock API responses with actual database queries
2. Build dataset validation (ensure required columns exist for each page)
3. Add dataset metadata display (source, column count, processed date)

### Phase 3 (Polish)
1. Dataset versioning/history
2. Quick-select templates (e.g., "Show me vibration data from Q1 2026")
3. Data freshness indicators

Would you like me to now implement the DatasetContext and update the frontend to display EDA results, or focus on backend API endpoints first?

Ran terminal command: find "c:\Users\djeri\Documents\VISUALSTUDIOCODE\ZAKI\ai-maintenance" -type f -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" -o -name "*.py" -o -name "*.json" -o -name "*.css" -o -name "*.md" -o -name "*.env*" 2>/dev/null | head -200

Ran terminal command: cd "c:\Users\djeri\Documents\VISUALSTUDIOCODE\ZAKI\ai-maintenance" && find . -not -path './node_modules/*' -not -path './.git/*' -type f | sort

```
ai-maintenance/
├── 📦 BACKEND (Python/FastAPI)
│   ├── main.py                          ✓ Entry point, CORS, route mounting
│   ├── requirements.txt                 ✓ Dependencies (fastapi, pandas, anthropic, etc.)
│   │
│   ├── agents/                          EDA & Data processing
│   │   ├── __init__.py
│   │   ├── eda_agent.py                ✓ LLM-powered EDA orchestration
│   │   └── file_parser.py              ✓ Multi-format file parsing (CSV, XLSX, ARFF, ZIP)
│   │
│   ├── api/                             FastAPI route handlers
│   │   ├── __init__.py
│   │   ├── donnees.py                  ✓ Dataset upload/list/download/preview
│   │   ├── dashboard.py                 Dashboard KPI endpoints
│   │   ├── maintenance.py               Maintenance planning endpoints
│   │   └── admin.py                     Admin/config endpoints
│   │
│   ├── db/                              Database & Models
│   │   ├── __init__.py
│   │   ├── database.py                  SQLite connection & helpers
│   │   ├── models.py                    SQLAlchemy models
│   │   ├── schema.sql                   Database schema
│   │   ├── ai_maintenance.db           ✓ SQLite database file
│   │   └── __pycache__/
│   │
│   ├── schemas/                         Pydantic schemas (serialization)
│   │   ├── __init__.py
│   │   ├── donnees_schemas.py
│   │   ├── dashboard_schemas.py
│   │   └── admin_schemas.py
│   │
│   └── services/                        Business logic
│       ├── __init__.py
│       ├── donnees_service.py
│       ├── dashboard_service.py
│       ├── maintenance_service.py
│       └── admin_service.py
│
├── 📊 FRONTEND (React/TypeScript)
│   ├── src/
│   │   ├── main.jsx                     ✓ React app entry
│   │   ├── App.jsx                      ✓ Main router & layout
│   │   ├── App.css                      Global styles
│   │   ├── index.css                    ✓ CSS variables, theme
│   │   ├── vite-env.d.ts                Vite type definitions
│   │   │
│   │   ├── assets/
│   │   │   ├── react.svg
│   │   │   ├── vite.svg
│   │   │   └── hero.png
│   │   │
│   │   ├── components/
│   │   │   └── AppLayout/               Shared layout wrapper
│   │   │       ├── index.tsx            ✓ Header, sidebar, footer
│   │   │       └── layout.css
│   │   │
│   │   ├── contexts/                    React Context providers
│   │   │   ├── ThemeContext.tsx         ✓ Dark/light theme
│   │   │   └── DatasetContext.tsx       ✓ Global dataset selection
│   │   │
│   │   ├── pages/
│   │   │   │
│   │   │   ├── Dashboard/
│   │   │   │   ├── index.tsx            ✓ Main dashboard (9 KPI pillars, machine list)
│   │   │   │   ├── dashboard.css        ✓ Comprehensive styling
│   │   │   │   ├── types.ts
│   │   │   │   └── components/
│   │   │   │       ├── ActivityChart.tsx
│   │   │   │       ├── AlertsCard.tsx
│   │   │   │       ├── MachinesStatus.tsx
│   │   │   │       ├── StatsCard.tsx
│   │   │   │       └── SystemHealthCard.tsx
│   │   │   │
│   │   │   ├── Donnees/                 📍 Data loading & EDA
│   │   │   │   ├── index.tsx            ✓ Main page with nav tabs
│   │   │   │   ├── donnees.css          ✓ Styling
│   │   │   │   ├── types.ts             ✓ Interface definitions
│   │   │   │   ├── structure_data.txt
│   │   │   │   └── components/
│   │   │   │       ├── ChargementPage.tsx     ✓ Upload form, dataset list
│   │   │   │       ├── PredictionCard.tsx     ✓ Manual prediction input
│   │   │   │       ├── VisualisationCard.tsx  ✓ Data preview
│   │   │   │       ├── KPICard.tsx            ✓ KPI display
│   │   │   │       └── InterpretationCard.tsx ✓ EDA insights
│   │   │   │
│   │   │   ├── Maintenance/
│   │   │   │   ├── index.tsx            ✓ Main page with 3 tabs
│   │   │   │   ├── maintenance.css      ✓ Styling
│   │   │   │   └── components/
│   │   │   │       ├── Planning.tsx
│   │   │   │       ├── BonsDeTravail.tsx
│   │   │   │       └── StocksPieces.tsx
│   │   │   │
│   │   │   ├── Models/
│   │   │   │   ├── index.tsx            Model management & deployment
│   │   │   │   ├── models.css
│   │   │   │   ├── models_structure.txt
│   │   │   │   ├── types.ts
│   │   │   │   └── components/
│   │   │   │       ├── NouveauModele.tsx
│   │   │   │       ├── MesModeles.tsx
│   │   │   │       ├── RegistreModeles.tsx
│   │   │   │       ├── PerformanceChart.tsx
│   │   │   │       ├── PerformanceComparee.tsx
│   │   │   │       ├── GestionDeploiement.tsx
│   │   │   │       ├── Header.tsx
│   │   │   │       └── Sidebar.tsx
│   │   │   │
│   │   │   ├── Predictions/
│   │   │   │   ├── index.tsx            ML predictions interface
│   │   │   │   ├── predictions.css
│   │   │   │   ├── structure_prediction.txt
│   │   │   │   ├── types.ts
│   │   │   │   └── components/
│   │   │   │       ├── Header.tsx
│   │   │   │       ├── FileUploadCard.tsx
│   │   │   │       ├── ModelSelector.tsx
│   │   │   │       ├── PredictionSettings.tsx
│   │   │   │       ├── ActionButton.tsx
│   │   │   │       ├── PredictionChart.tsx
│   │   │   │       ├── ResultsCard.tsx
│   │   │   │       ├── ExplanationsCard.tsx
│   │   │   │       └── AgentLogs.tsx
│   │   │   │
│   │   │   ├── Training/
│   │   │   │   ├── index.tsx            Model training orchestration
│   │   │   │   ├── training.css
│   │   │   │   ├── Training_structure.txt
│   │   │   │   ├── types.ts
│   │   │   │   └── components/
│   │   │   │       ├── DatasetUpload.tsx
│   │   │   │       ├── ModelSelection.tsx
│   │   │   │       ├── AgentOptionsCard.tsx
│   │   │   │       ├── StartTrainingButton.tsx
│   │   │   │       ├── TrainingProgress.tsx
│   │   │   │       ├── AgentTrainingLogs.tsx
│   │   │   │       └── ResultsCard.tsx
│   │   │   │
│   │   │   ├── Agents/
│   │   │   │   ├── index.tsx            Agent management & monitoring
│   │   │   │   ├── agents.css
│   │   │   │   ├── structure_agent.txt
│   │   │   │   ├── types.ts
│   │   │   │   └── components/
│   │   │   │       ├── CompatibilityCard.tsx
│   │   │   │       ├── DelegationCard.tsx
│   │   │   │       ├── FluxCard.tsx
│   │   │   │       └── PerformanceCard.tsx
│   │   │   │
│   │   │   ├── Outils/                 Tools & diagnostics
│   │   │   │   ├── index.tsx
│   │   │   │   ├── outils.css
│   │   │   │   ├── types.ts
│   │   │   │   └── components/
│   │   │   │       ├── DataQualityCard.tsx
│   │   │   │       ├── DiagnosticCard.tsx
│   │   │   │       ├── ExportCard.tsx
│   │   │   │       └── SystemLogsCard.tsx
│   │   │   │
│   │   │   ├── Parametres/             Settings & configuration
│   │   │   │   ├── index.tsx            ✓ Tabs: Entreprise, Parc Machines
│   │   │   │   ├── parametres.css       ✓ Complete styling
│   │   │   │   └── components/
│   │   │   │       ├── EntrepriseForm.tsx
│   │   │   │       └── ParcMachines.tsx
│   │   │   │
│   │   │   ├── README.md                Page documentation
│   │   │   └── images/
│   │   │       ├── agent_page.png
│   │   │       ├── data.png
│   │   │       ├── model_page.png
│   │   │       ├── prediction_page.png
│   │   │       └── training_page.png
│   │   │
│   │   ├── postcss.config.js
│   │   ├── tailwind.config.js
│   │   └── vite-env.d.ts
│   │
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   │
│   ├── index.html                       ✓ HTML entry point
│   ├── package.json                     ✓ NPM dependencies
│   ├── package-lock.json                ✓ Lock file
│   ├── vite.config.js                   ✓ Vite build config
│   ├── eslint.config.js                 ESLint configuration
│   └── tailwind.config.js               TailwindCSS config
│
├── 📊 DATA GENERATION
│   ├── generate_datasets/
│   │   ├── 1_vibration_monitoring.py    1000 vibration measurements
│   │   ├── 2_maintenance_records.py     500+ maintenance work orders
│   │   ├── 3_daily_kpis.py              450+ daily KPI records
│   │   ├── 4_iot_sensors.py             700+ sensor readings
│   │   ├── 5_machine_health.py          585 health/RUL predictions
│   │   ├── 6_alerts_anomalies.py        600+ alert logs
│   │   │
│   │   └── output/                      Generated CSV files
│   │       ├── vibration_monitoring.csv
│   │       ├── maintenance_records.csv
│   │       ├── daily_kpis.csv
│   │       ├── iot_sensors.csv
│   │       ├── machine_health.csv
│   │       └── alerts_anomalies.csv
│   │
│   └── trained_models/                  Persisted ML models
│       └── README.md
│
├── 📁 DATA DIRECTORIES
│   └── data/
│       ├── uploads/                     User-uploaded files (EDA processing)
│       └── README.md
│
├── 🗄️ DATABASE
│   └── backend/db/
│       ├── ai_maintenance.db            ✓ SQLite database
│       └── schema.sql                   Database schema
│
├── 📄 CONFIGURATION & DOCS
│   ├── .gitignore                       Git ignore rules
│   ├── README.md                        Project overview
│   ├── ETATAVANCEMENT.md                Progress tracking
│   ├── connaisance.md                   Knowledge base
│   ├── prompt-bd-sqlite.md              Database prompts
│   ├── dashboard-predictive.html        Static HTML mockup
│   │
│   └── postcss.config.js                PostCSS config
│
└── 🔧 BUILD & TOOLS
    ├── vite.config.js                   ✓ Vite bundler config
    ├── eslint.config.js                 Linting rules
    ├── tailwind.config.js               TailwindCSS setup
    ├── postcss.config.js                PostCSS processor
    └── .git/                            Git repository
```

---

## 📋 Summary Statistics

| Layer | Count | Key Files |
|-------|-------|-----------|
| **Backend Routes** | 4 | donnees.py, dashboard.py, maintenance.py, admin.py |
| **Frontend Pages** | 8 | Dashboard, Donnees, Maintenance, Models, Predictions, Training, Agents, Outils, Parametres |
| **React Components** | 30+ | Page components + sub-components |
| **Python Modules** | 3 | agents/, api/, db/, schemas/, services/ |
| **Data Generators** | 6 | CSV generators + output CSVs |
| **CSS Files** | 12+ | Page-specific + global styles |
| **Contexts** | 2 | ThemeContext, DatasetContext |

## 🎯 Key Integration Points

- **Backend ↔ Frontend**: FastAPI on port 8000, React on port 5173 (dev)
- **Database**: SQLite (`ai_maintenance.db`) with dynamic table creation
- **Data Flow**: User uploads → EDA processing (background) → PDF report + processed CSV → Dashboard display
- **State Management**: React Context for theme + dataset selection across pages
- **LLM Integration**: Claude API for EDA insights (requires `ANTHROPIC_API_KEY`)