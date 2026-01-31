"""
Voice API Router - Handles interview voice interactions
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
import uuid
from typing import Dict, List
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from app.models.schemas import (
    StartSessionRequest, StartSessionResponse,
    RespondRequest, RespondResponse,
    TTSRequest, TTSResponse,
    Message, InterviewType, Verbosity, Tone
)
from app.services import openai_service, elevenlabs_service
from app.services.problem_bank import get_random_problem

router = APIRouter()

# In-memory session storage (replace with database in production)
sessions: Dict[str, dict] = {}


@router.post("/start", response_model=StartSessionResponse)
async def start_session(request: StartSessionRequest):
    """
    Start a new interview session.
    Returns session ID and opening message from the interviewer.
    """
    session_id = str(uuid.uuid4())
    
    # Determine the problem/topic
    problem = None
    if request.problem_source == "random":
        problem_data = get_random_problem(request.interview_type)
        problem = f"{problem_data['name']}\n\n{problem_data['content']}"
    elif request.problem_source == "description" and request.problem_description:
        problem = request.problem_description
    elif request.problem_source == "url" and request.problem_url:
        # URL scraping is handled separately before starting
        problem = request.problem_description  # Should be populated after scraping
    
    # Generate opening message using LLM
    opening_text = openai_service.get_opening_message(
        interview_type=request.interview_type,
        tone=request.tone,
        verbosity=request.verbosity,
        problem=problem
    )
    
    # Store session data
    sessions[session_id] = {
        "interview_type": request.interview_type,
        "verbosity": request.verbosity,
        "tone": request.tone,
        "problem": problem,
        "messages": [
            {"role": "interviewer", "content": opening_text, "timestamp": datetime.now().isoformat()}
        ],
        "created_at": datetime.now().isoformat()
    }
    
    # Generate audio for opening using Eleven Labs
    audio_url = None
    try:
        if not elevenlabs_service.ELEVENLABS_API_KEY:
            logger.warning("ELEVENLABS_API_KEY not set, skipping TTS - will use browser fallback")
        else:
            voice_id = elevenlabs_service.get_voice_for_tone(request.tone.value)
            logger.info(f"🎤 Generating Eleven Labs TTS with voice: {voice_id}")
            audio_base64 = await elevenlabs_service.text_to_speech_base64(opening_text, voice_id)
            audio_url = f"data:audio/mpeg;base64,{audio_base64}"
            logger.info(f"✅ Eleven Labs audio generated successfully ({len(audio_base64)} chars)")
    except Exception as e:
        logger.error(f"❌ Eleven Labs TTS Error: {e}")
        audio_url = None
    
    return StartSessionResponse(
        session_id=session_id,
        opening_text=opening_text,
        audio_url=audio_url
    )


@router.post("/respond", response_model=RespondResponse)
async def respond(request: RespondRequest):
    """
    Process user's response and generate interviewer's reply.
    """
    if request.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[request.session_id]
    
    # Add user message to history
    session["messages"].append({
        "role": "user",
        "content": request.user_message,
        "timestamp": datetime.now().isoformat()
    })
    
    # Generate AI response
    try:
        response_text = await openai_service.generate_response(
            messages=session["messages"],
            interview_type=session["interview_type"],
            tone=session["tone"],
            verbosity=session["verbosity"],
            problem=session["problem"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation error: {str(e)}")
    
    # Add interviewer response to history
    session["messages"].append({
        "role": "interviewer",
        "content": response_text,
        "timestamp": datetime.now().isoformat()
    })
    
    # Generate audio using Eleven Labs
    audio_url = None
    try:
        if not elevenlabs_service.ELEVENLABS_API_KEY:
            logger.warning("ELEVENLABS_API_KEY not set, skipping TTS")
        else:
            voice_id = elevenlabs_service.get_voice_for_tone(session["tone"].value)
            logger.info(f"🎤 Generating Eleven Labs TTS for response")
            audio_base64 = await elevenlabs_service.text_to_speech_base64(response_text, voice_id)
            audio_url = f"data:audio/mpeg;base64,{audio_base64}"
            logger.info(f"✅ Eleven Labs audio generated ({len(audio_base64)} chars)")
    except Exception as e:
        logger.error(f"❌ Eleven Labs TTS Error: {e}")
        audio_url = None
    
    return RespondResponse(
        response_text=response_text,
        audio_url=audio_url,
        is_complete=False
    )


@router.post("/tts")
async def text_to_speech(request: TTSRequest):
    """
    Convert text to speech (standalone endpoint).
    Returns audio as binary data.
    """
    try:
        audio_bytes = await elevenlabs_service.text_to_speech(request.text)
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=speech.mp3"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")


@router.get("/session/{session_id}")
async def get_session(session_id: str):
    """
    Get current session data including message history.
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return sessions[session_id]


@router.delete("/session/{session_id}")
async def end_session(session_id: str):
    """
    End and cleanup a session.
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_data = sessions.pop(session_id)
    return {"message": "Session ended", "total_messages": len(session_data["messages"])}
