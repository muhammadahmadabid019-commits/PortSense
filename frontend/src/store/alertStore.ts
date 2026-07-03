import { create } from 'zustand';
import { api } from './authStore';

export interface Alert {
  id: string;
  message: string;
  severity: string;
  created_at: string;
  is_resolved: boolean;
  device_id: string | null;
}

interface AlertState {
  alerts: Alert[];
  loading: boolean;
  fetchAlerts: () => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  loading: false,
  
  fetchAlerts: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/alerts');
      set({ alerts: res.data, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },
  
  resolveAlert: async (alertId: string) => {
    await api.post(`/alerts/${alertId}/resolve`);
    get().fetchAlerts();
  }
}));
