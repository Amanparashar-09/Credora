> **Credora is an explainable AI engine that estimates a student’s creditworthiness from skills, code, and academics—without salary, CIBIL score, or co‑signers.**

This repository contains the **AI / ML scoring module** used for **Round‑1 hackathon evaluation**.  
The goal is to demonstrate **good problem framing, a clean and modular pipeline, and transparent scoring**, not to ship a production banking system.

---

## 1. Problem Setting

Most students are essentially **credit-invisible**:

- No stable salary
- No formal credit history
- No CIBIL / bureau score

Traditional credit scoring relies on **past financial behaviour**, which simply does not exist for this segment. As a result, students with strong skills but no income are treated the same as high‑risk borrowers.

---

## 2. Key Idea

For students, the most informative signal is **future earning potential**, not past income.

Credora therefore scores students using **capability signals** instead of bank statements:

- Public GitHub activity and language diversity
- Real source‑code embeddings (CodeBERT)
- Resume content and skills (SBERT / sentence‑transformers)
- Academic performance (GPA)
- Practical exposure (internships / certifications)

All of these are converted into a single, normalized **feature vector in $\mathbb{R}^{10}$**, which feeds an **interpretable linear model**.

---

## 3. System Overview

High‑level data flow:

1. **Student inputs**
    - GitHub username (public data only)
    - Resume PDF
    - GPA
    - Internship count (and optionally certifications)
2. **Ingestion & parsing**
    - Resume PDF → clean text
    - GitHub API → repos, languages, commits, code files
3. **Embeddings**
    - Resume text → SBERT embedding (SentenceTransformer)
    - Source code → CodeBERT embedding (Transformers)
4. **Feature engineering**
    - GitHub temporal activity, languages, and code complexity
    - Resume semantic depth, variation, and market skill match
    - GPA and internship normalization
5. **Scoring**
    - Weighted linear combination of the 10 features → **Credora Score (0–100)**
    - Score mapped to a credit limit band.

All heavy lifting (GitHub calls, PDF parsing, embeddings, feature math, and scoring) is implemented in this repo as plain Python with local models—no external paid API calls are required.

---

## 4. Architecture (Conceptual)

```mermaid
flowchart TD
     A[Student Inputs] --> B[Resume Parser]
     A --> C[GitHub Data Fetcher]
     A --> D[Academics & Internships]

     B --> E[SBERT Text Embeddings]
     C --> F[GitHub Activity Features]
     C --> G[CodeBERT Code Embeddings]

     E --> H[Resume Feature Engineering]
     F --> I[GitHub Feature Engineering]
     G --> J[Code Feature Engineering]
     D --> K[Academic Feature Engineering]

     H --> L[Feature Vector Builder (R^10)]
     I --> L
     J --> L
     K --> L

     L --> M[Linear Scoring Model]
     M --> N[Credora Score (0–100)]
     N --> O[Credit Limit Mapping]
```

This mirrors the actual Python modules and keeps a 1‑to‑1 mapping between boxes and code.

---

## 5. Detailed Pipeline

### 5.1 Inputs

The AI module consumes only **non‑sensitive, developer‑facing signals**:

- GitHub username (public profile and repos)
- Resume as a PDF file
- GPA (on a 10‑point scale in the demo)
- Number of internships (and optionally certifications)

No salary slips, banking data, or bureau reports are required.

---

### 5.2 Resume Processing (NLP)

1. **Parsing** – [app/data_sources/resume_parser.py](app/data_sources/resume_parser.py)
    - Uses **PyMuPDF** to extract clean text from the uploaded PDF.
2. **Text embeddings** – [app/embeddings/text_embedder.py](app/embeddings/text_embedder.py)
    - Model: `sentence-transformers/all-MiniLM-L6-v2` (SBERT‑style encoder).
    - Uses CUDA automatically if available, otherwise CPU.
3. **Feature extraction** – [app/features/resume_features.py](app/features/resume_features.py)
    - $x_6$: mean of the embedding (semantic depth of resume).
    - $x_7$: standard deviation of embedding (variety / richness).
    - $x_8$: fraction of tokens that match a curated `MARKET_SKILLS` set
      (e.g. python, ml, cloud, devops, sql, blockchain).

The outcome is a **dense representation of the candidate’s stated skills and projects**, plus an explicit measure of alignment with in‑demand technologies.

---

### 5.3 GitHub & Code Intelligence

1. **Data fetch** – [app/data_sources/github_fetcher.py](app/data_sources/github_fetcher.py)
    - Wraps the GitHub REST API with optional token auth (`GITHUB_TOKEN`).
    - Returns repo metadata and top‑level code files for a user.
2. **Activity features** – [app/features/github_features.py](app/features/github_features.py)
    - Defensive handling of GitHub responses (handles rate limits / errors gracefully).
    - $x_1$: **Commit frequency**, normalized per month.
    - $x_2$: **Active months ratio** over the last year.
    - $x_5$: **Language diversity**, based on distinct primary languages.
3. **Code embeddings** – [app/embeddings/code_embedder.py](app/embeddings/code_embedder.py)
    - Model: `microsoft/codebert-base` (via HuggingFace Transformers).
    - Automatically uses GPU if `torch.cuda.is_available()`, else CPU.
    - Aggregates token representations per file into a single vector.
4. **Code features** – used inside [app/features/feature_builder.py](app/features/feature_builder.py)
    - $x_3$: mean of code embeddings across repos (semantic code quality proxy).
    - $x_4$: standard deviation of embeddings (complexity / variance proxy).

This subsystem approximates **how serious the candidate is as an engineer**: consistent activity, breadth of languages, and structural richness of real code.

---

### 5.4 Academic & Internship Features

Implemented in [app/features/resume_features.py](app/features/resume_features.py):

- $x_9$: GPA normalized to $[0,1]$ (e.g. GPA / 10).
- $x_{10}$: internships clipped to a maximum contribution of 1.0
  (e.g. `min(internships / 3, 1.0)`).

These capture **formal performance** and **real‑world exposure** in a simple, interpretable way.

---

### 5.5 Final Feature Vector

The feature builder lives in [app/features/feature_builder.py](app/features/feature_builder.py).  
Given a `student` dict, it outputs a 10‑dimensional NumPy vector:

| Index | Name                        | Source     |
|-------|-----------------------------|-----------|
| $x_1$ | Commit frequency            | GitHub    |
| $x_2$ | Active months ratio         | GitHub    |
| $x_3$ | Code semantic quality       | CodeBERT  |
| $x_4$ | Code complexity             | CodeBERT  |
| $x_5$ | Language diversity          | GitHub    |
| $x_6$ | Resume semantic depth       | SBERT     |
| $x_7$ | Resume skill variation      | SBERT     |
| $x_8$ | Market skill alignment      | Resume    |
| $x_9$ | GPA normalized              | Academics |
| $x_{10}$ | Internship validation    | Experience|

This vector is the only input to the scoring model, which makes the
system **easy to audit and extend**.

---

## 6. Scoring Model

The scoring logic is implemented in [app/Scoring/credit_scorer.py](app/Scoring/credit_scorer.py).

We deliberately use a **weighted linear model** instead of a black‑box neural net:

\[
	ext{CredoraScore} = 100 \times \sum_{i=1}^{10} w_i x_i
\]

Where $w_i$ are hand‑chosen, domain‑driven weights that reflect intuitive priorities:

- Behavioural / skill signals (GitHub, resume, code) get higher weight.
- Academic and internship signals provide stability but are not dominant.

This setup makes it straightforward for evaluators to:

- Inspect the weight vector.
- Reason about how changing a given feature (e.g. more internships) would change the score.
- Justify decisions to non‑technical stakeholders.

---

## 7. Credit Limit Mapping

After computing the **Credora Score** in the range $[0,100]$, the system maps it to a discrete credit band:

| Credora Score | Credit Limit |
|---------------|-------------|
| 80 – 100      | ₹50,000     |
| 65 – 79       | ₹30,000     |
| 50 – 64       | ₹15,000     |
| < 50          | Not eligible|

These thresholds are intentionally simple for hackathon evaluation; in a real deployment they could be calibrated against portfolio performance and risk appetite.

---

## 8. Code Structure (AI Module)

Project layout, aligned with the actual implementation:

```text
AI_Score_Engine/
├── app/
│   ├── __init__.py            # Loads .env early
│   ├── main.py                # FastAPI entry point (REST /score)
│   ├── config.py              # Env config, tokens, and shared constants
│   │
│   ├── data_sources/
│   │   ├── github_fetcher.py  # GitHub API integration
│   │   └── resume_parser.py   # Resume PDF → text
│   │
│   ├── embeddings/
│   │   ├── text_embedder.py   # SBERT text embeddings (CPU / CUDA)
│   │   └── code_embedder.py   # CodeBERT embeddings (CPU / CUDA)
│   │
│   ├── features/
│   │   ├── github_features.py # Commit frequency, active months, languages
│   │   ├── resume_features.py # Resume + academic features
│   │   └── feature_builder.py # Assembles 10‑dimensional feature vector
│   │
│   └── Scoring/
│       └── credit_scorer.py   # Linear model and CLI helper
│
├── test_pipeline.py           # End‑to‑end CLI test (PDF + GitHub → score)
└── requirements.txt           # All dependencies (FastAPI, HF, torch, etc.)
```

This separation makes it easy to unit‑test each piece (parsers, embeddings,
features, scorer) and to swap in more advanced models later.

---

## 9. How to Run (for Evaluators)

Assuming Python 3.10+ and git are installed.

1. **Clone & create virtual env**

    ```bash
    git clone <repo-url>
    cd AI_Score_Engine
    python -m venv venv
    source venv/bin/activate      # On Windows: venv\Scripts\activate
    ```

2. **Install dependencies**

    ```bash
    pip install -r requirements.txt
    ```

3. **Run the end‑to‑end pipeline** (CLI)

    - Place a sample resume as `Sample_resume.pdf` in the root folder.
    - Edit `STUDENT` in [test_pipeline.py](test_pipeline.py) to point to a public GitHub username and GPA.
    - Execute:

    ```bash
    python test_pipeline.py
    ```

    The script will:
    - Parse the resume.
    - Build the 10‑dimensional feature vector.
    - Compute the Credora Score and corresponding credit limit.

4. **Run the API** (optional)

    ```bash
    uvicorn app.main:app --reload
    ```

    - POST to `/score` with a JSON `student` payload to obtain the same score via HTTP.

---

## 10. Testing Status

For the hackathon submission, the following have been validated manually:

- ✅ Resume parsing on multiple real student resumes (PDF → text).  
- ✅ GitHub feature extraction on public profiles.  
- ✅ Embeddings for both text and code (CPU and, where available, CUDA).  
- ✅ Feature vector shape and value ranges.  
- ✅ End‑to‑end pipeline via [test_pipeline.py](test_pipeline.py) and [app/Scoring/credit_scorer.py](app/Scoring/credit_scorer.py).

---

## 11. Future Work (Beyond Round‑1)

Planned but intentionally out of scope for this round:

- Supervised models trained on real repayment / default data.
- Behavioural and fraud‑detection features (e.g. velocity, synthetic identities).
- Score calibration and drift monitoring in production.
- On‑chain anchoring of scores for auditability.
- Incorporating employer / alumni signals and offer letters.

The current version focuses on a **clear, auditable mapping from student skills → features → score**, which is well suited for evaluation by both human judges and LLM‑based graders.
