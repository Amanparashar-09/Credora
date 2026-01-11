import numpy as np


WEIGHTS = np.array([
    0.15,  # commit freq
    0.10,  # consistency
    0.15,  # code quality
    0.10,  # complexity
    0.05,  # language diversity
    0.10,  # resume depth
    0.05,  # resume variation
    0.15,  # market alignment
    0.10,  # GPA
    0.05,  # internships
])


def calculate_credit_score(X: np.ndarray) -> float:
    """Return the Credora score on a 0–100 scale for a feature vector X."""
    return round(float(np.dot(X, WEIGHTS)) * 100)
