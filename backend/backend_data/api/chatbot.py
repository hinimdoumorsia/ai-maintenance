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

router = APIRouter()

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


def _build_prompt(message: str, history: list[ChatTurn], chunks: list[dict[str, Any]]) -> tuple[str, str]:
    has_context = len(chunks) > 0
    system_prompt = (
        "Tu es un assistant expert en maintenance industrielle, analyse vibratoire "
        "et interpretation des normes ISO (10816/20816/18436/13374). "
        "Regles obligatoires:\n"
        "1) Priorite absolue au contexte documentaire fourni.\n"
        "2) Si le contexte est insuffisant, tu peux repondre avec des connaissances generales "
        "techniques, MAIS tu dois marquer explicitement la reponse comme NON VERIFIEE localement "
        "et recommander une verification documentaire complementaire.\n"
        "3) Pour chaque affirmation technique importante, ajoute une citation inline "
        "au format [Source: <Document> | p.<page> | <section>] quand une source locale existe.\n"
        "4) Ne fabrique jamais de valeurs seuils, classes machine, frequences de defaut "
        "ou procedures sans indiquer clairement le niveau de confiance.\n"
        "5) Reponds dans la langue de la question.\n"
        "6) Si la question touche aux zones/seuils ISO, structure la reponse en: "
        "Contexte, Interprétation, Action recommandée."
    )
    context_parts = []
    for i, ch in enumerate(chunks, start=1):
        meta = ch["meta"]
        context_parts.append(
            f"[chunk {i}]\n"
            f"source_doc: {meta.get('doc_title','?')}\n"
            f"page: {meta.get('page_number','?')}\n"
            f"section: {meta.get('heading_context','?')}\n"
            f"relevance_score: {round(ch.get('score', 0.0), 3)}\n"
            f"content:\n{ch['text']}"
        )
    trimmed_history = history[-6:]
    hist_txt = "\n".join(f"{t.role}: {t.content}" for t in trimmed_history)
    user_prompt = (
        ("Contexte documentaire:\n\n" + "\n\n".join(context_parts) if has_context else "Contexte documentaire: (aucun contexte pertinent retrouve)\n")
        + "\n\nHistorique de conversation:\n"
        + (hist_txt or "(vide)")
        + f"\n\nQuestion: {message}\n\n"
        "Instruction de reponse: donne une reponse utile et concise. "
        "Si la reponse n'est pas confirmee par la doc locale, ajoute en tete "
        "'⚠️ Reponse non verifiee localement' et termine par des pistes de verification. "
        "Ajoute ensuite une section 'Sources utilisees' (ou 'Sources locales indisponibles')."
    )
    return system_prompt, user_prompt


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


@router.post("/chat")
async def chat(req: ChatRequest):
    _ensure_ready()
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message vide.")

    chunks, theme_detected = _build_retrieval(req.message, req.filters.theme)
    sources = _sources_from_chunks(chunks)

    if _anthropic is None:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY manquant.")

    system_prompt, user_prompt = _build_prompt(req.message, req.conversation_history, chunks)

    if not req.stream:
        msg = _anthropic.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        answer = "".join(block.text for block in msg.content if getattr(block, "type", "") == "text")
        return JSONResponse({"answer": answer, "sources": sources, "theme_detected": theme_detected})

    async def event_stream():
        with _anthropic.messages.stream(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {json.dumps({'type': 'token', 'token': text})}\n\n"

        yield f"data: {json.dumps({'type': 'done', 'sources': sources, 'theme_detected': theme_detected})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
