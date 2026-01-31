"""
InterviewNinja - FastAPI Backend
Voice-powered ML/AI interview preparation platform
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Import routers
from app.routers import voice, session, scraper, code_execution

app = FastAPI(
    title="InterviewNinja API",
    description="Backend API for ML/AI interview preparation voice agent",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(voice.router, prefix="/api/voice", tags=["Voice"])
app.include_router(session.router, prefix="/api/session", tags=["Session"])
app.include_router(scraper.router, prefix="/api/scraper", tags=["Scraper"])
app.include_router(code_execution.router, prefix="/api/code", tags=["Code Execution"])


@app.get("/")
async def root():
    return {"message": "InterviewNinja API", "status": "running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
