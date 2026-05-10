"""
Point d'entrée unique — maintenance (backend_data) + training sur le port 8000.

Lancement depuis ce dossier :
    python -m uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import importlib.util
import sys
import traceback
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent


def _load_app_module(module_name: str, file_path: Path, sys_path_head: Path):
    """Charge un fichier main.py avec un sys.path dédié (évite le conflit api/ agent/)."""
    old_path = sys.path.copy()
    sys.path.insert(0, str(sys_path_head))
    try:
        spec = importlib.util.spec_from_file_location(module_name, file_path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Impossible de charger {file_path}")
        mod = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = mod
        spec.loader.exec_module(mod)
        return mod
    finally:
        sys.path[:] = old_path


_maint = _load_app_module(
    "_ai_maintenance_backend_data",
    BACKEND_ROOT / "backend_data" / "main.py",
    BACKEND_ROOT / "backend_data",
)
_train = _load_app_module(
    "_ai_maintenance_training_api",
    BACKEND_ROOT / "training" / "api" / "main.py",
    BACKEND_ROOT / "training",
)

_maint_app = _maint.app
_train_app = _train.app


def _is_training_path(path: str) -> bool:
    """Routes exposées par training/api (voir src/services/api.ts)."""
    p = path.rstrip("/") or "/"
    if p in ("/health", "/upload", "/jobs"):
        return True
    if path.startswith("/logs/") or path.startswith("/results/"):
        return True
    return False


def _maintenance_startup() -> None:
    sys.path.insert(0, str(BACKEND_ROOT / "backend_data"))
    try:
        from db.database import init_db
        from api.chatbot import init_chatbot

        init_db()
        init_chatbot()
    finally:
        try:
            sys.path.remove(str(BACKEND_ROOT / "backend_data"))
        except ValueError:
            pass


class CombinedASGI:
    """Délègue vers l'API training ou maintenance ; exécute le startup BD/RAG une fois."""

    __slots__ = ("_maint", "_train")

    def __init__(self, maint, train):
        self._maint = maint
        self._train = train

    async def __call__(self, scope, receive, send):
        stype = scope["type"]
        if stype == "lifespan":
            await self._lifespan(receive, send)
            return
        if stype in ("http", "websocket"):
            path = scope.get("path") or ""
            if _is_training_path(path):
                await self._train(scope, receive, send)
            else:
                await self._maint(scope, receive, send)
            return
        await self._maint(scope, receive, send)

    async def _lifespan(self, receive, send):
        message = await receive()
        if message["type"] != "lifespan.startup":
            return
        try:
            _maintenance_startup()
        except BaseException:
            await send(
                {
                    "type": "lifespan.startup.failed",
                    "message": traceback.format_exc(),
                }
            )
            raise
        await send({"type": "lifespan.startup.complete"})
        message = await receive()
        if message["type"] != "lifespan.shutdown":
            return
        await send({"type": "lifespan.shutdown.complete"})


app = CombinedASGI(_maint_app, _train_app)
