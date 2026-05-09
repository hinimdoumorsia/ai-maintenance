# Prédictions

## Vue d'Ensemble

La page **Prédictions** est le module d'exécution de prédictions sur nouveaux datasets ou données temps réel. Elle permet de charger des données, sélectionner un modèle entraîné et générer des prédictions.

## Architecture

### Composants Principaux

#### 1. Chargement des Données
**Fonctionnalités** :
- Import de données à prédire
- Formats supportés : CSV, XLSX, TXT, ARFF
- Validation du schéma
- Aperçu des données avant prédiction

#### 2. Sélection du Modèle
**Fonctionnalités** :
- Liste des modèles disponibles
- Filtre par type d'algorithme
- Filtre par date de création
- Informations du modèle (accuracy, F1, etc.)

#### 3. Exécution des Prédictions
**Modes** :
- **Batch** : Traitement de gros volumes (> 1000 lignes)
- **Real-time** : Prédictions individuelles
- **Streaming** : Flux continu de données

#### 4. Visualisation des Résultats
**Éléments** :
- Tableau des prédictions
- Distribution des classes prédites
- Graphique Prédictions vs Réalité (si données ground truth)
- Heatmap de confiance

#### 5. Export des Résultats
**Formats** :
- CSV avec colonnes originales + prédictions
- JSON pour intégration API
- Excel avec formatage
- PDF avec visualisations

## Workflow de Prédiction

```
1. Chargement Données
   ↓
2. Validation Schéma
   ↓
3. Sélection Modèle
   ↓
4. Préparation Données
   ├─ Scaling
   ├─ Encoding
   └─ Feature Selection
   ↓
5. Inférence
   ├─ Prédictions
   └─ Probabilités
   ↓
6. Post-Processing
   ├─ Seuillage
   └─ Filtrage
   ↓
7. Visualisation & Export
```

## Détails Techniques

### Connexion aux Données
- API Endpoint: `/api/predictions/predict`
- API Endpoint: `/api/predictions/batch`
- Streaming Endpoint: `/api/predictions/stream`
- Cache des modèles : En mémoire

### Technologies Utilisées
- **Scikit-learn** : Inférence modèles
- **Pandas** : Transformation données
- **Plotly** : Visualisations
- **FastAPI** : Endpoints asynchrones

### Limites et Contraintes
- Batch max size : 10,000 lignes
- Temps inférence max : 30 secondes
- Nombre max modèles en cache : 5

### Sécurité
- Validation des données d'entrée
- Vérification du schéma
- Limitation des ressources
- Logs des prédictions

## Interface

```
┌──────────────────────────────────────┐
│ Chargement Données                    │
│ [📁 Sélectionner Fichier]             │
├──────────────────────────────────────┤
│ Sélection Modèle                      │
│ Modèle: [Random Forest (94% acc)]    │
├──────────────────────────────────────┤
│ [PRÉDIRE] [EXPORTER] [RAFRAÎCHIR]   │
├──────────────────────────────────────┤
│ Résultats:                            │
│ Distribution Classes                  │
│ [Graphique Pie]                       │
│                                       │
│ Tableau Prédictions                   │
│ [Affichage Tableau]                   │
└──────────────────────────────────────┘
```

## Cas d'Usage

### Maintenance Prédictive
- Charger données capteurs IoT temps réel
- Prédire l'état des machines
- Alerter si risque de panne détecté
- Planifier les interventions

### Analyse Historique
- Importer données archivées
- Valider précision rétroactive
- Générer rapports
- Améliorer les modèles

---

*Documentation Prédictions - Mise à jour Mai 2026*
