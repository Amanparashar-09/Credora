import numpy as np
from app.embeddings.text_embedder import embed_text


MARKET_SKILLS = {
    "python", "machine learning", "ml", "backend",
    "cloud", "sql", "devops", "blockchain",
}


def resume_features(resume_text: str):
    """Compute resume-based features from embedded text and keywords."""

    emb = embed_text(resume_text)

    tokens = [w.strip(".,;:()[]{}").lower() for w in resume_text.split()]
    words = set(filter(None, tokens))
    market_hits = words.intersection(MARKET_SKILLS)

    x6 = float(np.mean(emb))           # semantic depth
    x7 = float(np.std(emb))            # diversity
    x8 = len(market_hits) / max(len(words), 1)

    return x6, x7, x8


def academic_features(gpa, internships):
    x9 = gpa / 10
    x10 = min(internships / 3, 1.0)
    return x9, x10
