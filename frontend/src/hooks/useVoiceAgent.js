/**
 * Voice Agent Hook - Manages voice interview state and interactions
 */

import { useState, useCallback, useRef } from 'react';
import api from '../services/api';

export function useVoiceAgent() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    interviewType: 'system_design',
    verbosity: 'medium',
    tone: 'neutral',
    problemSource: 'random',
    problemDescription: '',
    problemUrl: '',
  });

  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Start a new interview session
  const startSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.startSession({
        interview_type: settings.interviewType,
        verbosity: settings.verbosity,
        tone: settings.tone,
        problem_source: settings.problemSource,
        problem_description: settings.problemDescription || null,
        problem_url: settings.problemUrl || null,
      });

      setSessionId(response.session_id);
      setMessages([
        {
          role: 'interviewer',
          content: response.opening_text,
          timestamp: new Date().toISOString(),
        },
      ]);

      // Speak the opening message
      speakText(response.opening_text);

      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [settings, speakText]);

  // Send user response and get AI reply
  const sendResponse = useCallback(async (userMessage) => {
    if (!sessionId) {
      setError('No active session');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMsg = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await api.respond(sessionId, userMessage);

      // Add interviewer response
      const interviewerMsg = {
        role: 'interviewer',
        content: response.response_text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, interviewerMsg]);

      // Speak the response
      speakText(response.response_text);

      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, speakText]);

  // Speak text using browser's SpeechSynthesis (more reliable than Eleven Labs for demo)
  const speakText = useCallback((text) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    setIsPlaying(true);
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to find a female voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => 
      v.name.toLowerCase().includes('female') || 
      v.name.toLowerCase().includes('samantha') ||
      v.name.toLowerCase().includes('victoria') ||
      v.name.toLowerCase().includes('karen')
    );
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    
    utterance.onend = () => {
      setIsPlaying(false);
    };
    
    utterance.onerror = () => {
      setIsPlaying(false);
    };
    
    window.speechSynthesis.speak(utterance);
  }, []);

  // Play audio from URL or base64 (Eleven Labs) - fallback to browser TTS
  const playAudio = useCallback((audioUrl, text) => {
    // If we have text, use browser TTS (more reliable)
    if (text) {
      speakText(text);
      return;
    }
    
    if (!audioUrl) {
      console.warn('No audio URL provided');
      return;
    }
    
    setIsPlaying(true);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    audio.onended = () => {
      setIsPlaying(false);
    };
    
    audio.onerror = () => {
      setIsPlaying(false);
      console.error('Audio playback error, falling back to browser TTS');
    };

    audio.play().catch((err) => {
      console.error('Failed to play audio:', err);
      setIsPlaying(false);
    });
  }, [speakText]);

  // Stop audio playback (both browser TTS and audio element)
  const stopAudio = useCallback(() => {
    // Stop browser speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    // Stop audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Start recording user's voice
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Microphone access denied');
      console.error('Failed to start recording:', err);
    }
  }, []);

  // Stop recording and process speech
  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        
        // Create blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Use Web Speech API for transcription (client-side)
        // For production, you'd send this to Eleven Labs or another STT service
        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    });
  }, []);

  // End the current session
  const endSession = useCallback(async () => {
    if (sessionId) {
      try {
        await api.endSession(sessionId);
      } catch (err) {
        console.error('Error ending session:', err);
      }
    }
    
    stopAudio();
    setSessionId(null);
    setMessages([]);
    setError(null);
  }, [sessionId, stopAudio]);

  // Save current session
  const saveSession = useCallback(async () => {
    if (!sessionId || messages.length === 0) {
      setError('No session to save');
      return;
    }

    try {
      return await api.saveSession({
        session_id: sessionId,
        interview_type: settings.interviewType,
        messages: messages,
        problem: settings.problemDescription,
      });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [sessionId, messages, settings]);

  // Analyze current session
  const analyzeSession = useCallback(async () => {
    if (messages.length < 2) {
      setError('Not enough conversation to analyze');
      return;
    }

    setIsLoading(true);
    try {
      return await api.analyzeSession({
        session_id: sessionId || 'manual',
        messages: messages,
        interview_type: settings.interviewType,
      });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, messages, settings]);

  // Update settings
  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  return {
    // State
    sessionId,
    messages,
    isLoading,
    isRecording,
    isPlaying,
    error,
    settings,
    isSessionActive: !!sessionId,

    // Actions
    startSession,
    sendResponse,
    endSession,
    saveSession,
    analyzeSession,
    startRecording,
    stopRecording,
    playAudio,
    stopAudio,
    updateSettings,
    clearError: () => setError(null),
  };
}

export default useVoiceAgent;
