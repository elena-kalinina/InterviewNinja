"""
OpenAI Service for interview conversation management
"""

import os
import json
from openai import OpenAI
from typing import List, Dict, Optional
from app.models.schemas import InterviewType, Verbosity, Tone, Message

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# System prompts for different interview types
SYSTEM_PROMPTS = {
    InterviewType.SYSTEM_DESIGN: """You are an experienced ML/AI system design interviewer. 
Your role is to guide candidates through system design problems for machine learning systems.
Focus on: scalability, data pipelines, model serving, monitoring, and trade-offs.
Ask probing questions about their design choices and help them think through edge cases.
The candidate may be drawing on a canvas - reference their diagrams when appropriate.""",
    
    InterviewType.LIVE_CODING: """You are an experienced coding interviewer for ML/AI positions.
Your role is to present coding problems and guide candidates through solving them.
Focus on: algorithm efficiency, code quality, ML-specific implementations (data preprocessing, 
model evaluation, feature engineering).
Provide hints when stuck, but let them drive the solution.
The candidate is writing code in an editor - reference their code when appropriate.""",
    
    InterviewType.ML_THEORY: """You are an expert ML/AI interviewer testing theoretical knowledge.
Your role is to ask questions about machine learning concepts, deep learning, statistics, 
and AI fundamentals.
Cover topics like: gradient descent, regularization, bias-variance tradeoff, neural network 
architectures, transformers, attention mechanisms, loss functions, optimization.
The candidate may write formulas - acknowledge and discuss their mathematical notation.""",
    
    InterviewType.COACHING: """You are a supportive ML/AI career coach.
Your role is to help candidates prepare for their interviews, provide advice on career development,
discuss salary negotiations, review their experience, and build their confidence.
Be encouraging but honest. Help them articulate their experiences effectively."""
}

TONE_MODIFIERS = {
    Tone.FRIENDLY: "Be warm, encouraging, and supportive. Use positive reinforcement frequently.",
    Tone.NEUTRAL: "Be professional and balanced. Provide objective feedback without being too warm or cold.",
    Tone.ADVERSARIAL: "Be challenging and push back on answers. Play devil's advocate. Test their conviction and ability to defend their choices under pressure."
}

VERBOSITY_MODIFIERS = {
    Verbosity.LOW: "Keep responses brief and to the point. Ask one question at a time. Minimal explanation.",
    Verbosity.MEDIUM: "Provide moderate detail in responses. Balance between brevity and thoroughness.",
    Verbosity.HIGH: "Provide detailed explanations and context. Elaborate on concepts when relevant."
}


def build_system_prompt(
    interview_type: InterviewType,
    tone: Tone,
    verbosity: Verbosity,
    problem: Optional[str] = None
) -> str:
    """Build the complete system prompt based on settings."""
    base_prompt = SYSTEM_PROMPTS[interview_type]
    tone_modifier = TONE_MODIFIERS[tone]
    verbosity_modifier = VERBOSITY_MODIFIERS[verbosity]
    
    prompt = f"""{base_prompt}

Communication Style:
{tone_modifier}
{verbosity_modifier}

Important: You are simulating a real interview. Stay in character throughout."""
    
    if problem:
        prompt += f"\n\nThe interview problem/topic is:\n{problem}"
    
    return prompt


def get_opening_message(
    interview_type: InterviewType,
    tone: Tone,
    problem: Optional[str] = None
) -> str:
    """Generate the opening message for the interview."""
    
    # Extract just the problem name if it's a full description
    problem_name = None
    if problem:
        # Get first line or first 100 chars as the problem name
        first_line = problem.split('\n')[0].strip()
        problem_name = first_line[:100] if len(first_line) > 100 else first_line
    
    if interview_type == InterviewType.SYSTEM_DESIGN:
        if problem_name:
            opening = f"Hello! Today we're going to design a system together. I'd like you to walk me through how you would build {problem_name}. Before we start, could you briefly share your experience with ML system design?"
        else:
            opening = "Hello! Today we're going to work through a system design problem together. I'll present the scenario in just a moment. First, could you tell me a bit about your background with ML system design?"
    
    elif interview_type == InterviewType.LIVE_CODING:
        if problem_name:
            opening = f"Hi there! We have a coding challenge for you today. We'll be working on {problem_name}. Feel free to think out loud as you code. Are you ready to get started?"
        else:
            opening = "Hi there! Today we'll work through a coding problem together. I encourage you to think out loud as you work through your solution. Ready to see what we'll be tackling?"
    
    elif interview_type == InterviewType.ML_THEORY:
        if problem_name:
            opening = f"Welcome! Today we'll dive into some machine learning theory, specifically around {problem_name}. Let's start with a foundational question to warm up."
        else:
            opening = "Welcome! Today we'll explore some machine learning and deep learning concepts together. I'll ask you questions that might come up in a real interview. Ready to begin?"
    
    elif interview_type == InterviewType.COACHING:
        opening = "Hi there! I'm here to help you prepare for your upcoming ML interviews. We can work on anything from behavioral questions to technical communication. What would you like to focus on today?"
    
    else:
        opening = "Hello! Let's get started with your interview practice session."
    
    # Adjust tone
    if tone == Tone.FRIENDLY:
        opening = "Great to meet you! " + opening
    elif tone == Tone.ADVERSARIAL:
        opening = opening.replace("Hello!", "Alright,").replace("Hi there!", "Let's begin.").replace("Welcome!", "Okay,")
    
    return opening


async def generate_response(
    messages: List[Dict[str, str]],
    interview_type: InterviewType,
    tone: Tone,
    verbosity: Verbosity,
    problem: Optional[str] = None
) -> str:
    """Generate AI response based on conversation history."""
    
    system_prompt = build_system_prompt(interview_type, tone, verbosity, problem)
    
    # Build messages list for OpenAI
    openai_messages = [{"role": "system", "content": system_prompt}]
    
    for msg in messages:
        role = "assistant" if msg["role"] == "interviewer" else "user"
        openai_messages.append({"role": role, "content": msg["content"]})
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=openai_messages,
        temperature=0.7,
        max_tokens=500
    )
    
    return response.choices[0].message.content


async def analyze_session(
    messages: List[Message],
    interview_type: InterviewType
) -> Dict:
    """Analyze the interview session and provide feedback."""
    
    # Convert messages to transcript
    transcript = "\n".join([
        f"{'Interviewer' if m.role == 'interviewer' else 'Candidate'}: {m.content}"
        for m in messages
    ])
    
    analysis_prompt = f"""Analyze this {interview_type.value.replace('_', ' ')} interview transcript and provide detailed feedback.

Transcript:
{transcript}

Provide your analysis in the following JSON format:
{{
    "overall_score": <1-10>,
    "strengths": ["strength1", "strength2", ...],
    "areas_for_improvement": ["area1", "area2", ...],
    "detailed_feedback": "Comprehensive paragraph of feedback",
    "recommendations": ["recommendation1", "recommendation2", ...]
}}

Be specific and actionable in your feedback. Reference specific moments from the interview."""

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an expert interview coach providing detailed feedback on interview performance. Always respond with valid JSON."},
            {"role": "user", "content": analysis_prompt}
        ],
        temperature=0.3,
        max_tokens=1000
    )
    
    try:
        return json.loads(response.choices[0].message.content)
    except json.JSONDecodeError:
        # Fallback if JSON parsing fails
        return {
            "overall_score": 5,
            "strengths": ["Unable to parse detailed feedback"],
            "areas_for_improvement": ["Unable to parse detailed feedback"],
            "detailed_feedback": response.choices[0].message.content,
            "recommendations": ["Please review the transcript manually"]
        }
