from __future__ import annotations

import json
import os
import re
from typing import Any

import chromadb
from anthropic import Anthropic
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer

from services import chatbot_tools

router = APIRouter()

_MODEL = "claude-sonnet-4-6"
_MAX_TOOL_ITERS = 6

# Fiche de connaissance de l'application (autorité : description fonctionnelle, fiable).
APP_OVERVIEW = (
    "APPLICATION : « AI Maintenance » — plateforme web de maintenance prédictive industrielle "
    "(analyse vibratoire des machines tournantes, monitoring IoT, prédiction IA).\n"
    "PAGES PRINCIPALES :\n"
    "- Dashboard : KPIs temps réel (disponibilité, économies, machines en alerte, taux de détection), "
    "fleur des 9 piliers, machines à risque, alertes, graphes FFT/V-RMS.\n"
    "- Données : upload de datasets (CSV/XLSX/TXT/ARFF/ZIP) puis EDA automatique (score qualité, "
    "outliers IQR, scaling adaptatif, graphiques, rapport PDF, narration IA). Sous-pages : Vue Générale, "
    "Analyse Vibratoire (ISO 10816/20816, défauts roulements BPFO/BPFI/BSF), Pronostic & DRBF, KPIs, "
    "Parc Machines, Capteurs IoT, Classification VIS.\n"
    "- Paramètres : profil utilisateur, infos entreprise, CRUD du parc machines + capteurs.\n"
    "- Autres pages : Prédictions, Entraînement (ML), Modèles, Agents, Outils, Maintenance.\n"
    "NORMES : ISO 10816, 20816, 18436, 13306 ; zones vibratoires A (bon) à D (danger).\n"
    "DONNÉES : stockées en base SQLite (machines, capteurs, mesures, alertes, KPIs journaliers, "
    "pronostics DRBF, défauts, bons de travail, pièces, datasets). Tu peux les consulter via les outils."
)

SYSTEM_PROMPT = (
    "Tu es l'« Assistant Maintenance » intégré à l'application AI Maintenance. Tu réponds aux questions "
    "techniques (maintenance, analyse vibratoire, normes ISO) ET aux questions sur les données réelles de "
    "l'application et de l'entreprise de l'utilisateur.\n\n"
    "OUTILS DISPONIBLES :\n"
    "- search_documentation : recherche dans la documentation technique locale (normes ISO 10816/20816/"
    "18436, manuels d'analyse vibratoire). À utiliser pour les questions normatives/techniques.\n"
    "- get_company_profile, get_dashboard_kpis, get_kpi_indicators, list_machines, list_active_alerts, "
    "list_sensors, list_datasets : données LIVE de la base de l'application (entreprise, parc, alertes, "
    "capteurs, KPIs, datasets uploadés).\n"
    "- query_table : lecture seule d'une table précise de la base pour des questions pointues.\n\n"
    "RÈGLES :\n"
    "1) Si la question porte sur les données de l'application/entreprise (machines, capteurs, mesures, "
    "alertes, KPIs, datasets, maintenance…), APPELLE D'ABORD les outils de base de données. Ces données "
    "sont LOCALES et FIABLES.\n"
    "1bis) Pour TOUT indicateur de performance de l'entreprise — TRS/OEE, disponibilité, MTBF, MTTR, ROI… "
    "— utilise get_kpi_indicators (ou get_dashboard_kpis). Ces valeurs sont celles AFFICHÉES sur le "
    "tableau de bord. Ne calcule JAMAIS ces indicateurs à partir d'un dataset uploadé.\n"
    "2) Pour les questions normatives/techniques (seuils ISO, fréquences de défaut…), appelle "
    "search_documentation.\n"
    "3) Tu peux décrire l'application elle-même à partir de la FICHE ci-dessous : c'est fiable.\n"
    "4) N'ajoute le bandeau « ⚠️ Réponse non vérifiée localement » QUE si ta réponse repose sur des "
    "connaissances générales SANS aucun appui d'un outil (ni base de données ni documentation). Si un "
    "outil a fourni l'information, n'ajoute PAS ce bandeau.\n"
    "5) Ne fabrique jamais de valeurs (seuils, fréquences, chiffres). Si l'info n'est ni en base ni dans "
    "la doc, dis-le clairement.\n"
    "6) Réponds dans la langue de la question, de façon concise et structurée. Quand tu utilises "
    "search_documentation, cite les sources inline au format [Source: <doc> | p.<page>].\n"
    "7) FORMAT DE RÉPONSE : n'utilise JAMAIS de tableaux Markdown (pas de « | » ni de séparateurs de "
    "colonnes). Présente les données sous forme de listes à puces avec le libellé en gras "
    "(ex. « - **Code** : POMPE-CENT »). N'utilise AUCUN emoji ni pictogramme. Reste sobre et factuel.\n\n"
    "FICHE APPLICATION :\n" + APP_OVERVIEW
)

# Etat global charge au demarrage (init une seule fois)
_rag_ready = False
_collection = None
_embedder: SentenceTransformer | None = None
_anthropic: Anthropic | None = None
_collection_name = "maintenance_docs"
_chroma_path = "./chroma_db"
_embedding_model_name = "paraphrase-multilingual-MiniLM-L12-v2"

ISO_KEYWORDS = {
    "iso", "10816", "20816", "18436", "13374", "norme", "zone", "classe",
    "vrms", "v_rms", "kurtosis", "crest", "bpfo", "bpfi", "bsf", "ftf",
}


class ChatTurn(BaseModel):
    role: str
    content: str


class ChatFilters(BaseModel):
    theme: str | None = None


class ChatRequest(BaseModel):
    message: str
    conversation_history: list[ChatTurn] = Field(default_factory=list)
    filters: ChatFilters = Field(default_factory=ChatFilters)
    stream: bool = True
    user_id: int | None = None


def init_chatbot() -> None:
    global _rag_ready, _collection, _embedder, _anthropic
    global _collection_name, _chroma_path, _embedding_model_name

    _collection_name = os.getenv("CHROMA_COLLECTION", "maintenance_docs")
    _chroma_path = os.getenv("CHROMA_DB_PATH", "./chroma_db")
    _embedding_model_name = os.getenv("EMBEDDING_MODEL", "paraphrase-multilingual-MiniLM-L12-v2")

    client = chromadb.PersistentClient(path=_chroma_path)
    _collection = client.get_or_create_collection(name=_collection_name, metadata={"hnsw:space": "cosine"})
    _embedder = SentenceTransformer(_embedding_model_name, device="cpu")

    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if api_key:
        _anthropic = Anthropic(api_key=api_key)
    else:
        _anthropic = None

    _rag_ready = True


def _ensure_ready() -> None:
    if not _rag_ready or _collection is None or _embedder is None:
        raise HTTPException(status_code=503, detail="RAG non initialise. Redemarrez le backend.")


def _build_retrieval(message: str, theme_filter: str | None = None) -> tuple[list[dict[str, Any]], str]:
    assert _embedder is not None
    assert _collection is not None

    q_vec = _embedder.encode([message], normalize_embeddings=True).tolist()[0]
    kwargs: dict[str, Any] = {
        "query_embeddings": [q_vec],
        "n_results": 12,
        "include": ["documents", "metadatas", "distances"],
    }
    if theme_filter:
        kwargs["where"] = {"theme": theme_filter}

    res = _collection.query(**kwargs)
    docs = (res.get("documents") or [[]])[0]
    metas = (res.get("metadatas") or [[]])[0]
    dists = (res.get("distances") or [[]])[0]

    picked: list[dict[str, Any]] = []
    q_terms = set(re.findall(r"[a-zA-Z0-9_]{3,}", message.lower()))
    iso_mode = any(k in message.lower() for k in ISO_KEYWORDS)

    for d, m, dist in zip(docs, metas, dists):
        sim = max(0.0, 1.0 - float(dist))
        if sim < 0.4:
            continue
        text_l = (d or "").lower()
        overlap = len(q_terms.intersection(set(re.findall(r"[a-zA-Z0-9_]{3,}", text_l))))
        overlap_score = min(0.25, overlap * 0.02)
        iso_boost = 0.08 if iso_mode and any(k in text_l for k in ISO_KEYWORDS) else 0.0
        final_score = sim + overlap_score + iso_boost
        picked.append(
            {
                "text": d,
                "meta": m or {},
                "score": final_score,
                "semantic_score": sim,
                "lexical_overlap": overlap,
            }
        )

    # Re-ranking local (hybride sémantique + lexical + boost ISO)
    picked.sort(key=lambda x: x["score"], reverse=True)
    picked = picked[:5]

    theme_detected = picked[0]["meta"].get("theme", "unknown") if picked else "unknown"
    return picked, theme_detected


def _doc_chunks_to_tool_result(chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Transforme les chunks RAG en payload léger renvoyé au LLM comme résultat d'outil."""
    out = []
    for i, ch in enumerate(chunks, start=1):
        meta = ch["meta"]
        out.append({
            "chunk": i,
            "source_doc": meta.get("doc_title", "?"),
            "page": meta.get("page_number", "?"),
            "section": meta.get("heading_context", "?"),
            "relevance": round(ch.get("score", 0.0), 3),
            "content": ch["text"],
        })
    return out


def _sources_from_chunks(chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    sources = []
    for ch in chunks:
        m = ch["meta"]
        excerpt = ch["text"][:150].strip().replace("\n", " ")
        sources.append(
            {
                "doc_id": m.get("doc_id"),
                "doc_title": m.get("doc_title"),
                "source_pdf": m.get("source_pdf"),
                "page_number": m.get("page_number"),
                "heading_context": m.get("heading_context"),
                "excerpt": excerpt + ("..." if len(ch["text"]) > 150 else ""),
            }
        )
    # dedupe rapide
    uniq = []
    seen = set()
    for s in sources:
        key = (s.get("doc_id"), s.get("page_number"), s.get("heading_context"))
        if key in seen:
            continue
        seen.add(key)
        uniq.append(s)
    return uniq[:5]


@router.get("/health")
def chatbot_health():
    if not _rag_ready or _collection is None or _embedder is None:
        return {"status": "initializing"}
    return {
        "status": "ok",
        "chunks_count": _collection.count(),
        "embedding_model": _embedding_model_name,
        "anthropic_ready": _anthropic is not None,
        "chroma_path": _chroma_path,
    }


@router.get("/themes")
def chatbot_themes():
    _ensure_ready()
    data = _collection.get(include=["metadatas"])
    themes = sorted(
        {
            m.get("theme")
            for m in (data.get("metadatas") or [])
            if isinstance(m, dict) and m.get("theme")
        }
    )
    return {"themes": themes}


def _all_tools() -> list[dict]:
    """Outil de recherche documentaire + outils base de données."""
    search_tool = {
        "name": "search_documentation",
        "description": (
            "Recherche sémantique dans la documentation technique locale indexée "
            "(normes ISO 10816/20816/18436, manuels d'analyse vibratoire, fréquences de défaut). "
            "À utiliser pour toute question normative ou technique."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Requête de recherche documentaire."},
                "theme": {"type": "string", "description": "Filtre thématique optionnel."},
            },
            "required": ["query"],
        },
    }
    return [search_tool] + chatbot_tools.TOOL_DEFINITIONS_DB


def _exec_tool(name: str, tool_input: dict, user_id: int | None, default_theme: str | None):
    """Exécute un outil. Renvoie (résultat_json, chunks_doc) — chunks pour alimenter les sources UI."""
    if name == "search_documentation":
        query = tool_input.get("query") or ""
        theme = tool_input.get("theme") or default_theme
        chunks, _ = _build_retrieval(query, theme)
        return _doc_chunks_to_tool_result(chunks), chunks
    return chatbot_tools.dispatch_db_tool(name, tool_input, user_id), []


def _initial_messages(req: ChatRequest) -> list[dict]:
    """Reconstruit l'historique en messages Anthropic, garantit un premier message 'user'."""
    msgs: list[dict] = []
    for t in req.conversation_history[-6:]:
        role = "assistant" if t.role == "assistant" else "user"
        if not msgs and role != "user":
            continue  # Anthropic exige que le 1er message soit 'user'
        if (t.content or "").strip():
            msgs.append({"role": role, "content": t.content})
    msgs.append({"role": "user", "content": req.message})
    return msgs


def _run_agentic_loop(req: ChatRequest):
    """Boucle tool-use (non-streaming en interne). Renvoie (texte_final, sources)."""
    tools = _all_tools()
    messages = _initial_messages(req)
    doc_chunks: list[dict[str, Any]] = []
    final_text = ""

    for _ in range(_MAX_TOOL_ITERS):
        resp = _anthropic.messages.create(
            model=_MODEL,
            max_tokens=1500,
            system=SYSTEM_PROMPT,
            tools=tools,
            messages=messages,
        )
        if resp.stop_reason == "tool_use":
            messages.append({"role": "assistant", "content": resp.content})
            tool_results = []
            for block in resp.content:
                if getattr(block, "type", "") == "tool_use":
                    result, chunks = _exec_tool(block.name, block.input or {}, req.user_id, req.filters.theme)
                    doc_chunks.extend(chunks)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(result, ensure_ascii=False, default=str),
                    })
            messages.append({"role": "user", "content": tool_results})
            continue

        final_text = "".join(b.text for b in resp.content if getattr(b, "type", "") == "text")
        break
    else:
        final_text = (final_text or "").strip() or (
            "Je n'ai pas pu finaliser la réponse (trop d'étapes d'outils). Reformulez la question."
        )

    return final_text, _sources_from_chunks(doc_chunks)


@router.post("/chat")
async def chat(req: ChatRequest):
    _ensure_ready()
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message vide.")
    if _anthropic is None:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY manquant.")

    answer, sources = _run_agentic_loop(req)

    if not req.stream:
        return JSONResponse({"answer": answer, "sources": sources})

    async def event_stream():
        # Découpe la réponse finale en petits morceaux pour conserver l'effet « machine à écrire ».
        chunk_size = 24
        for i in range(0, len(answer), chunk_size):
            yield f"data: {json.dumps({'type': 'token', 'token': answer[i:i + chunk_size]})}\n\n"
        yield f"data: {json.dumps({'type': 'done', 'sources': sources})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
