# Dashboard

## Vue d'Ensemble

Le **Dashboard** est la page principale de l'application AI Maintenance. Elle offre une vue d'ensemble complète du système avec des métriques clés en temps réel et des visualisations interactives.

## Architecture

### Composants Principaux

#### 1. Barre d'Entête
- Logo et titre de l'application
- Menu de navigation principal
- Zone de notifications
- Profil utilisateur

#### 2. Section KPI (9 Piliers)
- **Disponibilité Globale** : Pourcentage de disponibilité des machines
- **MTBF (Mean Time Between Failures)** : Temps moyen entre pannes
- **MTTR (Mean Time To Repair)** : Temps moyen de réparation
- **Coût Maintenance** : Coûts cumulatifs du mois
- **Alertes Critiques** : Nombre d'alertes nécessitant action
- **Machines Opérationnelles** : État des équipements
- **Efficiency Rate** : Taux d'efficacité global
- **Predictions Accuracy** : Précision des prédictions
- **System Health** : Santé générale du système

#### 3. Graphiques de Performance
- Courbes de tendance MTBF/MTTR
- Évolution de la disponibilité
- Distribution des alertes par type
- Évolution des coûts de maintenance

#### 4. Tableau de Synthèse
- Liste des machines critiques
- État des prédictions actives
- Alertes récentes
- Dernières actions de maintenance

## Interface

```
┌─────────────────────────────────────────────────────┐
│ Header avec Navigation et Profil                     │
├─────────────────────────────────────────────────────┤
│  KPI 1   │  KPI 2   │  KPI 3   │  KPI 4   │  KPI 5  │
├─────────────────────────────────────────────────────┤
│          Graphique de Performance Principal          │
├─────────────────────────────────────────────────────┤
│ Graphique 1       │       Graphique 2        │ GQ 3 │
├─────────────────────────────────────────────────────┤
│           Tableau de Synthèse / Alerts              │
└─────────────────────────────────────────────────────┘
```

## Détails Techniques

### Connexion aux Données
- API Endpoint: `/api/dashboard/metrics`
- Mise à jour : Temps réel via WebSocket
- Cache : 5 secondes pour optimiser les performances

### Technologies Utilisées
- **Recharts** : Graphiques interactifs
- **React Hooks** : Gestion d'état
- **Socket.io** : Streaming temps réel
- **Tailwind CSS** : Styling responsive

### Sécurité
- Authentification requise
- Validation des données reçues
- Protection contre XSS et CSRF

## Points d'Accès
- Lien direct vers chaque module depuis les cartes KPI
- Navigation rapide via le menu latéral
- Breadcrumbs pour localisation

---

*Documentation Dashboard - Mise à jour Mai 2026*
