# Modèles

## Vue d'Ensemble

La page **Modèles** est le gestionnaire de modèles ML pour le déploiement et la supervision des modèles en production. Elle offre un contrôle complet sur le cycle de vie des modèles.

## Architecture

### Composants Principaux

#### 1. Catalogue des Modèles
**Informations Affichées** :
- Nom du modèle
- Type d'algorithme
- Date de création
- Performance (Accuracy, F1-Score)
- État (Actif, Staging, Inactif)

#### 2. Métriques de Performance
**Indicateurs Clés** :
- Accuracy : Précision globale
- Precision : Précision par classe
- Recall : Couverture par classe
- F1-Score : Moyenne harmonique
- AUC-ROC : Courbe ROC
- Confusion Matrix : Matrice de confusion

#### 3. Gestion du Déploiement
**Actions Possibles** :
- Activer un modèle (Production)
- Passer en Staging (Test)
- Désactiver (Archive)
- Tester sur données
- Comparer avec modèle actif

#### 4. Versioning et Historique
**Traçabilité** :
- Version du modèle
- Date de création
- Paramètres utilisés
- Dataset d'entraînement
- Performance par version

#### 5. Monitoring en Production
**Surveillance** :
- Nombre de prédictions
- Temps de réponse moyen
- Taux d'erreur
- Dérive du modèle (Model Drift)
- Alertes d'anomalies

## Détails Techniques

### Stockage des Modèles
- **MLflow Model Registry** : Gestion des versions
- **Format** : Pickle/ONNX pour portabilité
- **Location** : `/backend/training/models/`
- **Metadata** : JSON avec paramètres et métriques

### Connexion aux Données
- API Endpoint: `/api/models/list`
- API Endpoint: `/api/models/deploy`
- API Endpoint: `/api/models/metrics`
- MLflow Registry : Suivi centralisé

### Technologies Utilisées
- **MLflow** : Model Registry
- **FastAPI** : Endpoints d'administration
- **SQLite** : Stockage métadonnées
- **Prometheus** : Monitoring (optionnel)

### Limites et Contraintes
- Max modèles en production : 3
- Taille max modèle : 1 GB
- Rétention versions : 12 mois

## Workflow de Déploiement

```
1. Modèle Entraîné
   ↓
2. Enregistrement MLflow
   ├─ Metrics logging
   ├─ Artifacts save
   └─ Parameters logging
   ↓
3. Staging Evaluation
   ├─ Validation sur test set
   ├─ Performance check
   └─ Drift detection
   ↓
4. Approval
   ├─ Review manuel
   └─ Comparaison vs production
   ↓
5. Déploiement Production
   ├─ Activation
   ├─ Monitoring
   └─ Fallback plan
```

## Interface

```
┌─────────────────────────────────────────┐
│ Catalogue Modèles                        │
├─────────────────────────────────────────┤
│ [Modèle 1]  [Modèle 2]  [Modèle 3]     │
│ Active      Staging      Inactive        │
│ Acc: 0.94   Acc: 0.92   Acc: 0.89      │
├─────────────────────────────────────────┤
│ Détails Modèle Sélectionné               │
│ Type: Random Forest                      │
│ Version: 3.2                             │
│ Created: 2026-05-08 14:30                │
│ Accuracy: 94%                            │
│ F1-Score: 0.92                           │
├─────────────────────────────────────────┤
│ [ACTIVER] [TESTER] [COMPARER] [SUPPR]  │
└─────────────────────────────────────────┘
```

---

*Documentation Modèles - Mise à jour Mai 2026*
