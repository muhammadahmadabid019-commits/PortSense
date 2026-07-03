import { create } from 'zustand';

export interface MetricPoint {
  time: string;
  in_bps: number;
  out_bps: number;
  [key: string]: number | string;
}

// Per-interface rolling window (max 60 points)
type InterfaceMetrics = Record<string, MetricPoint[]>;

interface MetricsState {
  metrics: InterfaceMetrics;
  pushMetric: (interfaceId: string, point: MetricPoint) => void;
  clearMetrics: (interfaceId: string) => void;
  getInterfaceMetrics: (interfaceId: string) => MetricPoint[];
}

const MAX_POINTS = 60;

export const useMetricsStore = create<MetricsState>((set, get) => ({
  metrics: {},

  pushMetric: (interfaceId, point) => {
    set((state) => {
      const existing = state.metrics[interfaceId] ?? [];
      const updated = [...existing, point];
      if (updated.length > MAX_POINTS) updated.shift();
      return {
        metrics: { ...state.metrics, [interfaceId]: updated },
      };
    });
  },

  clearMetrics: (interfaceId) => {
    set((state) => {
      const next = { ...state.metrics };
      delete next[interfaceId];
      return { metrics: next };
    });
  },

  getInterfaceMetrics: (interfaceId) => {
    return get().metrics[interfaceId] ?? [];
  },
}));
