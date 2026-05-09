# Agents

## Vue d'Ensemble

La page **Agents** est dédiée à la supervision des agents IA et de leurs interactions avec le système. Elle permet de monitorer, configurer et contrôler les agents automatisés.

## Architecture

### Agents Disponibles

#### 1. Agent EDA (Exploratory Data Analysis)
**Rôle** : Analyse exploratoire automatique des datasets

**Fonctionnalités** :
- Chargement et inspection de données
- Détection des anomalies
- Analyse statistique complète
- Génération de rapports IA
- Score qualité du dataset (0-100)

**Étapes** :
- 14 étapes de prétraitement automatisé
- Détection des valeurs manquantes
- Détection des outliers (IQR)
- Encodage intelligent
- Normalisation adaptive

#### 2. Agent Prédiction
**Rôle** : Exécution des prédictions

**Fonctionnalités** :
- Supervision des prédictions
- Monitoring de la précision
- Détection de dérive de modèle
- Alertes automatiques
- Logging des prédictions

#### 3. Agent Maintenance
**Rôle** : Maintenance préventive du système

**Fonctionnalités** :
- Nettoyage des données temporaires
- Optimisation des bases de données
- Maintenance des logs
- Sauvegarde automatique

## Flux de Travail des Agents

```
┌─────────────────────────────────┐
│ Trigger (Manuel/Automatique)    │
├─────────────────────────────────┤
│ Agent Initialization             │
├─────────────────────────────────┤
│ Context Loading                  │
├─────────────────────────────────┤
│ Task Execution                   │
├─────────────────────────────────┤
│ Result Processing                │
├─────────────────────────────────┤
│ Report Generation                │
├─────────────────────────────────┤
│ Notification (si nécessaire)    │
└─────────────────────────────────┘
```

## Détails Techniques

### Communication IA
- **Provider** : Anthropic Claude Sonnet
- **Alternative** : Groq API
- **Context Window** : 200k tokens
- **Temperature** : 0.7 pour création, 0 pour analyse

### Prompting Expert
- Prompting contextualisé par type de données
- System prompts spécialisés par agent
- Chain-of-thought reasoning
- Few-shot learning quand approprié

### Stockage des Logs
- **Location** : `/backend/logs/agents/`
- **Format** : JSON avec timestamps
- **Rétention** : 3 mois
- **Compression** : Gzip après 7 jours

### Sécurité
- Validation des inputs
- Limitation des ressources
- Audit trails complets
- Sandboxing des exécutions

## Supervision et Monitoring

### État des Agents
- Status : Active/Inactive/Error
- Dernier run : Timestamp
- Durée moyenne : Millisecondes
- Taux de succès : Pourcentage
- Erreurs récentes : Liste

### Historique d'Exécution
- Logs détaillés de chaque run
- Résultats produits
- Temps d'exécution
- Consommation de ressources

## Interface

```
┌──────────────────────────────────┐
│ Agents Disponibles               │
├──────────────────────────────────┤
│ [Agent EDA]  [Agent Prédiction]  │
│ Status: ✓    Status: ✓           │
│ Last: 14:30  Last: 14:25         │
├──────────────────────────────────┤
│ Détails Agent Sélectionné         │
│ Statut: Actif                     │
│ Configurations: [...]             │
│ Dernières Exécutions:             │
│ • 2026-05-09 14:30 - Success      │
│ • 2026-05-09 14:00 - Success      │
├──────────────────────────────────┤
│ [LANCER] [CONFIGURER] [LOGS]     │
└──────────────────────────────────┘
```

---

*Documentation Agents - Mise à jour Mai 2026*
