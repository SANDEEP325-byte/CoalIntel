import os
from typing import Optional

from fastembed import TextEmbedding

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
# Vercel's filesystem is read-only except /tmp
_CACHE_DIR = "/tmp/fastembed" if os.getenv("VERCEL") else None

_model: Optional[TextEmbedding] = None


def _get_model() -> TextEmbedding:
    global _model
    if _model is None:
        _model = TextEmbedding(MODEL_NAME, cache_dir=_CACHE_DIR)
    return _model


def generate_embedding(text: str) -> list[float]:
    return next(iter(_get_model().embed([text]))).tolist()


def generate_embeddings_batch(texts: list[str], batch_size: int = 32) -> list[list[float]]:
    if not texts:
        return []
    return [v.tolist() for v in _get_model().embed(texts, batch_size=batch_size)]