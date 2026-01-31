"""
Pydantic models for request/response schemas
"""

from pydantic import BaseModel
from typing import Optional, List, Literal
from enum import Enum


class Verbosity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Tone(str, Enum):
    FRIENDLY = "friendly"
    NEUTRAL = "neutral"
    ADVERSARIAL = "adversarial"


class InterviewType(str, Enum):
    SYSTEM_DESIGN = "system_design"
    LIVE_CODING = "live_coding"
    ML_THEORY = "ml_theory"
    COACHING = "coaching"


class ProblemSource(str, Enum):
    RANDOM = "random"
    DESCRIPTION = "description"
    URL = "url"


# Voice Session Models
class StartSessionRequest(BaseModel):
    interview_type: InterviewType
    verbosity: Verbosity = Verbosity.MEDIUM
    tone: Tone = Tone.NEUTRAL
    problem_source: ProblemSource = ProblemSource.RANDOM
    problem_description: Optional[str] = None
    problem_url: Optional[str] = None


class StartSessionResponse(BaseModel):
    session_id: str
    opening_text: str
    audio_url: Optional[str] = None


class RespondRequest(BaseModel):
    session_id: str
    user_message: str


class RespondResponse(BaseModel):
    response_text: str
    audio_url: Optional[str] = None
    is_complete: bool = False


class TTSRequest(BaseModel):
    text: str


class TTSResponse(BaseModel):
    audio_url: str


# Session Models
class Message(BaseModel):
    role: Literal["interviewer", "user"]
    content: str
    timestamp: Optional[str] = None


class SessionData(BaseModel):
    session_id: str
    interview_type: InterviewType
    messages: List[Message]
    problem: Optional[str] = None
    settings: dict


class SaveSessionRequest(BaseModel):
    session_id: str
    interview_type: InterviewType
    messages: List[Message]
    problem: Optional[str] = None


class AnalyzeSessionRequest(BaseModel):
    session_id: str
    messages: List[Message]
    interview_type: InterviewType


class AnalysisResponse(BaseModel):
    overall_score: int
    strengths: List[str]
    areas_for_improvement: List[str]
    detailed_feedback: str
    recommendations: List[str]


# Scraper Models
class ScrapeRequest(BaseModel):
    url: str


class Problem(BaseModel):
    name: str
    content: str
    difficulty: Optional[str] = None


class ScrapeResponse(BaseModel):
    problems: List[Problem]
    source_url: str


# Code Execution Models
class ExecuteCodeRequest(BaseModel):
    code: str
    language: str = "python"
    stdin: Optional[str] = None


class ExecuteCodeResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    execution_time: Optional[float] = None
