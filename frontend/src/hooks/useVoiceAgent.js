/**
 * Voice Agent Hook - Manages voice interview state and interactions
 */

import { useState, useCallback, useRef, useEffect } from 'react';
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
  const selectedVoiceRef = useRef(null);
  const contextProviderRef = useRef(null);  // Tabs can register a function to provide context

  // Preload voices on mount - voices load asynchronously in browsers
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      if (voices.length > 0) {
        // Find a female voice
        const femaleVoice = voices.find(v => 
          v.name.toLowerCase().includes('samantha') ||  // macOS
          v.name.toLowerCase().includes('victoria') ||  // macOS
          v.name.toLowerCase().includes('karen') ||     // macOS Australian
          v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('zira') ||      // Windows
          v.name.toLowerCase().includes('hazel') ||     // Windows UK
          v.name.toLowerCase().includes('susan')        // Windows UK
        );
        selectedVoiceRef.current = femaleVoice || voices[0];
        console.log('Selected voice:', selectedVoiceRef.current?.name);
      }
    };

    // Load voices immediately if available
    loadVoices();
    
    // Also listen for voiceschanged event (fires when voices are loaded)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Speak text using browser's SpeechSynthesis (fallback)
  const speakWithBrowser = useCallback((text) => {
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
    
    // Use preloaded female voice
    if (selectedVoiceRef.current) {
      utterance.voice = selectedVoiceRef.current;
    }
    
    utterance.onend = () => {
      setIsPlaying(false);
    };
    
    utterance.onerror = () => {
      setIsPlaying(false);
    };
    
    window.speechSynthesis.speak(utterance);
  }, []);

  // Play Eleven Labs audio from base64 data URL
  const playElevenLabsAudio = useCallback((audioUrl, fallbackText) => {
    if (!audioUrl) {
      console.log('No audio URL, falling back to browser TTS');
      if (fallbackText) speakWithBrowser(fallbackText);
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
    
    audio.onerror = (e) => {
      console.error('Eleven Labs audio error, falling back to browser TTS:', e);
      setIsPlaying(false);
      if (fallbackText) speakWithBrowser(fallbackText);
    };

    audio.play()
      .then(() => console.log('Playing Eleven Labs audio'))
      .catch((err) => {
        console.error('Failed to play Eleven Labs audio:', err);
        setIsPlaying(false);
        if (fallbackText) speakWithBrowser(fallbackText);
      });
  }, [speakWithBrowser]);

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

      // Play Eleven Labs audio (with browser TTS fallback)
      playElevenLabsAudio(response.audio_url, response.opening_text);

      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [settings, playElevenLabsAudio]);

  // Allow tabs to register a context provider function
  const setContextProvider = useCallback((providerFn) => {
    contextProviderRef.current = providerFn;
  }, []);

  // Clear context provider (when switching tabs)
  const clearContextProvider = useCallback(() => {
    contextProviderRef.current = null;
  }, []);

  // Send user response and get AI reply
  const sendResponse = useCallback(async (userMessage, context = null) => {
    if (!sessionId) {
      setError('No active session');
      return;
    }

    setIsLoading(true);
    setError(null);

    // If no context provided, try to get it from the registered context provider
    const finalContext = context ?? (contextProviderRef.current ? contextProviderRef.current() : null);

    // Add user message immediately (show just the message in chat, context is sent to backend)
    const userMsg = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await api.respond(sessionId, userMessage, finalContext);

      // Add interviewer response
      const interviewerMsg = {
        role: 'interviewer',
        content: response.response_text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, interviewerMsg]);

      // Play Eleven Labs audio (with browser TTS fallback)
      playElevenLabsAudio(response.audio_url, response.response_text);

      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, playElevenLabsAudio]);

  // Play audio - wrapper for playElevenLabsAudio
  const playAudio = useCallback((audioUrl, text) => {
    playElevenLabsAudio(audioUrl, text);
  }, [playElevenLabsAudio]);

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
    setContextProvider,
    clearContextProvider,
    clearError: () => setError(null),
  };
}

export default useVoiceAgent;
