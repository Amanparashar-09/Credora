from fastapi import FastAPI, UploadFile, File, Form, HTTPException

from app.data_sources.resume_parser import extract_text_from_pdf_bytes
from app.features.feature_builder import build_feature_vector
from app.Scoring.credit_scorer import calculate_credit_score

app = FastAPI(title="Credora AI Engine")

@app.get("/")
async def root():
    return {"status": "ok", "service": "Credora AI Engine"}

@app.post("/score")
async def score_student(
    github_username: str = Form(...),
    gpa: float = Form(...),
    internships: int = Form(...),
    resume: UploadFile = File(...)
):
    try:
        # Validate PDF file
        if not resume.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are accepted")
        
        pdf_bytes = await resume.read()
        
        if len(pdf_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty PDF file")

        resume_text = extract_text_from_pdf_bytes(pdf_bytes)
        
        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")

        student = {
            "github_username": github_username,
            "resume_text": resume_text,
            "gpa": gpa,
            "internships": internships
        }

        print(f"\n{'='*60}")
        print(f"🔍 CREDIT SCORING REQUEST")
        print(f"{'='*60}")
        print(f"GitHub Username: {github_username}")
        print(f"GPA: {gpa}")
        print(f"Internships: {internships}")
        print(f"Resume Length: {len(resume_text)} characters")
        print(f"Resume Preview: {resume_text[:200]}...")

        X = build_feature_vector(student)
        
        print(f"\n📊 FEATURE VECTOR (normalized 0-1):")
        feature_names = [
            "Commit Frequency", "Consistency", "Code Quality", 
            "Complexity", "Language Diversity", "Resume Depth",
            "Resume Variation", "Market Alignment", "GPA", "Internships"
        ]
        for i, (name, value) in enumerate(zip(feature_names, X)):
            print(f"  x{i+1:2d} - {name:20s}: {value:.4f}")
        
        score = calculate_credit_score(X)
        
        print(f"\n✅ FINAL SCORE: {score}/100")
        print(f"{'='*60}\n")

        return {
            "credora_score": score,
            "status": "success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Credora AI Engine"}
