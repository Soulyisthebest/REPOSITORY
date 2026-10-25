import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';
import { RentiaDB, ChatMessageRecord } from './db/database';
import { isSupabaseConfigured, getSupabase } from './supabase';

interface ClientContext {
  ws: WebSocket;
  userId?: string;
  role?: 'tenant' | 'landlord' | 'admin';
  activeMatchId?: string;
  isAlive: boolean;
}

// Rooms mapped by matchId -> Set of WebSockets
const matchRooms = new Map<string, Set<WebSocket>>();

// User sockets mapped by userId -> Set of WebSockets
const userSockets = new Map<string, Set<WebSocket>>();

// Socket to client context
const clientContexts = new Map<WebSocket, ClientContext>();

let wssInstance: WebSocketServer | null = null;

export function setupWebSocketServer(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws/chat' });
  wssInstance = wss;

  console.log('[WEBSOCKET] Rentia Real-Time Chat WebSocket Server mounted on /ws/chat');

  // Heartbeat interval to clean up stale connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const ctx = clientContexts.get(ws);
      if (!ctx) return;
      if (!ctx.isAlive) {
        cleanUpSocket(ws);
        ws.terminate();
        return;
      }
      ctx.isAlive = false;
      try {
        ws.ping();
      } catch {
        cleanUpSocket(ws);
      }
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  wss.on('connection', (ws: WebSocket, req) => {
    const ctx: ClientContext = {
      ws,
      isAlive: true,
    };
    clientContexts.set(ws, ctx);

    ws.on('pong', () => {
      ctx.isAlive = true;
    });

    ws.on('message', (raw) => {
      ctx.isAlive = true;
      try {
        const text = raw.toString();
        const data = JSON.parse(text);
        handleClientMessage(ws, ctx, data);
      } catch (err: any) {
        console.warn('[WEBSOCKET_PARSE_ERROR]', err?.message);
      }
    });

    ws.on('close', () => {
      cleanUpSocket(ws);
    });

    ws.on('error', (err) => {
      console.warn('[WEBSOCKET_ERROR]', err?.message);
      cleanUpSocket(ws);
    });

    // Send welcome ack
    sendJson(ws, {
      type: 'connected',
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Conexión instantánea en tiempo real establecida con Rentia Chat Server',
    });
  });

  return wss;
}

function handleClientMessage(ws: WebSocket, ctx: ClientContext, data: any) {
  const { type } = data;

  switch (type) {
    case 'join': {
      // User joins a match chat room
      const { matchId, userId, role } = data;
      if (!matchId) return;

      // Leave old room if any
      if (ctx.activeMatchId && ctx.activeMatchId !== matchId) {
        const oldRoom = matchRooms.get(ctx.activeMatchId);
        oldRoom?.delete(ws);
      }

      ctx.activeMatchId = matchId;
      ctx.userId = userId || ctx.userId;
      ctx.role = role || ctx.role;

      if (!matchRooms.has(matchId)) {
        matchRooms.set(matchId, new Set());
      }
      matchRooms.get(matchId)!.add(ws);

      // Register user socket
      if (userId) {
        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set());
        }
        userSockets.get(userId)!.add(ws);
      }

      // Check current match state for landlord_first_message_sent
      const match = RentiaDB.getMatchById(matchId);
      const landlordFirstSent = Boolean(match?.landlord_first_message_sent);

      sendJson(ws, {
        type: 'joined',
        matchId,
        landlord_first_message_sent: landlordFirstSent,
        timestamp: new Date().toISOString(),
      });
      break;
    }

    case 'leave': {
      if (ctx.activeMatchId) {
        const room = matchRooms.get(ctx.activeMatchId);
        room?.delete(ws);
        ctx.activeMatchId = undefined;
      }
      break;
    }

    case 'send_message': {
      const { matchId, content, senderId, senderRole } = data;
      if (!matchId || !content || !content.trim()) return;

      const effectiveRole: 'tenant' | 'landlord' = senderRole || ctx.role || 'tenant';
      const effectiveSenderId = senderId || ctx.userId || 'user_anonymous';

      // Rule check: if tenant sends message, ensure landlord already sent first message
      const match = RentiaDB.getMatchById(matchId);
      if (effectiveRole === 'tenant' && (!match || !match.landlord_first_message_sent)) {
        sendJson(ws, {
          type: 'error',
          code: 'LANDLORD_FIRST_MESSAGE_REQUIRED',
          message: 'El propietario debe enviar el primer mensaje antes de que puedas responder.',
        });
        return;
      }

      // If landlord sends message, unlock match for tenant
      let landlordFirstMessageSent = Boolean(match?.landlord_first_message_sent);
      if (effectiveRole === 'landlord') {
        landlordFirstMessageSent = true;
        RentiaDB.updateMatch(matchId, { landlord_first_message_sent: true });
      }

      // Save to database
      const savedMessage = RentiaDB.saveChatMessage({
        match_id: matchId,
        sender_id: effectiveSenderId,
        sender_role: effectiveRole,
        content: content.trim(),
      });

      // Broadcast instantaneously to all clients in the match room (<1ms)
      broadcastChatMessage(matchId, savedMessage, landlordFirstMessageSent);

      // Notify the recipient's user socket for external updates (e.g. MatchesListView)
      const recipientId = match ? (effectiveRole === 'landlord' ? match.tenant_id : match.landlord_id) : undefined;
      if (recipientId) {
        broadcastToUser(recipientId, {
          type: 'new_incoming_message',
          matchId,
          message: savedMessage,
          listing_title: match?.listing_title,
          sender_name: effectiveRole === 'landlord' ? match?.landlord_name : match?.tenant_name,
        });
      }
      break;
    }

    case 'typing': {
      const { matchId, senderRole, isTyping } = data;
      if (!matchId) return;

      // Broadcast typing indicator to everyone in the room except sender
      broadcastToRoom(matchId, {
        type: 'user_typing',
        matchId,
        senderRole: senderRole || ctx.role,
        senderId: ctx.userId,
        isTyping: Boolean(isTyping),
      }, ws);
      break;
    }

    case 'mark_read': {
      const { matchId, userId } = data;
      if (!matchId) return;

      RentiaDB.markChatMessagesAsRead(matchId, userId || ctx.userId || '');

      broadcastToRoom(matchId, {
        type: 'messages_read',
        matchId,
        readBy: userId || ctx.userId,
      });
      break;
    }

    case 'ping': {
      sendJson(ws, { type: 'pong' });
      break;
    }

    default:
      break;
  }
}

function cleanUpSocket(ws: WebSocket) {
  const ctx = clientContexts.get(ws);
  if (!ctx) return;

  if (ctx.activeMatchId) {
    const room = matchRooms.get(ctx.activeMatchId);
    room?.delete(ws);
    if (room && room.size === 0) {
      matchRooms.delete(ctx.activeMatchId);
    }
  }

  if (ctx.userId) {
    const uSet = userSockets.get(ctx.userId);
    uSet?.delete(ws);
    if (uSet && uSet.size === 0) {
      userSockets.delete(ctx.userId);
    }
  }

  clientContexts.delete(ws);
}

function sendJson(ws: WebSocket, payload: any) {
  if (ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify(payload));
    } catch (err: any) {
      console.warn('[WEBSOCKET_SEND_FAIL]', err?.message);
    }
  }
}

/**
 * Broadcasts an event to all participants in a match room.
 * Optionally skips the sender socket.
 */
export function broadcastToRoom(matchId: string, payload: any, skipWs?: WebSocket) {
  const room = matchRooms.get(matchId);
  if (!room) return;

  const dataStr = JSON.stringify(payload);
  room.forEach((client) => {
    if (client !== skipWs && client.readyState === WebSocket.OPEN) {
      try {
        client.send(dataStr);
      } catch (err: any) {
        console.warn('[BROADCAST_ROOM_FAIL]', err?.message);
      }
    }
  });
}

/**
 * Broadcasts an event to a specific user across any of their active connections
 */
export function broadcastToUser(userId: string, payload: any) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;

  const dataStr = JSON.stringify(payload);
  sockets.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(dataStr);
      } catch (err: any) {
        console.warn('[BROADCAST_USER_FAIL]', err?.message);
      }
    }
  });
}

/**
 * Public helper to broadcast a chat message to everyone in the match room.
 * Used both by WebSocket message handler and REST endpoint POST /api/matching/messages
 */
export function broadcastChatMessage(
  matchId: string,
  message: ChatMessageRecord,
  landlordFirstMessageSent?: boolean
) {
  broadcastToRoom(matchId, {
    type: 'new_message',
    matchId,
    message,
    landlord_first_message_sent: landlordFirstMessageSent ?? true,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast a new match notification to involved users
 */
export function broadcastMatchCreated(match: any) {
  if (match.tenant_id) {
    broadcastToUser(match.tenant_id, {
      type: 'new_match_created',
      match,
    });
  }
  if (match.landlord_id) {
    broadcastToUser(match.landlord_id, {
      type: 'new_match_created',
      match,
    });
  }
}
