# backend/main.py
# Point d'entrée de l'API FastAPI
# Lancement : cd backend && uvicorn main:app --reload --port 8000

from pathlib import Path
from dotenv import load_dotenv

# Charge le .env situé à la racine du projet (un niveau au-dessus de backend/)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.database import init_db
from api import dashboard, donnees, admin, maintenance, chatbot, auth, predictions, tools, agents
from api.chatbot import init_chatbot

app = FastAPI(
    title="AI Maintenance API",
    description="API de maintenance prédictive — Atlas Industries Maroc",
    version="1.0.0",
)

# CORS — dev : toutes origines + Private Network Access (Chrome → 127.0.0.1:8000).
# Pas de cookies sur les fetch du front (session en localStorage) → allow_credentials=False + « * » est valide.
# En production : liste d’origines explicites + allow_credentials si besoin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_private_network=True,
)

# Initialisation BD au démarrage
@app.on_event("startup")
def startup_event():
    init_db()
    init_chatbot()

# Routes
app.include_router(dashboard.router,    prefix="/api/dashboard",    tags=["Dashboard"])
app.include_router(donnees.router,      prefix="/api/donnees",      tags=["Données"])
app.include_router(admin.router,        prefix="/api/admin",        tags=["Admin"])
app.include_router(maintenance.router,  prefix="/api/maintenance",  tags=["Maintenance"])
app.include_router(chatbot.router,      prefix="/api/chatbot",      tags=["Chatbot RAG"])
app.include_router(auth.router,         prefix="/api/auth",         tags=["Authentification"])
app.include_router(predictions.router,  prefix="/api/predictions",  tags=["Predictions"])
app.include_router(tools.router,        prefix="/api/tools",        tags=["Tools"])
app.include_router(agents.router,       prefix="/api/agents",       tags=["Agents"])


@app.get("/")
def root():
    return {"message": "AI Maintenance API — en ligne", "version": "1.0.0"}

