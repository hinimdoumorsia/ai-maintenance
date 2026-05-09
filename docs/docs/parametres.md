# Paramètres

## Vue d'Ensemble

La page **Paramètres** permet la configuration système globale et la personnalisation de l'interface utilisateur. Elle est divisée en plusieurs sections d'administration.

## Architecture

### Sections de Configuration

#### 1. Paramètres Utilisateur
**Profil Personnel** :
- Nom complet
- Adresse email
- Avatar/Photo
- Préférences de communication
- Fuseau horaire
- Langue

**Préférences** :
- Theme de l'interface (Clair/Sombre)
- Densité des informations
- Notifications par défaut
- Taille de pagination

#### 2. Configuration Système
**Paramètres Globaux** :
- Titre de l'application
- Logs verbosity
- Niveau de cache
- Timeout des sessions
- Taille max upload

**Base de Données** :
- Hôte BD
- Port BD
- Nom BD
- Backup schedule

#### 3. Thématisation
**Options Disponibles** :
- Thème Clair/Sombre/Auto
- Palette de couleurs primaires
- Police d'affichage
- Taille des polices
- Contraste et accessibilité

**Prévisualisation** :
- Vue en temps réel
- Appliqué immédiatement
- Sauvegarde automatique

#### 4. Notifications et Alertes
**Configuration** :
- Email notifications : ON/OFF
- Alertes critiques : Immédiat/Batch
- Rapport quotidien : ON/OFF
- Rapport hebdomadaire : ON/OFF
- Rapport mensuel : ON/OFF

**Seuils** :
- CPU alerte : %
- Mémoire alerte : %
- Erreurs alerte : Nombre
- Timeout alerte : Secondes

#### 5. Sécurité et Authentification
**Gestion de Compte** :
- Changement de mot de passe
- Authentification 2FA
- Sessions actives
- Appareils autorisés
- Logs d'accès

**Politiques** :
- Expiration mot de passe
- Complexité requise
- Historique mots de passe
- Session timeout
- IP whitelist

#### 6. Intégrations Externes
**Services** :
- Groq API configuration
- Anthropic Claude setup
- Stockage cloud (optionnel)
- Webhook configuration

**Tokens** :
- API keys gestion
- Tokens d'authentification
- Génération automatique
- Rotation de tokens

## Détails Techniques

### Stockage des Préférences
- **Location** : SQLite `user_settings` table
- **Format** : JSON pour configs complexes
- **Cache** : Redis (optionnel)
- **Sync** : Real-time avec WebSockets

### Endpoints
- `/api/settings/user` : Paramètres utilisateur
- `/api/settings/system` : Paramètres système
- `/api/settings/theme` : Thématisation
- `/api/settings/notifications` : Alertes

### Sécurité
- Validation tous les inputs
- Sanitization des données
- Audit trails des changements
- Backup avant modifications

## Interface

```
┌─────────────────────────────────┐
│ Paramètres                       │
├─────────────────────────────────┤
│ [Utilisateur] [Système]         │
│ [Thème] [Notifications]         │
│ [Sécurité] [Intégrations]       │
├─────────────────────────────────┤
│ Section Sélectionnée:           │
│ Préférences Utilisateur         │
│                                  │
│ Nom: [HINIMDOU]                 │
│ Email: [user@ensam.ac.ma]       │
│ Thème: [Sombre ▼]               │
│ Langue: [Français ▼]            │
│                                  │
│ [SAUVEGARDER] [ANNULER]         │
└─────────────────────────────────┘
```

---

*Documentation Paramètres - Mise à jour Mai 2026*
