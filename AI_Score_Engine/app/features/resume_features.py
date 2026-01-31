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

    # Normalize embeddings to 0-1 range
    # Mean of embeddings is typically around 0, normalize to 0.5 baseline
    x6 = min(max((float(np.mean(emb)) + 1.0) / 2.0, 0.0), 1.0)  # semantic depth
    # Std is typically 0.1-0.5, normalize to that range
    x7 = min(float(np.std(emb)) * 2.0, 1.0)                      # diversity
    # Market alignment - scale up (having 5+ skills = 1.0)
    x8 = min(len(market_hits) / 5.0, 1.0)

    return x6, x7, x8


def academic_features(gpa, internships):
    """Normalize GPA and internships to 0-1 scale."""
    x9 = gpa / 10.0              # GPA out of 10
    x10 = min(internships / 2.0, 1.0)  # 2+ internships = 1.0 (was 3)
    return x9, x10
