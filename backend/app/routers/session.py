"""
Session API Router - Handles session saving and analysis
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, List
import json
import os
from datetime import datetime

from app.models.schemas import (
    SaveSessionRequest, AnalyzeSessionRequest, AnalysisResponse,
    SessionData, Message
)
from app.services import openai_service

router = APIRouter()

# In-memory storage for saved sessions (replace with database in production)
saved_sessions: Dict[str, dict] = {}

# Directory for persistent session storage
SESSIONS_DIR = "saved_sessions"
os.makedirs(SESSIONS_DIR, exist_ok=True)


@router.post("/save")
async def save_session(request: SaveSessionRequest):
    """
    Save the interview session for later review.
    """
    session_data = {
        "session_id": request.session_id,
        "interview_type": request.interview_type.value,
        "messages": [msg.model_dump() for msg in request.messages],
        "problem": request.problem,
        "saved_at": datetime.now().isoformat()
    }
    
    # Save to memory
    saved_sessions[request.session_id] = session_data
    
    # Save to file
    filename = f"{SESSIONS_DIR}/{request.session_id}.json"
    try:
        with open(filename, "w") as f:
            json.dump(session_data, f, indent=2)
    except Exception as e:
        print(f"Error saving session to file: {e}")
    
    return {
        "message": "Session saved successfully",
        "session_id": request.session_id,
        "saved_at": session_data["saved_at"]
    }


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_session(request: AnalyzeSessionRequest):
    """
    Analyze the interview session and provide detailed feedback.
    """
    if not request.messages:
        raise HTTPException(status_code=400, detail="No messages to analyze")
    
    try:
        analysis = await openai_service.analyze_session(
            messages=request.messages,
            interview_type=request.interview_type
        )
        
        return AnalysisResponse(
            overall_score=analysis.get("overall_score", 5),
            strengths=analysis.get("strengths", []),
            areas_for_improvement=analysis.get("areas_for_improvement", []),
            detailed_feedback=analysis.get("detailed_feedback", ""),
            recommendations=analysis.get("recommendations", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")


@router.get("/list")
async def list_sessions():
    """
    List all saved sessions.
    """
    sessions_list = []
    
    # From memory
    for session_id, data in saved_sessions.items():
        sessions_list.append({
            "session_id": session_id,
            "interview_type": data["interview_type"],
            "saved_at": data["saved_at"],
            "message_count": len(data["messages"])
        })
    
    # Also check files
    try:
        for filename in os.listdir(SESSIONS_DIR):
            if filename.endswith(".json"):
                session_id = filename[:-5]
                if session_id not in saved_sessions:
                    with open(f"{SESSIONS_DIR}/{filename}", "r") as f:
                        data = json.load(f)
                        sessions_list.append({
                            "session_id": session_id,
                            "interview_type": data["interview_type"],
                            "saved_at": data["saved_at"],
                            "message_count": len(data["messages"])
                        })
    except Exception as e:
        print(f"Error reading sessions from files: {e}")
    
    return {"sessions": sessions_list}


@router.get("/{session_id}")
async def get_saved_session(session_id: str):
    """
    Get a specific saved session.
    """
    # Check memory first
    if session_id in saved_sessions:
        return saved_sessions[session_id]
    
    # Check file
    filename = f"{SESSIONS_DIR}/{session_id}.json"
    if os.path.exists(filename):
        with open(filename, "r") as f:
            return json.load(f)
    
    raise HTTPException(status_code=404, detail="Session not found")


@router.delete("/{session_id}")
async def delete_session(session_id: str):
    """
    Delete a saved session.
    """
    deleted = False
    
    # Remove from memory
    if session_id in saved_sessions:
        del saved_sessions[session_id]
        deleted = True
    
    # Remove file
    filename = f"{SESSIONS_DIR}/{session_id}.json"
    if os.path.exists(filename):
        os.remove(filename)
        deleted = True
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"message": "Session deleted", "session_id": session_id}
