import requests

from app.data_sources.github_fetcher import fetch_repos, _headers


def github_features(username, token=None):
    """Compute GitHub activity features for a user.

    This implementation is defensive: if GitHub returns an error or an
    unexpected payload, we fall back to zeroed features instead of
    crashing the pipeline.
    """

    repos = fetch_repos(username, token)
    headers = _headers(token)

    total_commits = 0
    active_months = set()
    languages = set()

    for repo in repos:
        if not isinstance(repo, dict):
            continue

        if repo.get("fork"):
            continue

        language = repo.get("language")
        if language:
            languages.add(str(language).lower())

        commits_url = repo.get("commits_url")
        if not commits_url:
            continue

        commits_url = commits_url.replace("{/sha}", "")

        try:
            resp = requests.get(commits_url, headers=headers, timeout=15)
        except Exception:
            continue

        if resp.status_code != 200:
            continue

        try:
            commits = resp.json()
        except Exception:
            continue

        if not isinstance(commits, list):
            continue

        for c in commits[:30]:  # cap to avoid abuse
            if not isinstance(c, dict):
                continue

            commit_info = c.get("commit", {}).get("author", {})
            date = commit_info.get("date")
            if not date:
                continue

            month = date[:7]
            active_months.add(month)
            total_commits += 1

    commits_per_month = total_commits / max(len(active_months), 1)

    x1 = min(commits_per_month / 30, 1.0)   # commit frequency
    x2 = min(len(active_months) / 12, 1.0)  # consistency
    x5 = min(len(languages) / 5, 1.0)       # diversity

    return x1, x2, x5
