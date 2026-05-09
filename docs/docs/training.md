# Entraînement

## Vue d'Ensemble

La page **Entraînement** est l'interface de formation des modèles de machine learning pour la maintenance prédictive. Elle permet de configurer, exécuter et évaluer des pipelines ML complets.

## Architecture

### Composants Principaux

#### 1. Configuration du Pipeline
**Fonctionnalités** :
- Sélection de l'algorithme
- Paramétrage des hyperparamètres
- Configuration du preprocessing
- Choix du scaler (StandardScaler/RobustScaler)
- Sélection des features

**Algorithmes Supportés** :
- Random Forest
- Gradient Boosting (CatBoost, XGBoost)
- SVM (Support Vector Machine)
- MLPClassifier (Réseaux de neurones)
- Logistic Regression

#### 2. Entraînement Temps Réel
**Fonctionnalités** :
- Démarrage/arrêt de l'entraînement
- Visualisation de la progression
- Streaming des logs en direct
- Métriques temps réel

#### 3. Validation Croisée
**Fonctionnalités** :
- K-Fold Cross-Validation
- Stratified K-Fold pour données imbalancées
- Métriques par fold
- Graphiques de convergence

#### 4. Comparaison Modèles
**Fonctionnalités** :
- Comparaison Baseline vs optimisé
- Tableaux comparatifs
- Graphiques de performance
- Export des résultats

#### 5. Rapports Détaillés
**Contenu** :
- Accuracy, Precision, Recall, F1-Score
- Matrice de confusion
- Courbes ROC/AUC
- Feature importance
- Temps d'exécution

## Pipeline ML

### Étapes du Pipeline

```
1. Sélection Dataset
   ↓
2. Configuration Preprocessing
   ├─ Handling Missing Values
   ├─ Feature Scaling
   └─ Encoding Catégoriques
   ↓
3. Sélection Features
   ├─ Feature Selection
   └─ Dimensionality Reduction
   ↓
4. Split Train/Test/Val
   ↓
5. Entraînement Modèle
   ├─ Cross-Validation
   └─ Hyperparameter Tuning
   ↓
6. Évaluation
   ├─ Métriques
   ├─ Visualisations
   └─ Report Generation
   ↓
7. Sauvegarde MLflow
   ├─ Model Registry
   ├─ Artifacts
   └─ Metrics Logging
```

## Détails Techniques

### Connexion aux Données
- API Endpoint: `/api/training/start`
- API Endpoint: `/api/training/metrics`
- Streaming : Server-Sent Events (SSE)
- MLflow Tracking : Suivi des expériences

### Technologies Utilisées
- **Scikit-learn** : Modèles et preprocessing
- **XGBoost/CatBoost** : Gradient Boosting
- **MLflow** : Experiment tracking
- **Pandas** : Manipulation données

### Sécurité
- Validation des paramètres
- Limitation du temps d'exécution
- Gestion des ressources
- Logs d'audit

## Interface

```
┌─────────────────────────────────────────┐
│ Configuration Pipeline                   │
├─────────────────────────────────────────┤
│ Algorithme: [______] | Hyperparams: [...] │
├─────────────────────────────────────────┤
│ [DÉMARRER] [ARRÊTER] [RESET]            │
├─────────────────────────────────────────┤
│ Progression: ████████░░ 80%             │
├─────────────────────────────────────────┤
│ Logs en Direct:                          │
│ 2026-05-09 14:30:22 - Démarrage...      │
│ 2026-05-09 14:30:45 - Fold 1/5...       │
├─────────────────────────────────────────┤
│ Métriques en Temps Réel:                 │
│ Accuracy: 0.94 | F1: 0.92               │
└─────────────────────────────────────────┘
```

---

*Documentation Entraînement - Mise à jour Mai 2026*
