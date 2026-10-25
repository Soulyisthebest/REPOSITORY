import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '../types';

interface UseChatSocketOptions {
  matchId: string;
  userId: string;
  role: 'tenant' | 'landlord';
  onMessageReceived?: (msg: ChatMessage) => void;
  onLandlordFirstMessageSent?: () => void;
}

export function useChatSocket({
  matchId,
  userId,
  role,
  onMessageReceived,
  onLandlordFirstMessageSent,
}: UseChatSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  // Send JSON over WebSocket safely
  const sendSocketJson = useCallback((data: any): boolean => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify(data));
        return true;
      } catch (err) {
        console.warn('[CHAT_WS_SEND_FAILED]', err);
      }
    }
    return false;
  }, []);

  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/chat`;

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setIsConnected(true);

        // Join match room
        sendSocketJson({
          type: 'join',
          matchId,
          userId,
          role,
        });
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          handleIncomingMessage(data);
        } catch (err) {
          console.warn('[CHAT_WS_PARSE_ERROR]', err);
        }
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        setIsConnected(false);
        // Exponential reconnect after 2 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            connect();
          }
        }, 2000);
      };

      ws.onerror = () => {
        if (!isMountedRef.current) return;
        setIsConnected(false);
      };
    } catch (err) {
      console.warn('[CHAT_WS_CONN_ERROR]', err);
    }
  }, [matchId, userId, role, sendSocketJson]);

  const handleIncomingMessage = (data: any) => {
    const { type } = data;

    switch (type) {
      case 'new_message': {
        if (data.matchId === matchId && data.message) {
          const raw = data.message;
          const incoming: ChatMessage = {
            id: raw.id,
            match_id: raw.match_id,
            sender_id: raw.sender_id,
            sender_role: raw.sender_role || (role === 'landlord' ? 'tenant' : 'landlord'),
            content: raw.content,
            created_at: raw.created_at,
            read_at: raw.read_at,
          };

          if (onMessageReceived) {
            onMessageReceived(incoming);
          }

          if (data.landlord_first_message_sent && onLandlordFirstMessageSent) {
            onLandlordFirstMessageSent();
          }
        }
        break;
      }

      case 'joined': {
        if (data.landlord_first_message_sent && onLandlordFirstMessageSent) {
          onLandlordFirstMessageSent();
        }
        break;
      }

      case 'user_typing': {
        if (data.matchId === matchId && data.senderRole !== role) {
          setIsOtherTyping(Boolean(data.isTyping));

          if (data.isTyping) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
              setIsOtherTyping(false);
            }, 3500);
          }
        }
        break;
      }

      case 'pong':
        break;

      default:
        break;
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    // Ping interval to maintain connection alive
    const pingInterval = setInterval(() => {
      sendSocketJson({ type: 'ping' });
    }, 20000);

    return () => {
      isMountedRef.current = false;
      clearInterval(pingInterval);
      clearTimeout(reconnectTimeoutRef.current);
      clearTimeout(typingTimeoutRef.current);

      if (socketRef.current) {
        sendSocketJson({ type: 'leave', matchId });
        socketRef.current.close();
      }
    };
  }, [connect, matchId, sendSocketJson]);

  // Public methods
  const sendInstantMessage = useCallback(
    (content: string) => {
      return sendSocketJson({
        type: 'send_message',
        matchId,
        content,
        senderId: userId,
        senderRole: role,
      });
    },
    [matchId, userId, role, sendSocketJson]
  );

  const notifyTyping = useCallback(
    (isTyping: boolean) => {
      sendSocketJson({
        type: 'typing',
        matchId,
        senderRole: role,
        isTyping,
      });
    },
    [matchId, role, sendSocketJson]
  );

  const markAsRead = useCallback(() => {
    sendSocketJson({
      type: 'mark_read',
      matchId,
      userId,
    });
  }, [matchId, userId, sendSocketJson]);

  return {
    isConnected,
    isOtherTyping,
    sendInstantMessage,
    notifyTyping,
    markAsRead,
  };
}
