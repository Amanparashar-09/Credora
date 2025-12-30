from sentence_transformers import SentenceTransformer
import torch
import numpy as np

_device = "cuda" if torch.cuda.is_available() else "cpu"
_model = SentenceTransformer("all-MiniLM-L6-v2", device=_device)


def embed_text(text: str) -> np.ndarray:
    """Convert resume / skills text into a dense vector."""

    return _model.encode(text)
