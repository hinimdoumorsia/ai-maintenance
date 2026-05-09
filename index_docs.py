#!/usr/bin/env python3
"""
index_docs.py - Indexation RAG locale des JSON docs vers ChromaDB.

Usage:
    python index_docs.py

Prerequis:
    pip install chromadb sentence-transformers tqdm

Ce script lit les documents extraits (public/docs/data/*.json), cree des chunks
avec overlap, calcule les embeddings multilingues FR/EN puis indexe dans une
collection Chroma persistante.
"""
from __future__ import annotations

import json
import os
import re
import uuid
from pathlib import Path
from typing import Any

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

ROOT = Path(__file__).resolve().parent
DOCS_DIR = ROOT / "public" / "docs" / "data"
CHROMA_DB_PATH = Path(os.getenv("CHROMA_DB_PATH", str(ROOT / "chroma_db")))
COLLECTION_NAME = "maintenance_docs"
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "paraphrase-multilingual-MiniLM-L12-v2")

MAX_TOKENS = 500
OVERLAP_TOKENS = 50


def approx_token_count(text: str) -> int:
    # Approximation robuste sans tokenizer externe: mots + ponctuation.
    return len(re.findall(r"\w+|[^\w\s]", text, flags=re.UNICODE))


def window_with_overlap(text: str, max_tokens: int, overlap_tokens: int) -> list[str]:
    tokens = re.findall(r"\S+", text)
    if len(tokens) <= max_tokens:
        return [text]
    chunks: list[str] = []
    start = 0
    step = max(1, max_tokens - overlap_tokens)
    while start < len(tokens):
        end = min(len(tokens), start + max_tokens)
        chunk = " ".join(tokens[start:end]).strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(tokens):
            break
        start += step
    return chunks


def table_to_text(headers: list[str], rows: list[list[str]]) -> str:
    header_line = "headers: " + " | ".join(headers)
    row_lines = []
    for i, row in enumerate(rows[:80], start=1):
        row_lines.append(f"row{i}: " + " | ".join(row))
    return header_line + "\n" + "\n".join(row_lines)


def create_chunks_for_doc(doc: dict[str, Any]) -> list[dict[str, Any]]:
    chunks: list[dict[str, Any]] = []
    current_heading = "Sans titre"
    buffer_text = ""
    buffer_page = 1

    def flush_buffer() -> None:
        nonlocal buffer_text, buffer_page
        text = buffer_text.strip()
        if not text:
            return
        for part in window_with_overlap(text, MAX_TOKENS, OVERLAP_TOKENS):
            chunks.append(
                {
                    "chunk_id": str(uuid.uuid4()),
                    "doc_id": doc["id"],
                    "doc_title": doc["title"],
                    "source_pdf": doc["source"],
                    "theme": doc.get("theme", "general"),
                    "page_number": buffer_page,
                    "heading_context": current_heading,
                    "text": part,
                }
            )
        buffer_text = ""

    pages = doc.get("pages", [])
    for page in pages:
        page_no = page.get("pageNumber", 1)
        blocks = page.get("blocks", [])
        for idx, block in enumerate(blocks):
            btype = block.get("type")
            if btype == "heading":
                flush_buffer()
                current_heading = block.get("text", current_heading) or current_heading
                buffer_text = current_heading + "\n"
                buffer_page = page_no
            elif btype == "text":
                txt = (block.get("text") or "").strip()
                if txt:
                    if not buffer_text:
                        buffer_page = page_no
                    buffer_text += txt + "\n"
                if approx_token_count(buffer_text) >= MAX_TOKENS:
                    flush_buffer()
            elif btype == "image":
                # Chunk image: caption + contexte avant/apres.
                caption = (block.get("caption") or "Figure").strip()
                prev_text = ""
                next_text = ""
                if idx > 0 and blocks[idx - 1].get("type") == "text":
                    prev_text = (blocks[idx - 1].get("text") or "").strip()[:300]
                if idx + 1 < len(blocks) and blocks[idx + 1].get("type") == "text":
                    next_text = (blocks[idx + 1].get("text") or "").strip()[:300]
                image_chunk = (
                    f"Image/Caption: {caption}\n"
                    f"Contexte avant: {prev_text}\n"
                    f"Contexte apres: {next_text}"
                ).strip()
                chunks.append(
                    {
                        "chunk_id": str(uuid.uuid4()),
                        "doc_id": doc["id"],
                        "doc_title": doc["title"],
                        "source_pdf": doc["source"],
                        "theme": doc.get("theme", "general"),
                        "page_number": page_no,
                        "heading_context": current_heading,
                        "text": image_chunk,
                    }
                )
            elif btype == "table":
                headers = block.get("headers") or []
                rows = block.get("rows") or []
                if headers and rows:
                    table_text = table_to_text(headers, rows)
                    for part in window_with_overlap(table_text, MAX_TOKENS, OVERLAP_TOKENS):
                        chunks.append(
                            {
                                "chunk_id": str(uuid.uuid4()),
                                "doc_id": doc["id"],
                                "doc_title": doc["title"],
                                "source_pdf": doc["source"],
                                "theme": doc.get("theme", "general"),
                                "page_number": page_no,
                                "heading_context": current_heading,
                                "text": part,
                            }
                        )
        flush_buffer()

    return chunks


def load_docs() -> list[dict[str, Any]]:
    if not DOCS_DIR.exists():
        raise FileNotFoundError(f"Dossier docs introuvable: {DOCS_DIR}")
    docs: list[dict[str, Any]] = []
    for path in sorted(DOCS_DIR.glob("*.json")):
        if path.name == "index.json":
            continue
        with open(path, "r", encoding="utf-8") as f:
            docs.append(json.load(f))
    return docs


def get_existing_doc_ids(collection) -> set[str]:
    try:
        data = collection.get(include=["metadatas"])
        metadatas = data.get("metadatas", [])
        ids = {m.get("doc_id") for m in metadatas if isinstance(m, dict) and m.get("doc_id")}
        return ids
    except Exception:
        return set()


def main() -> None:
    print(f"[index] docs dir: {DOCS_DIR}")
    docs = load_docs()
    if not docs:
        print("[index] aucun document a indexer")
        return

    CHROMA_DB_PATH.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(CHROMA_DB_PATH), settings=Settings(anonymized_telemetry=False))
    collection = client.get_or_create_collection(name=COLLECTION_NAME, metadata={"hnsw:space": "cosine"})

    existing_doc_ids = get_existing_doc_ids(collection)
    docs_to_process = [d for d in docs if d.get("id") not in existing_doc_ids]

    if not docs_to_process:
        print("[index] aucun nouveau document (indexation incrementale)")
        print(f"[index] total chunks en base: {collection.count()}")
        return

    print(f"[index] chargement modele embeddings: {EMBEDDING_MODEL}")
    model = SentenceTransformer(EMBEDDING_MODEL, device="cpu")

    all_chunks: list[dict[str, Any]] = []
    for doc in tqdm(docs_to_process, desc="Chunking docs"):
        all_chunks.extend(create_chunks_for_doc(doc))

    if not all_chunks:
        print("[index] aucun chunk cree")
        return

    texts = [c["text"] for c in all_chunks]
    embeddings = model.encode(texts, show_progress_bar=True, convert_to_numpy=True, normalize_embeddings=True)

    ids = [c["chunk_id"] for c in all_chunks]
    metadatas = [
        {
            "chunk_id": c["chunk_id"],
            "doc_id": c["doc_id"],
            "doc_title": c["doc_title"][:300],
            "source_pdf": c["source_pdf"][:300],
            "theme": c.get("theme", "general"),
            "page_number": int(c.get("page_number", 1)),
            "heading_context": (c.get("heading_context") or "Sans titre")[:400],
        }
        for c in all_chunks
    ]
    documents = texts

    batch_size = 256
    for i in tqdm(range(0, len(ids), batch_size), desc="Upsert Chroma"):
        j = i + batch_size
        collection.upsert(
            ids=ids[i:j],
            embeddings=embeddings[i:j].tolist(),
            metadatas=metadatas[i:j],
            documents=documents[i:j],
        )

    total_docs = len(docs_to_process)
    total_chunks = len(all_chunks)
    print("\n[index] termine")
    print(f"[index] nouveaux documents indexes : {total_docs}")
    print(f"[index] nouveaux chunks ajoutes   : {total_chunks}")
    print(f"[index] taille collection totale  : {collection.count()} chunks")
    print(f"[index] db path                   : {CHROMA_DB_PATH}")


if __name__ == "__main__":
    main()
