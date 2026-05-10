# Point d'entrée principal pour lancer les deux APIs (backend_data et training)
import uvicorn
import threading
from fastapi import FastAPI
import sys
from pathlib import Path

# Ajouter le dossier backend au path pour les imports
sys.path.insert(0, str(Path(__file__).resolve().parent))

# Importer les applications FastAPI des deux backends
from backend.main import app as backend_app
from training.api.main import app as training_app

# Créer une application FastAPI principale
app = FastAPI(title="AI Maintenance - Point d'entrée principal")

# Monter les deux applications sous des préfixes différents
app.mount("/api", backend_app)  # backend_data sous /api
app.mount("/training", training_app)  # training sous /training

@app.get("/")
def root():
    return {
        "message": "AI Maintenance - Point d'entrée principal",
        "endpoints": {
            "backend_data": "/api",
            "training": "/training"
        }
    }

if __name__ == "__main__":
    # Lancer les deux serveurs dans des threads séparés
    def run_backend():
        uvicorn.run(
            "backend.main:app", 
            host="0.0.0.0", 
            port=8000, 
            reload=True,
            log_level="info"
        )

    def run_training():
        uvicorn.run(
            "training.api.main:app", 
            host="0.0.0.0", 
            port=8001,
            reload=True,
            log_level="info"
        )

    # Démarrer les threads
    backend_thread = threading.Thread(target=run_backend, daemon=True)
    training_thread = threading.Thread(target=run_training, daemon=True)

    backend_thread.start()
    training_thread.start()

    # Garder le thread principal en vie
    try:
        while True:
            pass
    except KeyboardInterrupt:
        print("\nArrêt des serveurs...")