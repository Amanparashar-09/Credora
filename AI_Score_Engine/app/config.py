import os
from dotenv import load_dotenv

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

MARKET_SKILLS = {
    "python", "ml", "machine learning",
    "backend", "cloud", "sql", "devops"
}
