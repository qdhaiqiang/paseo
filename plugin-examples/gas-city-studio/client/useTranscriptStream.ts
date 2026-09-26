import { useEffect, useRef, useCallback } from "react";
import type { StructuredMessage, TurnEvent } from "./api/supervisor";

interface UseTranscriptStreamOptions {
  sessionId: string | null;
  baseUrl: string;
  city: string;
  onMessageReceived?: (message: StructuredMessage) => void;
  onTurnStarted?: (event: TurnEvent) => void;
  onTurnCompleted?: (event: TurnEvent) => void;
  onTurnFailed?: (event: TurnEvent) => void;
}

export function useTranscriptStream({
  sessionId,
  baseUrl,
  city,
  onMessageReceived,
  onTurnStarted,
  onTurnCompleted,
  onTurnFailed,
}: UseTranscriptStreamOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const cursorRef = useRef<string | undefined>(undefined);

  const connect = useCallback(() => {
    if (!sessionId) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `${baseUrl}/v0/city/${city}/session/${sessionId}/transcript/stream${
      cursorRef.current ? `?cursor=${cursorRef.current}` : ""
    }`;

    console.log("[TranscriptStream] Connecting to:", url);

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      console.log("[TranscriptStream] Connected");
    };

    es.onerror = (error) => {
      console.error("[TranscriptStream] Error:", error);
      
      // Auto-reconnect after 3 seconds
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("[TranscriptStream] Reconnecting...");
        connect();
      }, 3000);
    };

    // Listen for structured messages
    es.addEventListener("structured", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        
        // Update cursor
        const lastEventId = (event as MessageEvent).lastEventId;
        if (lastEventId) {
          cursorRef.current = lastEventId;
        }

        // Handle upsert operation
        if (data.operation === "upsert" || data.operation === "snapshot") {
          const messages = data.structured_messages || [];
          messages.forEach((msg: StructuredMessage) => {
            onMessageReceived?.(msg);
          });
        }
      } catch (err) {
        console.error("[TranscriptStream] Failed to parse structured event:", err);
      }
    });

    // Listen for turn lifecycle events
    es.addEventListener("turn.started", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as TurnEvent;
        console.log("[TranscriptStream] Turn started:", data.turn_id);
        onTurnStarted?.(data);
      } catch (err) {
        console.error("[TranscriptStream] Failed to parse turn.started:", err);
      }
    });

    es.addEventListener("turn.completed", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as TurnEvent;
        console.log("[TranscriptStream] Turn completed:", data.turn_id);
        onTurnCompleted?.(data);
      } catch (err) {
        console.error("[TranscriptStream] Failed to parse turn.completed:", err);
      }
    });

    es.addEventListener("turn.failed", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as TurnEvent;
        console.error("[TranscriptStream] Turn failed:", data.turn_id, data.error_message);
        onTurnFailed?.(data);
      } catch (err) {
        console.error("[TranscriptStream] Failed to parse turn.failed:", err);
      }
    });

    // Listen for activity events
    es.addEventListener("activity", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        console.log("[TranscriptStream] Activity:", data);
      } catch (err) {
        console.error("[TranscriptStream] Failed to parse activity:", err);
      }
    });

  }, [sessionId, baseUrl, city, onMessageReceived, onTurnStarted, onTurnCompleted, onTurnFailed]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log("[TranscriptStream] Disconnecting");
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connect,
    disconnect,
    cursor: cursorRef.current,
  };
}
