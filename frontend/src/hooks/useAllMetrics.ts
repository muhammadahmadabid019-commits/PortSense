import { useEffect, useRef } from 'react';
import { useMetricsStore } from '../store/metricsStore';

/**
 * Subscribes to WebSocket streams for every interface ID provided.
 * Automatically opens/closes connections as the list changes.
 * Pushes received metric points into the metricsStore.
 */
export const useAllMetrics = (interfaceIds: string[]) => {
  const pushMetric = useMetricsStore((s) => s.pushMetric);
  const wsMapRef = useRef<Record<string, WebSocket>>({});
  const timeoutMapRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const active = new Set(interfaceIds);
    const existing = new Set([...Object.keys(wsMapRef.current), ...Object.keys(timeoutMapRef.current)]);

    // Close sockets and clear timeouts for removed interfaces
    existing.forEach((id) => {
      if (!active.has(id)) {
        clearTimeout(timeoutMapRef.current[id]);
        delete timeoutMapRef.current[id];
        wsMapRef.current[id]?.close();
        delete wsMapRef.current[id];
      }
    });

    // Open sockets for new interfaces
    interfaceIds.forEach((id) => {
      if (wsMapRef.current[id] || timeoutMapRef.current[id]) return; // already connected or pending

      const explicitBase = import.meta.env.VITE_WS_URL as string | undefined;
      const wsBase = explicitBase
        ? explicitBase
        : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;

      // Delay creation slightly to prevent React StrictMode from immediately closing a connecting socket
      timeoutMapRef.current[id] = window.setTimeout(() => {
        delete timeoutMapRef.current[id]; // Clear pending status
        const ws = new WebSocket(`${wsBase}/ws/metrics/${id}`);

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            pushMetric(id, {
              time: data.time,
              in_bps: data.in_bps,
              out_bps: data.out_bps,
            });
          } catch (err) {
            console.error('Failed to parse WS message for', id, err);
          }
        };

        ws.onerror = (err) => console.error('WS error for interface', id, err);

        wsMapRef.current[id] = ws;
      }, 50);
    });
  }, [interfaceIds, pushMetric]);

  // Cleanup all on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutMapRef.current).forEach((t) => clearTimeout(t));
      Object.values(wsMapRef.current).forEach((ws) => ws.close());
      wsMapRef.current = {};
      timeoutMapRef.current = {};
    };
  }, []);
};
