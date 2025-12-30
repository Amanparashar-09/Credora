"""App package initialization.

Loads environment variables from a .env file as soon as the
`app` package is imported, so libraries like `openai` can
pick up `OPENAI_API_KEY` and other secrets from the process
environment without hardcoding them in code.
"""

from dotenv import load_dotenv

# Load variables from .env into process environment early
load_dotenv()
