from fastapi import FastAPI
from app.features.feature_builder import build_feature_vector
from app.Scoring.credit_scorer import calculate_credit_score

app = FastAPI()

@app.post("/score")
def score_student(student: dict):
    X = build_feature_vector(student)
    score = calculate_credit_score(X)
    return {
        "credora_score": score,
        "credit_limit": (
            50000 if score >= 80 else
            30000 if score >= 65 else
            15000 if score >= 50 else 0
        )
    }
