from fastapi import FastAPI, UploadFile, File, Form, HTTPException

from app.data_sources.resume_parser import extract_text_from_pdf_bytes
from app.features.feature_builder import build_feature_vector
from app.Scoring.credit_scorer import calculate_credit_score

app = FastAPI(title="Credora AI Engine")

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

        X = build_feature_vector(student)
        score = calculate_credit_score(X)

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
