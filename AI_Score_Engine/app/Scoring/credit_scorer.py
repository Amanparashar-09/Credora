import sys
from pathlib import Path

import numpy as np

from app.features.feature_builder import build_feature_vector
from app.data_sources.resume_parser import extract_text_from_pdf_path


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


def score_student(student: dict) -> float:
    """Helper that builds the feature vector and returns the score."""

    X = build_feature_vector(student)
    return calculate_credit_score(X)


def score_student_from_pdf(student_base: dict, pdf_path: str) -> float:
    """Score a student using a resume PDF instead of raw text.

    student_base should contain all non-resume fields (github_username,
    gpa, internships, certifications, etc.). The "resume_text" field
    will be filled by extracting text from the given PDF path.
    """

    resume_text = extract_text_from_pdf_path(pdf_path)

    student = dict(student_base)
    student["resume_text"] = resume_text

    return score_student(student)


if __name__ == "__main__":
    # Usage:
    #   python -m app.Scoring.credit_scorer              -> uses built-in text
    #   python -m app.Scoring.credit_scorer resume.pdf   -> parses resume.pdf

    example_student_base = {
        "github_username": "UdayBansalG0423",
        "gpa": 8.7,
        "internships": 1,
        "certifications": 2,
    }

    if len(sys.argv) == 2:
        pdf_path = sys.argv[1]
        if not Path(pdf_path).is_file():
            print(f"PDF not found: {pdf_path}")
            raise SystemExit(1)

        score = score_student_from_pdf(example_student_base, pdf_path)
    else:
        # Fallback: use a hard-coded resume text
        example_student = dict(example_student_base)
        example_student["resume_text"] = (
            "Experienced in Python, Machine Learning, and Cloud Computing. "
            "Completed internships in backend development and DevOps. "
            "Skilled in SQL and Blockchain technologies."
        )
        score = score_student(example_student)

    print("Credora Score:", score)
