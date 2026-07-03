import { useEffect, useState } from 'react';
import { useDeviceStore } from '../../store/deviceStore';
import { Plus, Server, Activity, Trash2 } from 'lucide-react';
import { InterfaceList } from './InterfaceList';

export const DeviceList = () => {
  const { devices, fetchDevices, addDevice, deleteDevice } = useDeviceStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: '', ip_address: '', snmp_community: 'public' });
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDevice(newDevice);
    setShowAdd(false);
    setNewDevice({ name: '', ip_address: '', snmp_community: 'public' });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-100">
          <Server className="text-cyan-400" size={32} />
          Network Devices
        </h1>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={20} /> Add Device
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-slate-900 p-6 rounded-xl border border-slate-800 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Name</label>
            <input 
              required
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 focus:border-cyan-500 outline-none text-slate-200"
              value={newDevice.name} 
              onChange={e => setNewDevice({...newDevice, name: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">IP Address</label>
            <input 
              required
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 focus:border-cyan-500 outline-none text-slate-200"
              value={newDevice.ip_address} 
              onChange={e => setNewDevice({...newDevice, ip_address: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">SNMP Community</label>
            <input 
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 focus:border-cyan-500 outline-none text-slate-200"
              value={newDevice.snmp_community} 
              onChange={e => setNewDevice({...newDevice, snmp_community: e.target.value})} 
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 p-2 rounded font-medium">
              Save Device
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
        <div className="col-span-1 space-y-4 overflow-auto pr-2">
          {devices.map(device => (
            <div 
              key={device.id} 
              onClick={() => setSelectedDevice(device.id)}
              className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedDevice === device.id ? 'bg-slate-800 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-slate-200">{device.name}</h3>
                <div className="flex items-center gap-3">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if(window.confirm(`Are you sure you want to delete ${device.name}?`)) {
                        deleteDevice(device.id);
                        if (selectedDevice === device.id) setSelectedDevice(null);
                      }
                    }}
                    className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-slate-400 font-mono text-sm">{device.ip_address}</p>
            </div>
          ))}
          {devices.length === 0 && (
            <div className="text-center p-8 border border-dashed border-slate-700 rounded-xl text-slate-500">
              No devices added yet.
            </div>
          )}
        </div>
        
        <div className="col-span-1 lg:col-span-2 h-full">
          {selectedDevice ? (
            <InterfaceList deviceId={selectedDevice} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
              <Activity size={48} className="mb-4 opacity-50" />
              <p>Select a device to view its interfaces</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
