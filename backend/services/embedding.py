import os

# Prevent unnecessary network pings when running local sentence-transformers
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

from sentence_transformers import SentenceTransformer


MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

try:
    model = SentenceTransformer(MODEL_NAME, local_files_only=True)
except Exception:
    model = SentenceTransformer(MODEL_NAME)



def generate_embedding(text: str) -> list[float]:
    embedding = model.encode(
        text,
        normalize_embeddings=True,
    )
    return embedding.tolist()


def generate_embeddings_batch(texts: list[str], batch_size: int = 32) -> list[list[float]]:
    if not texts:
        return []
    embeddings = model.encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=False,
        normalize_embeddings=True,
    )
    return embeddings.tolist()