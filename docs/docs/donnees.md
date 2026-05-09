# Données

## Vue d'Ensemble

La page **Données** est le centre d'analyse et d'exploration des datasets. Elle propose 8 sous-pages spécialisées pour une exploration complète et une analyse approfondie des données.

## Architecture

### 8 Sous-Pages Principales

#### 1. Chargement & Visualisation
**Objectif** : Importer et visualiser les données brutes

**Fonctionnalités** :
- Import de fichiers (CSV, XLSX, TXT, ARFF, ZIP)
- Visualisation du tableau de données
- Aperçu des statistiques descriptives
- Détection automatique des colonnes

**Formats Supportés** :
- CSV/TSV - Fichiers texte séparés
- XLSX - Fichiers Excel
- ARFF - Format Weka
- ZIP - Archives contenant plusieurs fichiers
- NASA C-MAPSS - Format propriétaire

#### 2. Analyse Vibratoire ISO
**Objectif** : Vérifier la conformité ISO 10816 et ISO 20816

**Fonctionnalités** :
- Calcul des normes ISO automatique
- Classification des zones (Acceptable, Acceptable avec Restriction, Inacceptable)
- Graphiques de conformité
- Recommandations automatiques

**Normes Implémentées** :
- ISO 10816 - Vibrations des machines tournantes
- ISO 20816 - Évaluation des vibrations
- ISO 18436 - Niveaux d'expertise
- ISO 13306 - Termes et définitions

#### 3. Pronostic DRBF
**Objectif** : Analyser les courbes de dégradation

**Fonctionnalités** :
- Modèle DRBF (Degradation RUL-Based Forecasting)
- Courbes de dégradation prédites
- Estimation du RUL (Remaining Useful Life)
- Visualisations de pronostic

#### 4. KPIs & Métriques
**Objectif** : Calcul automatique des indicateurs de performance

**Indicateurs Disponibles** :
- MTBF : Temps moyen entre pannes
- MTTR : Temps moyen de réparation
- Disponibilité : Ratio de disponibilité
- Fiabilité : Taux de fiabilité
- Maintenabilité : Facture de maintenance

#### 5. Gestion Parc Machines
**Objectif** : Inventaire et suivi des équipements

**Fonctionnalités** :
- Catalogue des machines
- Historique des interventions
- Fiche technique de chaque équipement
- Alertes et anomalies détectées

#### 6. Monitoring IoT
**Objectif** : Données temps réel des capteurs connectés

**Fonctionnalités** :
- Flux de données en direct
- Graphiques temps réel
- Alertes instantanées
- Historique des valeurs

#### 7. Classification VIS
**Objectif** : États de santé des machines (Vibration ISO Standards)

**États Possibles** :
- Excellent : Zone A (Normal)
- Bon : Zone B (Surveillance recommandée)
- Acceptable : Zone C (Maintenance requise bientôt)
- Critique : Zone D (Non acceptable)

#### 8. Rapports PDF
**Objectif** : Génération automatique de rapports d'analyse

**Contenu** :
- Résumé exécutif
- Graphiques et visualisations
- Tableau de synthèse
- Recommandations

## Agent EDA Intelligent

### Analyse Exploratoire Automatisée
L'agent EDA réalise une analyse exploratoire complète du dataset :

**14 Étapes de Prétraitement** :
1. Chargement et inspection des données
2. Détection des valeurs manquantes
3. Détection des doublons
4. Analyse statistique descriptive
5. Détection des outliers (IQR)
6. Analyse de corrélation
7. Distribution des variables
8. Encodage des variables catégorielles
9. Normalisation/Standardisation
10. Feature selection
11. Vérification des dépendances
12. Score qualité du dataset
13. Rapport de qualité
14. Recommandations IA

### Score Qualité 0-100
- **90-100** : Excellent - Prêt pour ML
- **70-89** : Bon - Nettoyage mineur
- **50-69** : Acceptable - Nettoyage recommandé
- **< 50** : Pauvre - Transformation requise

### Narration IA
L'agent Claude Sonnet fournit :
- Description narrative de l'analyse
- Insights clés détectés
- Recommandations d'actions
- Suggestions de modèles ML appropriés

## Interface

```
┌────────────────────────────────────────┐
│ Sélecteur de Sous-Page                  │
├────────────────────────────────────────┤
│ [Chargement] [Vibrato] [DRBF] [KPIs]  │
│ [Parc] [IoT] [VIS] [PDF]              │
├────────────────────────────────────────┤
│                                        │
│   Contenu de la Sous-Page Sélectionnée│
│                                        │
│                                        │
└────────────────────────────────────────┘
```

## Détails Techniques

### Connexion aux Données
- API Endpoint: `/api/data/upload`
- API Endpoint: `/api/data/analyze`
- Stockage : SQLite + Fichiers temporaires
- Cache : 1 minute

### Technologies Utilisées
- **Pandas** : Manipulation de données
- **Scikit-learn** : Preprocessing et scaling
- **Plotly** : Visualisations interactives
- **FastAPI** : Endpoints API

### Limites et Contraintes
- Taille max fichier : 500 MB
- Nombre max colonnes : 1000
- Temps traitement max : 5 minutes

---

*Documentation Données - Mise à jour Mai 2026*
