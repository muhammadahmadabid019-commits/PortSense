import { useEffect, useRef } from 'react';

/**
 * Opens a WebSocket to receive live bandwidth metrics for a given interface.
 *
 * The `onMessage` callback is intentionally stored in a ref so that it never
 * appears in the useEffect dependency array.  Without this, a new function
 * reference on each render (e.g. from useCallback in the parent) would
 * repeatedly close and re-open the socket, creating an infinite loop.
 */
export const useWebSocket = (interfaceId: string, onMessage: (data: any) => void) => {
  const wsRef       = useRef<WebSocket | null>(null);
  const callbackRef = useRef(onMessage);

  // Keep the ref current without re-triggering the effect
  useEffect(() => {
    callbackRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!interfaceId) return;

    const explicitBase = import.meta.env.VITE_WS_URL as string | undefined;
    const wsBase = explicitBase
      ? explicitBase
      : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
    wsRef.current = new WebSocket(`${wsBase}/ws/metrics/${interfaceId}`);

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callbackRef.current(data);
      } catch (err) {
        console.error('Failed to parse WS message', err);
      }
    };

    wsRef.current.onerror = (err) => {
      console.error('WebSocket error', err);
    };

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [interfaceId]); // ← onMessage intentionally excluded; handled via ref
};
