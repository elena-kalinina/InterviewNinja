"""
Eleven Labs Service for Text-to-Speech
"""

import os
import httpx
import base64
from typing import Optional
import uuid

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"

# Voice IDs - Using a warm female voice
# "Rachel" voice ID - warm, professional female voice
# Alternative: Search for voices matching desired characteristics
VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Rachel

# Voice settings for natural speech
VOICE_SETTINGS = {
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0.5,
    "use_speaker_boost": True
}


async def text_to_speech(text: str, voice_id: Optional[str] = None) -> bytes:
    """
    Convert text to speech using Eleven Labs API.
    Returns audio bytes (MP3 format).
    """
    voice = voice_id or VOICE_ID
    url = f"{ELEVENLABS_BASE_URL}/text-to-speech/{voice}"
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    
    data = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": VOICE_SETTINGS
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=data, headers=headers, timeout=30.0)
        response.raise_for_status()
        return response.content


async def text_to_speech_base64(text: str, voice_id: Optional[str] = None) -> str:
    """
    Convert text to speech and return as base64 encoded string.
    Useful for sending audio data in JSON responses.
    """
    audio_bytes = await text_to_speech(text, voice_id)
    return base64.b64encode(audio_bytes).decode('utf-8')


async def get_available_voices() -> list:
    """
    Get list of available voices from Eleven Labs.
    Useful for finding voices with specific characteristics.
    """
    url = f"{ELEVENLABS_BASE_URL}/voices"
    
    headers = {
        "Accept": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data.get("voices", [])


async def find_female_voices() -> list:
    """
    Find female voices from the available voices.
    Returns list of voice IDs and names.
    """
    voices = await get_available_voices()
    female_voices = []
    
    for voice in voices:
        labels = voice.get("labels", {})
        if labels.get("gender") == "female":
            female_voices.append({
                "voice_id": voice["voice_id"],
                "name": voice["name"],
                "accent": labels.get("accent", "unknown"),
                "description": labels.get("description", ""),
                "preview_url": voice.get("preview_url")
            })
    
    return female_voices


# Alternative voice IDs for different characteristics
# These can be updated based on Eleven Labs voice library
ALTERNATIVE_VOICES = {
    "warm_female": "21m00Tcm4TlvDq8ikWAM",  # Rachel
    "professional_female": "EXAVITQu4vr4xnSDxMaL",  # Bella
    "friendly_female": "MF3mGyEYCl7XYWbV9V6O",  # Elli
}


def get_voice_for_tone(tone: str) -> str:
    """
    Select appropriate voice based on interview tone.
    """
    if tone == "friendly":
        return ALTERNATIVE_VOICES.get("friendly_female", VOICE_ID)
    elif tone == "adversarial":
        return ALTERNATIVE_VOICES.get("professional_female", VOICE_ID)
    else:
        return ALTERNATIVE_VOICES.get("warm_female", VOICE_ID)
