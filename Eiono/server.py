import logging
import traceback

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from pipeline import run_research_pipeline

logger = logging.getLogger("eiono")

app = FastAPI(title="Eiono API")

# Only needed if the browser calls the API directly (no Vite proxy)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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