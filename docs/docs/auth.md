# Authentification

## Vue d'Ensemble

La page **Authentification** gère le système de contrôle d'accès, les comptes utilisateurs et les permissions. Elle sécurise l'accès à l'application et protège les données sensibles.

## Architecture

### Systèmes d'Authentification

#### 1. Connexion/Déconnexion
**Flux d'Authentification** :
1. Saisie identifiants (email/username + password)
2. Validation des credentials
3. Génération JWT token
4. Stockage token client (localStorage/sessionStorage)
5. Redirection vers dashboard
6. Transmission token dans headers

**Features** :
- "Se souvenir de moi" option
- Récupération mot de passe oublié
- Limitation tentatives (brute force protection)
- Captcha après 5 tentatives échouées

#### 2. Gestion des Comptes
**Actions Disponibles** :
- Créer nouveau compte
- Modifier profil utilisateur
- Supprimer compte
- Archiver utilisateur inactif
- Réactiver compte archivé

**Informations Stockées** :
- Email unique
- Hash du mot de passe (bcrypt)
- Nom complet
- Rôle utilisateur
- Date création/modification
- Statut (Actif/Inactif)

#### 3. Rôles et Permissions
**Rôles Disponibles** :
- **Admin** : Accès complet au système
- **Engineer** : Accès données et entraînement
- **Analyst** : Accès lecture seule
- **Guest** : Accès demo limité

**Permissions Granulaires** :
- Lecture datasets
- Créer modèles
- Déployer en production
- Gérer utilisateurs
- Accès administration

#### 4. Gestion des Sessions
**Contrôles** :
- Session timeout : 24 heures
- Sessionîots multiples : Autorisé (max 5)
- Logout distant : Possible
- Device fingerprinting : Activé
- IP tracking : Disponible

**Features** :
- Affichage des sessions actives
- Fermeture sélective de sessions
- Notifications d'accès inusuel
- Révocation token automatique

#### 5. Sécurité Avancée
**Authentification 2FA** :
- TOTP (Google Authenticator)
- Email OTP
- SMS OTP (optionnel)
- Backup codes

**Protections** :
- Hachage mot de passe fort (bcrypt)
- Salting des hashes
- HTTPS obligatoire
- CSRF tokens
- Rate limiting

## Flux d'Authentification

```
┌─────────────────────────┐
│ Accès Application       │
├─────────────────────────┤
│ Token Valide?           │
├─ OUI → Dashboard        │
└─ NON → Page Login       │
        ├─────────────────┤
        │ Saisir Creds    │
        ├─────────────────┤
        │ Valider Creds   │
        ├─ Valides → JWT  │
        │ ├─ 2FA? → OTP   │
        │ └─ Dashboard    │
        └─ Invalides →   │
           Erreur         │
```

## Détails Techniques

### JWT Tokens
- **Encoding** : HS256
- **Expiration** : 24 heures
- **Refresh** : Via refresh token (7 jours)
- **Claims** : user_id, role, permissions

### Stockage Données
- **Passwords** : Bcrypt hashs (sqlite)
- **Sessions** : Redis cache
- **Tokens** : Client localStorage
- **Audit logs** : SQLite logs table

### Endpoints
- `POST /api/auth/login` : Authentification
- `POST /api/auth/logout` : Déconnexion
- `POST /api/auth/refresh` : Renouveler token
- `GET /api/auth/profile` : Profil courant
- `GET /api/auth/sessions` : Sessions actives

### Sécurité
- Validation tous les inputs
- Rate limiting par IP
- Monitoring tentatives échouées
- Alertes accès suspects
- Audit trail complet

## Interface

```
┌─────────────────────────────────┐
│ AI Maintenance - Connexion      │
├─────────────────────────────────┤
│                                  │
│ Email: [_______________]         │
│ Mot de passe: [___________]      │
│                                  │
│ [✓] Se souvenir de moi          │
│                                  │
│ [CONNEXION]                      │
│                                  │
│ Mot de passe oublié? [Cliquez]  │
│ Pas de compte? [Inscrivez-vous] │
└─────────────────────────────────┘
```

---

*Documentation Authentification - Mise à jour Mai 2026*
