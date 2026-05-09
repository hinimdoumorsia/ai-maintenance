# AI Maintenance — Système de Maintenance Prédictive Industrielle

## Contributeurs
**HINIMDOU MORSIA GUITDAM** — Élève ingénieur IA & Technologie des Données  
**Nankouli Marc Thierry** — Élève ingénieur IA & Technologie des Données  
**DJERI-ALASSANI OUBENOUPOU** — Élève ingénieur IA & Technologie des Données  

**Encadrant : Professeur Zaki**  
**École : École Nationale Supérieure d'Arts et Métiers Meknès (ENSAM)**

---

## Vue d'Ensemble

**AI Maintenance** est une plateforme web innovante de maintenance prédictive industrielle qui révolutionne la surveillance des équipements tournants. Développée avec les technologies les plus modernes, elle combine intelligence artificielle avancée, analyse de données temps réel et une interface utilisateur intuitive pour optimiser la maintenance industrielle.

### Objectif Principal
Permettre aux entreprises industrielles de **prévoir les pannes** avant qu'elles ne surviennent, **optimiser les interventions** de maintenance, **réduire les coûts** d'arrêt de production et **améliorer la disponibilité** des équipements critiques.

### Fonctionnalités Clés
- **Agent EDA Intelligent** : Analyse exploratoire automatique avec narration IA
- **Dashboard Temps Réel** : 9 piliers KPI avec visualisation interactive
- **8 Pages d'Analyse Spécialisée** : Vibratoire ISO, pronostic DRBF, KPIs, etc.
- **Support Multi-Format** : CSV, XLSX, TXT, ARFF, ZIP (NASA C-MAPSS, Weka)
- **Normes ISO Implémentées** : ISO 10816, ISO 20816, ISO 18436, ISO 13306

---

## Table des Matières

### [1. Présentation du Projet](#présentation-du-projet)
### [2. Approche de Développement](#approche-de-développement)
### [3. Architecture Frontend](#architecture-frontend)
### [4. Architecture Backend](#architecture-backend)
### [5. Pages de l'Application](#pages-de-lapplication)
   - [5.1 Dashboard](dashboard.md)
   - [5.2 Données](donnees.md)
   - [5.3 Entraînement](training.md)
   - [5.4 Prédictions](predictions.md)
   - [5.5 Modèles](models.md)
   - [5.6 Agents](agents.md)
   - [5.7 Maintenance](maintenance.md)
   - [5.8 Outils](outils.md)
   - [5.9 Paramètres](parametres.md)
   - [5.10 Authentification](auth.md)
   - [5.11 Aide & Documentation](aidedocumentation.md)
### [6. Équipe du Projet](#équipe-du-projet)
### [7. Produit Final](#produit-final)
### [8. État d'Avancement](#état-davancement-mai-2026)

---

## Présentation du Projet

**AI Maintenance** est une application web innovante de maintenance prédictive développée pour la surveillance vibratoire des machines tournantes. Le système combine intelligence artificielle avancée, analyse de données temps réel et interface utilisateur moderne pour optimiser la maintenance industrielle.

### Technologies Modernes
- **Frontend** : React 19, Vite 8, TypeScript, Tailwind CSS, Recharts
- **Backend** : Python 3.12, FastAPI, Pandas, Scikit-learn, MLflow
- **IA** : Claude Sonnet (Anthropic) avec prompting expert contextualisé
- **Base de données** : SQLite avec schéma relationnel complet
- **Déploiement** : Environnements virtuels, Docker potentiel

### Qualité et Standards
- Code Review systématique
- Tests unitaires et d'intégration
- Documentation technique complète
- Respect des normes ISO pour la maintenance prédictive
- Sécurité : Validation des entrées, gestion des erreurs

---

## Approche de Développement

### Méthodologie Agile
Le projet suit une approche de développement itératif et incrémental avec :
- Sprints courts de 2-3 semaines
- Réunions quotidiennes de synchronisation
- Démonstrations régulières des avancées
- Feedback continu de l'encadrant

### Architecture Technique
```
Frontend (React + TypeScript)
├── Interface utilisateur moderne avec Tailwind CSS
├── Composants réutilisables et modulaires
├── Intégration temps réel avec WebSockets/SSE
└── Optimisation des performances

Backend (Python + FastAPI)
├── API REST asynchrone haute performance
├── Pipeline ML automatisé avec MLflow
├── Base de données SQLite pour données locales
└── Agent IA avec Groq/Claude pour analyse intelligente

Infrastructure
├── Conteneurisation Docker
├── Environnements virtuels Python
├── Tests automatisés
└── Documentation MkDocs
```

---

## Architecture Frontend

### Technologies Utilisées
- **React 19** : Framework JavaScript moderne pour interfaces utilisateur
- **TypeScript** : Superset JavaScript avec typage statique
- **Vite 8** : Outil de build rapide pour développement moderne
- **Tailwind CSS** : Framework CSS utilitaire pour styling rapide
- **Recharts** : Bibliothèque de graphiques React

### Structure des Composants
```
src/
├── components/          # Composants réutilisables
│   ├── ui/             # Composants d'interface de base
│   ├── charts/         # Graphiques et visualisations
│   └── forms/          # Formulaires et inputs
├── pages/              # Pages principales de l'application
├── services/           # Services API et utilitaires
├── hooks/              # Hooks React personnalisés
└── utils/              # Fonctions utilitaires
```

### Fonctionnalités Clés
- **Routing** : Navigation SPA avec React Router
- **State Management** : Gestion d'état avec React Hooks
- **API Integration** : Communication avec backend via Axios/Fetch
- **Responsive Design** : Interface adaptative mobile/desktop
- **Real-time Updates** : Mise à jour temps réel avec WebSockets/SSE

---

## Architecture Backend

### Technologies Utilisées
- **Python 3.12** : Langage de programmation principal
- **FastAPI** : Framework web asynchrone haute performance
- **Pandas** : Manipulation et analyse de données
- **Scikit-learn** : Algorithmes de machine learning
- **MLflow** : Tracking et gestion des expériences ML
- **SQLite** : Base de données locale

### Structure du Backend
```
backend/
├── api/                # Points d'entrée API FastAPI
├── data/               # Gestion des données et base de données
├── training/           # Pipeline d'entraînement ML
│   ├── agent/          # Agent IA pour analyse EDA
│   ├── api/            # API d'entraînement
│   ├── config/         # Configuration
│   ├── models/         # Modèles sauvegardés
│   ├── pipeline/       # Orchestrateur ML
│   └── tools/          # Outils ML spécialisés
├── services/           # Services métier
└── logs/               # Logs et monitoring
```

### Fonctionnalités Clés
- **API REST** : Endpoints documentés avec OpenAPI/Swagger
- **Pipeline ML Automatisé** : Entraînement, validation et déploiement
- **Agent IA EDA** : Analyse exploratoire avec narration intelligente
- **Tracking MLflow** : Suivi des expériences et métriques
- **Streaming Logs** : Transmission temps réel des logs d'entraînement

### Base de Données
- **SQLite** : Base de données relationnelle locale
- **Schéma** : Tables pour datasets, modèles, métriques, utilisateurs
- **Seed Data** : Données de démonstration préchargées

---

## Pages de l'Application

### Dashboard
**Page principale** offrant une vue d'ensemble complète du système de maintenance prédictive.

**Fonctionnalités :**
- **9 Piliers KPI** : Métriques temps réel (disponibilité, MTBF, MTTR, etc.)
- **Graphiques Interactifs** : Courbes de performance, tendances, alertes
- **Vue d'ensemble** : État général du parc machines
- **Navigation Rapide** : Accès direct aux autres modules

---

### Données
**Centre d'analyse de données** avec 8 sous-pages spécialisées pour l'exploration et l'analyse des datasets.

**Fonctionnalités :**
- Chargement & Visualisation des données
- Analyse Vibratoire ISO 10816/20816
- Pronostic DRBF avec courbes de dégradation
- KPIs & Métriques automatiques
- Gestion du Parc Machines
- Monitoring IoT temps réel
- Classification VIS (états de santé)
- Rapports PDF automatiques

---

### Entraînement
**Interface de formation des modèles** de machine learning pour la maintenance prédictive.

**Fonctionnalités :**
- Configuration Pipeline : Sélection algorithmes, paramètres, preprocessing
- Entraînement Temps Réel : Suivi progressif avec logs streaming
- Validation Croisée : Évaluation robuste des performances
- Comparaison Modèles : Baseline vs modèles optimisés
- Rapports Détaillés : Métriques, courbes d'apprentissage, matrices de confusion

---

### Prédictions
**Module d'exécution de prédictions** sur nouveaux datasets ou données temps réel.

**Fonctionnalités :**
- Chargement Données : Import de nouveaux datasets à prédire
- Sélection Modèle : Choix du modèle entraîné à utiliser
- Prédictions Batch : Traitement de gros volumes de données
- Visualisation Résultats : Graphiques de prédictions vs réalité
- Export Résultats : Téléchargement des prédictions au format CSV/JSON

---

### Modèles
**Gestionnaire de modèles** pour le déploiement et la supervision des modèles ML.

**Fonctionnalités :**
- Catalogue Modèles : Liste de tous les modèles entraînés
- Métriques Performance : Accuracy, Precision, Recall, F1-Score
- Déploiement : Activation/désactivation de modèles en production
- Versioning : Historique des versions de modèles
- Monitoring : Suivi des performances en production

---

### Agents
**Supervision des agents IA** et de leurs interactions avec le système.

**Fonctionnalités :**
- Agent EDA : Statut et historique des analyses
- Agent Prédiction : Supervision des prédictions automatiques
- Flux de Travail : Visualisation des pipelines d'exécution
- Logs IA : Historique des interactions avec Claude/Groq
- Configuration : Paramétrage des agents et seuils

---

### Maintenance
**Outils de maintenance système** et gestion opérationnelle.

**Fonctionnalités :**
- Sauvegardes : Gestion des sauvegardes de données
- Logs Système : Consultation des logs d'application
- Métriques Performance : Monitoring des ressources système
- Nettoyage : Suppression des données temporaires
- Diagnostics : Tests de santé du système

---

### Outils
**Utilitaires avancés** pour les analyses spécialisées et le debugging.

**Fonctionnalités :**
- Outils Statistiques : Tests statistiques avancés
- Visualisations Personnalisées : Graphiques sur mesure
- Export Données : Conversion et export de données
- API Testing : Tests des endpoints backend
- Debug Tools : Outils de débogage et profiling

---

### Paramètres
**Configuration système** et personnalisation utilisateur.

**Fonctionnalités :**
- Paramètres Utilisateur : Préférences personnelles
- Configuration Système : Paramètres globaux
- Thèmes : Personnalisation de l'interface
- Notifications : Gestion des alertes et emails
- Sécurité : Gestion des mots de passe et accès

---

### Authentification
**Système de gestion des utilisateurs** et contrôle d'accès.

**Fonctionnalités :**
- Connexion/Déconnexion : Authentification utilisateur
- Gestion Comptes : Création et modification de profils
- Rôles & Permissions : Contrôle d'accès granulaire
- Session Management : Gestion des sessions utilisateur
- Sécurité : Protection contre les attaques courantes

---

### Aide & Documentation
**Centre d'aide intégré** avec documentation utilisateur et guides.

**Fonctionnalités :**
- Documentation Interactive : Guides d'utilisation
- FAQ : Questions fréquemment posées
- Tutoriels : Guides pas à pas
- Support : Contact et assistance
- Mises à Jour : Notes de version et changelog

---

## Équipe du Projet

### Contributeurs

#### HINIMDOU MORSIA GUITDAM
- **Rôle** : Développement Frontend & Architecture
- **Compétences** : React, TypeScript, UI/UX Design
- **Contributions** : Interface utilisateur complète, Composants React modulaires, Intégration API frontend, Design système avec Tailwind CSS

#### Nankouli Marc Thierry
- **Rôle** : Développement Backend & IA
- **Compétences** : Python, FastAPI, Machine Learning
- **Contributions** : API FastAPI robuste, Pipeline ML automatisé, Agent IA avec Claude, Intégration MLflow

#### DJERI-ALASSANI OUBENOUPOU
- **Rôle** : Développement Full-Stack & Qualité
- **Compétences** : Python, React, Testing, DevOps
- **Contributions** : Architecture système globale, Tests et validation, Optimisation performances, Documentation technique

### Encadrant Académique

#### Professeur Zaki
- **Institution** : École d'Ingénierie
- **Domaine** : Intelligence Artificielle & Technologies des Données
- **Rôle** : Supervision technique, Validation architecturale, Encadrement méthodologique, Évaluation des livrables

---

## Produit Final

### Application Web Complète
**AI Maintenance** sera une solution SaaS prête pour le déploiement en entreprise avec :

#### Interface Utilisateur
- Dashboard Principal avec KPIs temps réel
- Page Données avec 8 sous-pages d'analyse spécialisée
- Page Entraînement pour modèles ML
- Page Prédictions pour exécution de prédictions
- Page Modèles pour gestion et déploiement
- Page Agents pour supervision IA
- Pages Outils & Maintenance

#### Backend Robuste
- API REST complète avec documentation OpenAPI
- Pipeline ML automatisé avec tracking MLflow
- Agent EDA intelligent avec narration IA
- Base de données SQLite avec données de démonstration
- Streaming temps réel des logs d'entraînement

#### Fonctionnalités Avancées
- Score Qualité 0-100 pour évaluation des datasets
- Scaler Adaptatif (StandardScaler vs RobustScaler)
- Détection Outliers IQR avec visualisation boxplots
- Encodage Intelligent des variables catégorielles
- Rapports PDF automatiques avec analyses détaillées
- Prompting IA Expert contextualisé par type de données

### Livrables Prévus
1. Code Source complet et documenté
2. Documentation Technique (MkDocs)
3. Guide d'Installation et déploiement
4. Jeu de Données de démonstration
5. Rapport Final du projet
6. Présentation des résultats

### Déploiement et Maintenance
- Environnements : Développement, Test, Production
- Conteneurisation Docker pour facilité de déploiement
- Monitoring des performances et logs
- Mises à jour régulières selon les retours utilisateurs
- Support technique post-déploiement

### Impact Industriel
- Réduction des coûts de maintenance de 20-30%
- Augmentation de la disponibilité des équipements
- Prévention des pannes critiques
- Optimisation des interventions de maintenance
- Conformité aux normes ISO internationales

---

## État d'Avancement (Mai 2026)

### Fonctionnalités Implémentées
- Interface utilisateur complète (React + TypeScript)
- API backend FastAPI opérationnelle
- Agent EDA avec 14 étapes de prétraitement
- Pipeline ML avec MLflow tracking
- Dashboard avec 9 piliers KPI
- 8 pages d'analyse spécialisées
- Streaming temps réel des logs
- Base de données SQLite avec seed

### En Cours de Développement
- Pages Prédictions, Modèles, Agents
- Optimisations de performance
- Tests automatisés complets
- Documentation utilisateur finale

### Objectifs Restants
- Finalisation des pages secondaires
- Tests d'intégration end-to-end
- Optimisation des performances
- Préparation au déploiement

---

*Ce document est mis à jour régulièrement pour refléter l'avancement du projet AI Maintenance.*
