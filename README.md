# InterviewNinja 🥷

A voice-powered ML/AI interview preparation platform. Practice technical interviews with an AI interviewer that speaks, listens, and provides feedback.

## Features

- **4 Interview Types**:
  - 🧠 **System Design** - Draw diagrams on an interactive canvas while discussing ML system architecture
  - 💻 **Live Coding** - Write and execute code in a Monaco editor (Python, JavaScript, Java, etc.)
  - 📚 **ML Theory** - Discuss theoretical concepts with LaTeX formula rendering
  - 💬 **Coaching** - General interview prep and career coaching

- **Voice Interaction**:
  - AI interviewer speaks using Eleven Labs TTS (female voice)
  - Speech-to-text for your responses
  - Natural conversation flow

- **Customization**:
  - **Verbosity**: Low / Medium / High
  - **Tone**: Friendly / Neutral / Adversarial
  - **Problem Source**: Random / Custom Description / URL Scraping

- **Session Management**:
  - Save interview transcripts
  - AI-powered session analysis with scores and feedback

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TailwindCSS |
| Canvas | Fabric.js |
| Code Editor | Monaco Editor |
| Formula Rendering | KaTeX |
| Backend | FastAPI (Python) |
| Voice TTS | Eleven Labs API |
| Voice STT | Web Speech API |
| LLM | OpenAI GPT-4 |
| Code Execution | Piston API |

## Prerequisites

- Node.js 18+
- Python 3.11+
- OpenAI API key
- Eleven Labs API key

## Setup

### 1. Clone and Configure Environment

```bash
cd InterviewNinja

# Create .env file with your API keys
cat > .env << EOF
OPENAI_API_KEY=your_openai_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
EOF
```

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Run the server
cd backend
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Usage

1. **Select Interview Type** - Choose from the tabs at the top
2. **Configure Settings** - Set verbosity, tone, and problem source in the sidebar
3. **Start Interview** - Click the "Start Interview" button
4. **Interact** - Use the microphone button to speak or type in the chat
5. **Analyze** - Click "Analyze" to get AI feedback on your performance

## Project Structure

```
InterviewNinja/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── routers/
│   │   │   ├── voice.py         # Voice/interview endpoints
│   │   │   ├── session.py       # Session management
│   │   │   ├── scraper.py       # URL scraping
│   │   │   └── code_execution.py # Code runner
│   │   ├── services/
│   │   │   ├── openai_service.py    # GPT-4 integration
│   │   │   ├── elevenlabs_service.py # TTS
│   │   │   └── problem_bank.py      # Sample problems
│   │   └── models/
│   │       └── schemas.py       # Pydantic models
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main app component
│   │   ├── components/
│   │   │   ├── tabs/            # Interview type tabs
│   │   │   ├── controls/        # Voice and settings controls
│   │   │   ├── canvas/          # Drawing canvas
│   │   │   └── shared/          # Reusable components
│   │   ├── hooks/
│   │   │   ├── useVoiceAgent.js # Voice interaction hook
│   │   │   └── useSession.js    # Session management hook
│   │   └── services/
│   │       └── api.js           # Backend API client
│   ├── index.html
│   └── package.json
├── .env                         # API keys (not in git)
└── README.md
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/voice/start` | POST | Start new interview session |
| `/api/voice/respond` | POST | Send user message, get AI response |
| `/api/voice/tts` | POST | Text-to-speech conversion |
| `/api/session/save` | POST | Save session transcript |
| `/api/session/analyze` | POST | Get AI analysis of session |
| `/api/scraper/extract` | POST | Extract problems from URL |
| `/api/code/execute` | POST | Execute code via Piston |

## Voice Selection

The platform uses Eleven Labs for text-to-speech. The default voice is configured to be a warm female voice. You can customize this in `backend/app/services/elevenlabs_service.py`.

## Troubleshooting

### Microphone not working
- Ensure your browser has microphone permissions
- Check that no other application is using the microphone
- Try using Chrome for best Web Speech API support

### Code execution fails
- The Piston API is a free service with rate limits
- For production, consider self-hosting Piston or using Pyodide for Python

### Audio not playing
- Check browser autoplay settings
- Ensure Eleven Labs API key is valid and has credits

## License

MIT
