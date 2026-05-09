# Outils

## Vue d'Ensemble

La page **Outils** offre des utilitaires avancés pour les analyses spécialisées, le debugging et les opérations techniques avancées.

## Architecture

### Outils Disponibles

#### 1. Outils Statistiques
**Analyses Possibles** :
- Tests d'hypothèse (T-test, Chi-square, ANOVA)
- Analyse de corrélation avancée
- Tests de normalité (Shapiro-Wilk, Kolmogorov-Smirnov)
- Tests de stationnarité (ADF, KPSS)
- Analyse de variance

**Paramètres** :
- Sélection des colonnes
- Niveau de confiance (95%, 99%)
- Alternative hypothesis
- Ajustement pour comparaisons multiples

#### 2. Visualisations Personnalisées
**Types de Graphiques** :
- Scatter plots 2D/3D
- Heatmaps de corrélation
- Distribution plots
- Time series plots
- Violin plots
- Box plots avancés

**Customization** :
- Sélection des variables
- Palettes de couleurs
- Tailles et styles
- Annotations

#### 3. Export et Conversion de Données
**Formats Supportés** :
- CSV → Excel/JSON/Parquet
- Excel → CSV/JSON/SQL
- JSON → CSV/Excel
- Parquet pour big data
- SQL export/import

**Transformations** :
- Transposition
- Pivoting
- Melt operations
- Format conversion

#### 4. API Testing
**Fonctionnalités** :
- Construction de requêtes HTTP
- Endpoints tester
- Paramètres et headers
- Réponses viewer
- Historique des requêtes

**Méthodes** :
- GET, POST, PUT, DELETE, PATCH
- Headers customisés
- Body JSON/Form
- Authentication

#### 5. Debugging et Profiling
**Outils Disponibles** :
- Execution profiler
- Memory profiler
- Response time analyzer
- Error traceback viewer
- SQL query analyzer

**Metriques** :
- Temps d'exécution
- Allocation mémoire
- Nombre d'appels
- Bottlenecks identifiés

## Détails Techniques

### Bibliothèques Utilisées
- **SciPy** : Tests statistiques
- **Plotly** : Visualisations interactives
- **Pandas** : Transformations données
- **Requests** : API testing
- **CProfile** : Profiling Python

### Endpoints
- `/api/tools/statistics` : Analyses statistiques
- `/api/tools/visualization` : Génération graphiques
- `/api/tools/export` : Export données
- `/api/tools/api-test` : Testing API

### Sécurité
- Validation des inputs
- Limitation du temps de calcul
- Limitation des ressources
- Logs de débogage

## Interface

```
┌──────────────────────────────────┐
│ Outils Avancés                   │
├──────────────────────────────────┤
│ [Stats] [Visuals] [Export]       │
│ [API Test] [Debug]               │
├──────────────────────────────────┤
│ Outil Sélectionné: Statistiques  │
│ Type de Test: [T-test ▼]         │
│ Variable 1: [____]               │
│ Variable 2: [____]               │
│ Confiance: [95% ▼]               │
│ [EXÉCUTER]                       │
├──────────────────────────────────┤
│ Résultats:                       │
│ P-value: 0.023                   │
│ T-statistic: 2.85                │
│ Significatif: Oui                │
└──────────────────────────────────┘
```

---

*Documentation Outils - Mise à jour Mai 2026*
