import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

export interface SessionStats {
  sessionId: string | null;
  totalActiveSeconds: number;
  totalIdleSeconds: number;
  isTracking: boolean;
}

const IDLE_THRESHOLD_MS = 60 * 1000; // 60 seconds without interaction considered idle
const HEARTBEAT_INTERVAL_MS = 20 * 1000; // Heartbeat every 20 seconds

export function useSessionTracker(currentUserId?: string | null, currentUserEmail?: string | null) {
  const [stats, setStats] = useState<SessionStats>({
    sessionId: localStorage.getItem('rentia_session_id'),
    totalActiveSeconds: 0,
    totalIdleSeconds: 0,
    isTracking: false,
  });

  const lastActivityRef = useRef<number>(Date.now());
  const activeDeltaRef = useRef<number>(0);
  const idleDeltaRef = useRef<number>(0);
  const sessionIdRef = useRef<string | null>(localStorage.getItem('rentia_session_id'));

  // Keep sessionIdRef updated
  useEffect(() => {
    const stored = localStorage.getItem('rentia_session_id');
    sessionIdRef.current = stored;
    setStats((prev) => ({ ...prev, sessionId: stored }));
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId && !sessionIdRef.current) {
      return;
    }

    // Ensure we have a valid session ID for the user
    if (!sessionIdRef.current) {
      const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionIdRef.current = newSessionId;
      localStorage.setItem('rentia_session_id', newSessionId);
      setStats((prev) => ({ ...prev, sessionId: newSessionId, isTracking: true }));
    } else {
      setStats((prev) => ({ ...prev, isTracking: true }));
    }

    // Track user input / interaction
    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));

    // 1-second ticker to increment active or idle seconds
    const secondTicker = window.setInterval(() => {
      const now = Date.now();
      const isIdle = now - lastActivityRef.current > IDLE_THRESHOLD_MS;

      if (isIdle) {
        idleDeltaRef.current += 1;
        setStats((prev) => ({ ...prev, totalIdleSeconds: prev.totalIdleSeconds + 1 }));
      } else {
        activeDeltaRef.current += 1;
        setStats((prev) => ({ ...prev, totalActiveSeconds: prev.totalActiveSeconds + 1 }));
      }
    }, 1000);

    // Heartbeat ticker to sync with backend
    const heartbeatTicker = window.setInterval(async () => {
      const currentSessionId = sessionIdRef.current || localStorage.getItem('rentia_session_id');
      if (!currentSessionId) return;

      const activeToSend = activeDeltaRef.current;
      const idleToSend = idleDeltaRef.current;

      // Reset deltas before sending to avoid race conditions
      activeDeltaRef.current = 0;
      idleDeltaRef.current = 0;

      try {
        await api.auth.sendHeartbeat({
          sessionId: currentSessionId,
          activeDeltaSeconds: activeToSend,
          idleDeltaSeconds: idleToSend,
          currentPage: window.location.pathname || '/',
        });
      } catch (err) {
        // If request fails, put back deltas so they are sent next round
        activeDeltaRef.current += activeToSend;
        idleDeltaRef.current += idleToSend;
      }
    }, HEARTBEAT_INTERVAL_MS);

    // Final heartbeat on page hide or tab close
    const handlePageHide = () => {
      const currentSessionId = sessionIdRef.current || localStorage.getItem('rentia_session_id');
      if (!currentSessionId) return;

      const activeToSend = activeDeltaRef.current;
      const idleToSend = idleDeltaRef.current;

      const payload = JSON.stringify({
        sessionId: currentSessionId,
        activeDeltaSeconds: activeToSend,
        idleDeltaSeconds: idleToSend,
        currentPage: window.location.pathname || '/',
      });

      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/auth/session/heartbeat', blob);
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
      clearInterval(secondTicker);
      clearInterval(heartbeatTicker);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
    };
  }, [currentUserId, currentUserEmail]);

  return stats;
}
