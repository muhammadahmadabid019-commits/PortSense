import { create } from 'zustand';
import { api } from './authStore';

export interface Device {
  id: string;
  name: string;
  ip_address: string;
  snmp_version: string;
  status: string;
}

export interface Interface {
  id: string;
  device_id: string;
  if_index: number;
  if_name: string;
  if_alias: string;
  if_speed: number;
  is_monitored: boolean;
}

interface DeviceState {
  devices: Device[];
  interfaces: Record<string, Interface[]>;
  fetchDevices: () => Promise<void>;
  fetchInterfaces: (deviceId: string) => Promise<void>;
  fetchAllInterfaces: () => Promise<void>;
  addDevice: (device: Partial<Device>) => Promise<void>;
  deleteDevice: (deviceId: string) => Promise<void>;
  discoverInterfaces: (deviceId: string) => Promise<void>;
  toggleMonitor: (interfaceId: string, isMonitored: boolean, deviceId: string) => Promise<void>;
}



export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [],
  interfaces: {},
  
  fetchDevices: async () => {
    const res = await api.get('/devices');
    set({ devices: res.data });
  },

  fetchInterfaces: async (deviceId) => {
    const res = await api.get(`/interfaces/device/${deviceId}`);
    set((state) => ({
      interfaces: { ...state.interfaces, [deviceId]: res.data },
    }));
  },

  fetchAllInterfaces: async () => {
    const { devices, fetchInterfaces } = get();
    await Promise.all(devices.map((d) => fetchInterfaces(d.id)));
  },
  
  addDevice: async (device) => {
    await api.post('/devices', device);
    get().fetchDevices();
  },
  
  deleteDevice: async (deviceId) => {
    await api.delete(`/devices/${deviceId}`);
    get().fetchDevices();
  },
  
  discoverInterfaces: async (deviceId) => {
    const res = await api.post(`/devices/${deviceId}/discover`);
    set((state) => ({
      interfaces: { ...state.interfaces, [deviceId]: res.data }
    }));
  },
  
  toggleMonitor: async (interfaceId, isMonitored, deviceId) => {
    const res = await api.put(`/interfaces/${interfaceId}`, { is_monitored: isMonitored });
    
    // update state
    set((state) => {
      const deviceInterfaces = state.interfaces[deviceId] || [];
      const updated = deviceInterfaces.map(iface => 
        iface.id === interfaceId ? { ...iface, is_monitored: res.data.is_monitored } : iface
      );
      return {
        interfaces: { ...state.interfaces, [deviceId]: updated }
      };
    });
  }
}));
