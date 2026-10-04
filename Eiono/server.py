import logging
import os
import traceback

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from pipeline import run_research_pipeline

logger = logging.getLogger("eiono")

app = FastAPI(title="Eiono API")

# ---- CORS: works locally and in production ----
# Always allowed: local dev + the deployed Vercel site (hardcoded, so it
# works even if no env variable is set on Render).
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://eiono.vercel.app",
]

# Optional: extra origins (e.g. a custom domain) via a comma-separated env var
extra = os.getenv("FRONTEND_ORIGINS", "")
ALLOWED_ORIGINS += [o.strip().rstrip("/") for o in extra.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Vercel preview deploys
    allow_methods=["*"],
    allow_headers=["*"],
)


class ResearchRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=300)


class ResearchResponse(BaseModel):
    search_results: str
    scraped_content: str
    report: str
    feedback: str


@app.get("/")
def root():
    return {"name": "Eiono API", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}


# Plain `def` (not async): the pipeline makes blocking calls, so FastAPI
# runs it in a worker thread and the server stays responsive.
@app.post("/api/research", response_model=ResearchResponse)
def research(req: ResearchRequest):
    topic = req.topic.strip()
    if len(topic) < 3:
        raise HTTPException(status_code=400, detail="Topic is too short")

    try:
        result = run_research_pipeline(topic)
    except Exception as e:
        logger.error("Pipeline failed:\n%s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Research failed: {e}")

    return ResearchResponse(
        search_results=str(result.get("search_results", "")),
        scraped_content=str(result.get("scraped_content", "")),
        report=str(result.get("report", "")),
        feedback=str(result.get("feedback", "")),
    )