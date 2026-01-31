import numpy as np
from app.features.github_features import github_features
from app.features.resume_features import resume_features, academic_features
from app.embeddings.code_embedder import code_features_from_repos
from app.data_sources.github_fetcher import fetch_repo_code, fetch_repos


def build_feature_vector(student, github_token=None):
    """Build a feature vector for credit scoring.
    
    Returns a 10-element array normalized to 0-1 range for each feature.
    """
    username = student["github_username"]

    # GitHub activity features (x1, x2, x5)
    try:
        x1, x2, x5 = github_features(username, github_token)
    except Exception:
        # Default to moderate values if GitHub fetch fails
        x1, x2, x5 = 0.4, 0.4, 0.4

    # Code quality features from repositories (x3, x4)
    try:
        repos = fetch_repos(username)
        repo_codes = []

        for repo in repos[:3]:  # limit to top 3 repos
            code = fetch_repo_code(username, repo["name"])
            if code:
                repo_codes.append(code)

        if repo_codes:
            x3, x4 = code_features_from_repos(repo_codes)
        else:
            x3, x4 = 0.5, 0.5  # Neutral defaults
    except Exception:
        x3, x4 = 0.5, 0.5  # Neutral defaults

    # Resume features (x6, x7, x8)
    x6, x7, x8 = resume_features(student["resume_text"])
    
    # Academic features (x9, x10)
    x9, x10 = academic_features(
        student["gpa"],
        student["internships"]
    )

    return np.array([
        x1, x2, x3, x4, x5,
        x6, x7, x8, x9, x10
    ])
