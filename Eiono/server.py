from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pipeline import run_research_pipeline

app = FastAPI(title="ResearchMind API")

# Only needed if you call the API directly from the browser
# without the Vite proxy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ResearchRequest(BaseModel):
    topic: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/research")
def research(req: ResearchRequest):
    topic = req.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic is required")
    try:
        return run_research_pipeline(topic)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))