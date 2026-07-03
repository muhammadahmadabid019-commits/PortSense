import { create } from 'zustand';
import { api } from './authStore';

interface Stats {
  total_devices: number;
  total_interfaces: number;
  monitored_interfaces: number;
  active_alerts: number;
}

interface StatsState {
  stats: Stats | null;
  loading: boolean;
  fetchStats: () => Promise<void>;
}

export const useStatsStore = create<StatsState>((set) => ({
  stats: null,
  loading: false,
  
  fetchStats: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/stats');
      set({ stats: res.data, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  }
}));
