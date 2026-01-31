/**
 * Session Hook - Manages saved sessions
 */

import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';

export function useSession() {
  const [savedSessions, setSavedSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load list of saved sessions
  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.listSessions();
      setSavedSessions(response.sessions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load a specific session
  const loadSession = useCallback(async (sessionId) => {
    setIsLoading(true);
    try {
      const session = await api.getSavedSession(sessionId);
      setCurrentSession(session);
      return session;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete a session
  const deleteSession = useCallback(async (sessionId) => {
    try {
      await api.deleteSavedSession?.(sessionId);
      setSavedSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
      if (currentSession?.session_id === sessionId) {
        setCurrentSession(null);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [currentSession]);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    savedSessions,
    currentSession,
    isLoading,
    error,
    loadSessions,
    loadSession,
    deleteSession,
    clearError: () => setError(null),
  };
}

export default useSession;
