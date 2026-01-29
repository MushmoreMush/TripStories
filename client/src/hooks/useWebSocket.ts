import { useEffect, useRef, useState, useCallback } from "react";
import type { ChannelMessageWithUser } from "@shared/schema";

interface WebSocketMessage {
  type: "connected" | "subscribed" | "unsubscribed" | "new_message" | "user_joined" | "user_left" | "error" | "pong";
  channelId?: number;
  data?: ChannelMessageWithUser;
  userId?: string;
  message?: string;
}

interface UseWebSocketOptions {
  userId: string | undefined;
  channelId: number | null;
  onNewMessage?: (message: ChannelMessageWithUser) => void;
  enabled?: boolean;
}

export function useWebSocket({ userId, channelId, onNewMessage, enabled = true }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!userId || !enabled) return;

    // Don't reconnect if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${encodeURIComponent(userId)}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;

        // Subscribe to channel if specified
        if (channelId) {
          ws.send(JSON.stringify({ type: "subscribe", channelId }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case "new_message":
              if (message.data && onNewMessage) {
                onNewMessage(message.data);
              }
              break;
            case "error":
              console.error("WebSocket error:", message.message);
              break;
          }
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect unless closed intentionally
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = () => {
        setConnectionError("Connection error");
      };

      wsRef.current = ws;
    } catch (error) {
      setConnectionError("Failed to connect");
    }
  }, [userId, channelId, onNewMessage, enabled]);

  // Connect on mount and when dependencies change
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounting");
        wsRef.current = null;
      }
    };
  }, [connect]);

  // Subscribe to new channel when channelId changes
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && channelId) {
      wsRef.current.send(JSON.stringify({ type: "subscribe", channelId }));
    }
  }, [channelId]);

  const sendMessage = useCallback((type: string, data?: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...data }));
    }
  }, []);

  return {
    isConnected,
    connectionError,
    sendMessage,
  };
}
