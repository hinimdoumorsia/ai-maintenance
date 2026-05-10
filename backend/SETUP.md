# 🚀 GUIDE DE DÉMARRAGE — Backend AI Maintenance

## 📋 Prérequis

- **Python 3.9+** (de préférence 3.11)
- **pip** (gestionnaire de paquets Python)
- **Clé API Groq** (pour l'entraînement intelligent)
- **Clé API Anthropic** (optionnel, pour recommandations EDA)

---

## 🔧 Installation

### 1️⃣ Cloner et accéder au backend

```bash
cd ai-maintenance/backend
```

### 2️⃣ Créer un environnement virtuel Python

```bash
# Sur Windows
python -m venv venv
venv\Scripts\activate

# Sur macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3️⃣ Installer les dépendances

```bash
# Installation globale (data + training)
pip install -r requirements.txt
pip install -r training/requirements.txt

# OU installation séparée
# Pour backend_data
pip install fastapi uvicorn sqlalchemy pandas openpyxl numpy matplotlib seaborn scipy scikit-learn fpdf2 anthropic chardet python-dotenv liac-arff zipfile36 aiofiles chromadb sentence-transformers langchain langchain-community tqdm

# Pour backend/training
pip install pandas numpy scikit-learn scipy xgboost catboost mlflow groq fastapi uvicorn python-multipart openpyxl python-dotenv
```

---

## 🔐 Configuration (Variables d'environnement)

### 📌 Fichiers à créer

Deux fichiers `.env` doivent être créés :

#### 1. `backend/.env` (pour backend_data)
```bash
cp backend/.env.example backend/.env
```

Puis éditer `backend/.env` et remplacer :
- **ANTHROPIC_API_KEY** : Votre clé API Anthropic (optionnel)
- **SECRET_KEY** : Une vraie clé secrète pour la production

#### 2. `backend/training/.env` (pour agent de training)
```bash
cp backend/training/.env.example backend/training/.env
```

Puis éditer `backend/training/.env` et remplacer :
- **GROQ_API_KEY** : Votre clé API Groq (OBLIGATOIRE) 🔴
  - Obtenir depuis : https://console.groq.com/keys
- **GROQ_MODEL** : Modèle Groq (défaut : `llama3-70b-8192`)

---

## ⚡ Démarrage

### Option A : Démarrer les deux APIs simultanément

#### Terminal 1 - Backend Data API (port 8001)
```bash
cd backend/backend_data
uvicorn main:app --reload --port 8001
```

#### Terminal 2 - Training API (port 8000)
```bash
cd backend/training
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Terminal 3 (optionnel) - MLflow UI
```bash
cd backend/training
mlflow ui --backend-store-uri ./mlruns --port 5000
```

### Option B : Tester le pipeline sans Groq

```bash
cd backend/training
python demo.py  # Lance un test sans API Groq
```

---

## 🔌 Endpoints API

### Backend Training (Port 8000)

| Méthode | URL | Description |
|---------|-----|------------|
| `POST` | `/upload` | Upload dataset + lance entraînement |
| `GET` | `/logs/{job_id}` | Logs temps réel (SSE streaming) |
| `GET` | `/results/{job_id}` | Résultats entraînement |
| `GET` | `/jobs` | Liste tous les jobs |
| `GET` | `/health` | Santé de l'API |

**Exemple POST /upload** :
```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@data.csv" \
  -F "model_id=catboost" \
  -F "target_col=Maintenance Required"
```

### Backend Data (Port 8001)

| Endpoint | Description |
|----------|------------|
| `/dashboard` | Données du tableau de bord |
| `/donnees` | Gestion des datasets |
| `/maintenance` | Requêtes maintenance |
| `/chatbot` | API chatbot (RAG) |
| `/health` | Santé API |

---

## 📊 Suivre l'entraînement

### 1. Via la console Python
```python
import requests
import json

# Uploader un fichier
response = requests.post(
    "http://localhost:8000/upload",
    files={"file": open("data.csv", "rb")},
    data={
        "model_id": "catboost",
        "target_col": "Maintenance Required"
    }
)

job_id = response.json()["job_id"]
print(f"Job démarré : {job_id}")

# Suivre les logs en temps réel
import requests
from sseclient import SSEClient

url = f"http://localhost:8000/logs/{job_id}"
client = SSEClient(url)
for event in client:
    print(json.loads(event.data))
```

### 2. Via MLflow UI
```bash
# Ouvrir http://localhost:5000
mlflow ui --backend-store-uri ./training/mlruns --port 5000
```

### 3. Via le Frontend
L'interface React affichera automatiquement :
- Progression du pipeline ⏳
- Logs en temps réel 📝
- Résultats (scores baseline vs cleaned) 📊
- Rapport d'entraînement 📄

---

## ✅ Checklist de démarrage

- [ ] Python 3.9+ installé
- [ ] Clé API Groq obtenue
- [ ] `backend/.env` créé et configuré
- [ ] `backend/training/.env` créé et configuré
- [ ] Dépendances installées (`pip install -r requirements.txt`)
- [ ] Backend data lancé (port 8001)
- [ ] Backend training lancé (port 8000)
- [ ] Frontend se connecte à `http://localhost:8000`
- [ ] MLflow UI accessible (optionnel)

---

## 🐛 Troubleshooting

### Erreur : "GROQ_API_KEY manquante"
```
❌ ValueError: GROQ_API_KEY manquante
```
**Solution** :
1. Générer une clé sur https://console.groq.com/keys
2. L'ajouter dans `backend/training/.env`
3. Redémarrer l'API

### Erreur : "Port 8000 déjà utilisé"
```
❌ OSError: [Errno 48] Address already in use
```
**Solution** :
```bash
# Sur Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process

# Sur macOS/Linux
lsof -ti:8000 | xargs kill -9
```

### Erreur : "Module not found"
```
❌ ModuleNotFoundError: No module named 'groq'
```
**Solution** :
```bash
pip install -r requirements.txt
pip install -r training/requirements.txt
```

### Frontend ne se connecte pas au backend

Vérifier :
1. Backend training lancé sur `http://localhost:8000`
2. CORS bien configuré (devrait être "*")
3. Pas de firewall bloquant le port 8000

---

## 📚 Documentation supplémentaire

- [README.md](./training/README.md) - Architecture du pipeline training
- [.env.example](./backend/.env.example) - Variables d'environnement
- [requirements.txt](./requirements.txt) - Dépendances complètes

---

## 🚀 Prochaines étapes

1. **Intégrer une vraie clé Groq** pour activer l'agent LLM
2. **Configurer l'authentification JWT** pour la production
3. **Mettre en place une vraie base de données** (PostgreSQL)
4. **Ajouter les logs persistants** pour le debugging
5. **Déployer sur Azure** ou autre cloud provider

---

**Questions ?** Consultez les READMEs spécifiques ou vérifiez les logs API.

