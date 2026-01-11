import requests

AI_URL = "http://127.0.0.1:8000/score"

# Use context manager to ensure file is properly closed
with open("Sample_resume.pdf", "rb") as resume_file:
    files = {
        "resume": ("Sample_resume.pdf", resume_file, "application/pdf")
    }
    
    data = {
        "github_username": "Amanparashar-09",
        "gpa": 7.68,
        "internships": 3
    }
    
    r = requests.post(AI_URL, files=files, data=data)

print(f"Status Code: {r.status_code}")
print(f"Response: {r.json()}")
