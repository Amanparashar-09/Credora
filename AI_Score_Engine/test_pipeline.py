from app.data_sources.resume_parser import extract_text_from_pdf_path
from app.features.feature_builder import build_feature_vector
from app.Scoring.credit_scorer import calculate_credit_score

# -----------------------------
# STEP 1: INPUT DATA
# -----------------------------

STUDENT = {
    "github_username": "Amanparashar-09",   # use a public GitHub profile for test
    "gpa": 7.68,
    "internships": 1
}

RESUME_PATH = "Sample_resume.pdf"   # put any PDF resume here

# -----------------------------
# STEP 2: RESUME PARSING
# -----------------------------

print("\n[1] Parsing resume...")
resume_text = extract_text_from_pdf_path(RESUME_PATH)

print("Resume text length:", len(resume_text))
print("Resume preview:", resume_text[:200], "...")

STUDENT["resume_text"] = resume_text

# -----------------------------
# STEP 3: FEATURE ENGINEERING
# -----------------------------

print("\n[2] Building feature vector...")
X = build_feature_vector(STUDENT)

print("Feature vector shape:", X.shape)
print("Feature vector values:\n", X)

# -----------------------------
# STEP 4: CREDIT SCORING
# -----------------------------

print("\n[3] Calculating Credora score...")
score = calculate_credit_score(X)

print("\n✅ FINAL RESULT")
print("Credora Score:", score)

if score >= 80:
    limit = 50000
elif score >= 65:
    limit = 30000
elif score >= 50:
    limit = 15000
else:
    limit = 0

print("Credit Limit:", limit)
