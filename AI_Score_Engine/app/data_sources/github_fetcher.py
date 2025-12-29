import requests
from app.config import GITHUB_TOKEN

def _headers(token=None):
    t = token or GITHUB_TOKEN
    return {"Authorization": f"token {t}"} if t else {}

def fetch_repos(username, token=None):
    url = f"https://api.github.com/users/{username}/repos"
    r = requests.get(url, headers=_headers(token), timeout=15)
    if r.status_code != 200:
        return []
    return r.json()

def fetch_repo_code(username, repo_name, token=None):
    url = f"https://api.github.com/repos/{username}/{repo_name}/contents"
    r = requests.get(url, headers=_headers(token), timeout=15)
    if r.status_code != 200:
        return ""

    files = r.json()
    code_text = ""

    for f in files:
        if not isinstance(f, dict):
            continue
        name = f.get("name", "")
        if not name.endswith((".py", ".js", ".java")):
            continue

        raw_url = f.get("download_url")
        if not raw_url:
            continue

        try:
            code_text += requests.get(raw_url, headers=_headers(token), timeout=15).text + "\n"
        except Exception:
            continue

    return code_text