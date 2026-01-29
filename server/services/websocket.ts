import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { ChannelMessageWithUser } from "@shared/schema";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  channelId?: number;
  isAlive: boolean;
}

interface WebSocketMessage {
  type: "subscribe" | "unsubscribe" | "message" | "ping";
  channelId?: number;
  content?: string;
}

interface BroadcastMessage {
  type: "new_message" | "user_joined" | "user_left" | "error";
  channelId: number;
  data?: ChannelMessageWithUser;
  userId?: string;
  message?: string;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, AuthenticatedWebSocket> = new Map();
  private channelSubscribers: Map<number, Set<string>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  initialize(httpServer: Server) {
    this.wss = new WebSocketServer({
      server: httpServer,
      path: "/ws",
      verifyClient: (info, callback) => {
        // Allow connections (authentication handled after connection)
        callback(true);
      }
    });

    this.wss.on("connection", (ws: AuthenticatedWebSocket, req) => {
      ws.isAlive = true;

      // Parse user ID from query or session cookie
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      const userId = url.searchParams.get("userId");

      if (!userId) {
        ws.send(JSON.stringify({ type: "error", message: "Authentication required" }));
        ws.close(1008, "Authentication required");
        return;
      }

      ws.userId = userId;
      this.clients.set(userId, ws);

      console.log(`WebSocket client connected: ${userId}`);

      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("message", (data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error("WebSocket message parse error:", error);
          ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
        }
      });

      ws.on("close", () => {
        if (ws.userId) {
          this.clients.delete(ws.userId);
          // Remove from all channel subscriptions
          this.channelSubscribers.forEach((subscribers, channelId) => {
            if (subscribers.has(ws.userId!)) {
              subscribers.delete(ws.userId!);
              this.broadcastToChannel(channelId, {
                type: "user_left",
                channelId,
                userId: ws.userId,
              });
            }
          });
        }
        console.log(`WebSocket client disconnected: ${ws.userId}`);
      });

      ws.on("error", (error) => {
        console.error(`WebSocket error for ${ws.userId}:`, error);
      });

      // Send confirmation
      ws.send(JSON.stringify({ type: "connected", userId }));
    });

    // Heartbeat to detect stale connections
    this.heartbeatInterval = setInterval(() => {
      this.wss?.clients.forEach((ws) => {
        const authWs = ws as AuthenticatedWebSocket;
        if (!authWs.isAlive) {
          return authWs.terminate();
        }
        authWs.isAlive = false;
        authWs.ping();
      });
    }, 30000);

    console.log("WebSocket server initialized");
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (!ws.userId) return;

    switch (message.type) {
      case "subscribe":
        if (message.channelId) {
          this.subscribeToChannel(ws.userId, message.channelId);
          ws.channelId = message.channelId;
          ws.send(JSON.stringify({
            type: "subscribed",
            channelId: message.channelId
          }));
        }
        break;

      case "unsubscribe":
        if (message.channelId) {
          this.unsubscribeFromChannel(ws.userId, message.channelId);
          if (ws.channelId === message.channelId) {
            ws.channelId = undefined;
          }
          ws.send(JSON.stringify({
            type: "unsubscribed",
            channelId: message.channelId
          }));
        }
        break;

      case "ping":
        ws.send(JSON.stringify({ type: "pong" }));
        break;

      default:
        ws.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
    }
  }

  private subscribeToChannel(userId: string, channelId: number) {
    if (!this.channelSubscribers.has(channelId)) {
      this.channelSubscribers.set(channelId, new Set());
    }
    this.channelSubscribers.get(channelId)!.add(userId);

    this.broadcastToChannel(channelId, {
      type: "user_joined",
      channelId,
      userId,
    });
  }

  private unsubscribeFromChannel(userId: string, channelId: number) {
    const subscribers = this.channelSubscribers.get(channelId);
    if (subscribers) {
      subscribers.delete(userId);
      this.broadcastToChannel(channelId, {
        type: "user_left",
        channelId,
        userId,
      });
    }
  }

  // Broadcast a new message to all subscribers of a channel
  broadcastNewMessage(channelId: number, message: ChannelMessageWithUser) {
    this.broadcastToChannel(channelId, {
      type: "new_message",
      channelId,
      data: message,
    });
  }

  private broadcastToChannel(channelId: number, payload: BroadcastMessage) {
    const subscribers = this.channelSubscribers.get(channelId);
    if (!subscribers) return;

    const message = JSON.stringify(payload);

    subscribers.forEach((userId) => {
      const client = this.clients.get(userId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Get online users in a channel
  getChannelOnlineUsers(channelId: number): string[] {
    const subscribers = this.channelSubscribers.get(channelId);
    return subscribers ? Array.from(subscribers) : [];
  }

  // Close all connections
  shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.wss?.close();
  }
}

export const wsService = new WebSocketService();
