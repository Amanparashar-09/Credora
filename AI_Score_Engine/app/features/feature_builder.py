import numpy as np
from app.features.github_features import github_features
from app.features.resume_features import resume_features, academic_features
from app.embeddings.code_embedder import code_features_from_repos
from app.data_sources.github_fetcher import fetch_repo_code, fetch_repos


def build_feature_vector(student, github_token=None):
    username = student["github_username"]

    x1, x2, x5 = github_features(username, github_token)

    repos = fetch_repos(username)
    repo_codes = []

    for repo in repos[:3]:  # limit to top repos
        code = fetch_repo_code(username, repo["name"])
        if code:
            repo_codes.append(code)

    if repo_codes:
        x3, x4 = code_features_from_repos(repo_codes)
    else:
        x3, x4 = 0.0, 0.0

    x6, x7, x8 = resume_features(student["resume_text"])
    x9, x10 = academic_features(
        student["gpa"],
        student["internships"]
    )

    return np.array([
        x1, x2, x3, x4, x5,
        x6, x7, x8, x9, x10
    ])
