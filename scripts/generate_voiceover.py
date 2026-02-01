"""
Generate voiceover audio from text using Eleven Labs TTS
Usage: python scripts/generate_voiceover.py
"""

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv(Path(__file__).parent.parent / ".env")

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

# Voice options - pick one you like
VOICES = {
    "rachel": "21m00Tcm4TlvDq8ikWAM",  # Rachel - calm, professional
    "bella": "EXAVITQu4vr4xnSDxMaL",    # Bella - warm, friendly
    "elli": "MF3mGyEYCl7XYWbV9V6O",     # Elli - young, bright
    "josh": "TxGEqnHWrfWFTfGW9XjX",     # Josh - deep, narrative
    "adam": "pNInz6obpgDQGcFmaJgB",     # Adam - deep, professional
}

def text_to_speech(text: str, voice_id: str, output_path: str):
    """Generate speech audio from text and save to file."""
    
    if not ELEVENLABS_API_KEY:
        print("Error: ELEVENLABS_API_KEY not found in environment")
        return False
    
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
    }
    
    data = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
        }
    }
    
    print(f"Generating audio for {len(text)} characters...")
    
    with httpx.Client(timeout=120.0) as client:
        response = client.post(url, json=data, headers=headers)
        
        if response.status_code == 200:
            with open(output_path, "wb") as f:
                f.write(response.content)
            print(f"✅ Audio saved to: {output_path}")
            return True
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return False


def main():
    # Your video script - edit this!
    script = """
Meet InterviewNinja - your AI voice companion for practicing ML and AI interviews.

Technical interviews are tough. You need to explain algorithms, design systems, and think out loud - all under pressure. InterviewNinja lets you practice with a realistic AI interviewer that actually listens and responds.

Let me show you how it works.

First, the settings. You can adjust verbosity - how much detail the interviewer gives you. The tone ranges from friendly to adversarial - because some interviewers are tougher than others. And you can choose your problem source - random, custom description, or even a URL.

Speaking of URLs - watch this. I'll paste a Reddit link with ML interview problems. InterviewNinja scrapes the page and extracts the problems automatically. Now when I start the session, the interviewer picks from that list.

Next up - System Design. The canvas lets you sketch your architecture while discussing it with the interviewer. Draw components, add labels, connect them with arrows - just like a real whiteboard session.

For ML Theory, you can write mathematical formulas. Here I'm asking about loss functions, and I'll write the Mean Squared Error formula. It renders beautifully, and I can explain each term to the interviewer.

Finally, the Coaching tab. This is where you practice behavioral questions - like discussing your biggest professional failure. The coach gives focused, practical advice to help you frame your experiences effectively.

InterviewNinja - practice speaking your way to your dream ML job.
    """
    
    # Choose voice
    voice = "bella"  # Options: rachel, bella, elli, josh, adam
    
    # Output file
    output_dir = Path(__file__).parent.parent / "assets"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / "voiceover.mp3"
    
    print(f"Using voice: {voice}")
    print(f"Script length: {len(script)} characters")
    print("-" * 50)
    
    success = text_to_speech(script.strip(), VOICES[voice], str(output_file))
    
    if success:
        print("-" * 50)
        print(f"🎬 Voiceover ready at: {output_file}")
        print("Import this audio into your video editor!")


if __name__ == "__main__":
    main()
