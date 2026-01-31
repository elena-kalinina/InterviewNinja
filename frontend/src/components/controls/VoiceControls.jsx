import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Play, Square, BarChart3, Save, Loader2, Volume2, VolumeX } from 'lucide-react';

export default function VoiceControls({ voiceAgent, onAnalyze }) {
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recognitionRef = useRef(null);

  const {
    isSessionActive,
    isLoading,
    isRecording,
    isPlaying,
    messages,
    startSession,
    endSession,
    sendResponse,
    startRecording,
    stopRecording,
    saveSession,
    stopAudio,
  } = voiceAgent;

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsTranscribing(false);
      };

      recognitionRef.current.onend = () => {
        setIsTranscribing(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleStartSession = async () => {
    try {
      await startSession();
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  const handleEndSession = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setTranscript('');
    await endSession();
  };

  const handleMicToggle = async () => {
    if (isRecording || isTranscribing) {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      await stopRecording();
      
      // Send the transcript if we have one
      if (transcript.trim()) {
        await sendResponse(transcript.trim());
        setTranscript('');
      }
    } else {
      // Start recording
      setTranscript('');
      await startRecording();
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsTranscribing(true);
        } catch (err) {
          console.error('Failed to start speech recognition:', err);
        }
      }
    }
  };

  const handleSave = async () => {
    try {
      await saveSession();
      alert('Session saved successfully!');
    } catch (err) {
      console.error('Failed to save session:', err);
    }
  };

  const handleAnalyze = async () => {
    onAnalyze?.();
  };

  return (
    <div className="glass-card p-6 space-y-5">
      <h3 className="text-lg font-semibold text-gray-400 uppercase tracking-wider">
        Voice Controls
      </h3>

      {/* Main Control Buttons */}
      <div className="flex gap-3">
        {/* Start/Stop Session */}
        {!isSessionActive ? (
          <button
            onClick={handleStartSession}
            disabled={isLoading}
            className="flex-1 btn-primary flex items-center justify-center gap-3 text-lg py-4 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Play className="w-6 h-6" />
            )}
            Start Interview
          </button>
        ) : (
          <button
            onClick={handleEndSession}
            className="flex-1 btn-danger flex items-center justify-center gap-3 text-lg py-4"
          >
            <Square className="w-6 h-6" />
            End Session
          </button>
        )}
      </div>

      {/* Mic Button */}
      {isSessionActive && (
        <div className="space-y-4">
          <button
            onClick={handleMicToggle}
            disabled={isLoading || isPlaying}
            className={`w-full py-5 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${
              isRecording || isTranscribing
                ? 'bg-red-500 text-white mic-recording'
                : 'bg-navy-700 text-white hover:bg-navy-600 border border-white/10'
            } disabled:opacity-50`}
          >
            {isRecording || isTranscribing ? (
              <>
                <MicOff className="w-6 h-6" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-6 h-6" />
                Hold to Speak
              </>
            )}
          </button>

          {/* Transcript Preview */}
          {transcript && (
            <div className="p-4 bg-navy-800 rounded-lg text-base text-gray-300 italic">
              "{transcript}"
            </div>
          )}

          {/* Audio Status */}
          {isPlaying && (
            <div className="flex items-center justify-between p-4 bg-electric-500/20 rounded-lg">
              <div className="flex items-center gap-3 text-electric-400">
                <Volume2 className="w-5 h-5 animate-pulse" />
                <span className="text-base">Playing response...</span>
              </div>
              <button
                onClick={stopAudio}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <VolumeX className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Session Actions */}
      {messages.length > 0 && (
        <div className="flex gap-3 pt-3 border-t border-white/10">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 btn-secondary flex items-center justify-center gap-2 text-base py-3"
          >
            <Save className="w-5 h-5" />
            Save
          </button>
          <button
            onClick={handleAnalyze}
            disabled={isLoading || messages.length < 2}
            className="flex-1 btn-primary flex items-center justify-center gap-2 text-base py-3"
          >
            <BarChart3 className="w-5 h-5" />
            Analyze
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && !isRecording && (
        <div className="flex items-center justify-center gap-3 text-electric-400 py-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-base">Processing...</span>
        </div>
      )}
    </div>
  );
}
