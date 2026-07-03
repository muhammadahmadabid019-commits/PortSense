import { useState } from 'react';
import { useDeviceStore } from '../../store/deviceStore';
import { Search, Activity, Zap } from 'lucide-react';
import { BandwidthChart } from '../../components/BandwidthChart';

export const InterfaceList = ({ deviceId }: { deviceId: string }) => {
  const { interfaces, discoverInterfaces, toggleMonitor } = useDeviceStore();
  const [loading, setLoading] = useState(false);
  
  const deviceInterfaces = interfaces[deviceId] || [];

  const handleDiscover = async () => {
    setLoading(true);
    await discoverInterfaces(deviceId);
    setLoading(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Activity className="text-cyan-500" size={20} />
          Interfaces
        </h3>
        <button 
          onClick={handleDiscover}
          disabled={loading}
          className="flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 text-cyan-400 px-3 py-1.5 rounded-lg transition-colors border border-slate-700 disabled:opacity-50"
        >
          <Search size={16} />
          {loading ? 'Scanning...' : 'SNMP Walk'}
        </button>
      </div>
      
      <div className="p-4 flex-1 overflow-auto">
        {deviceInterfaces.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No interfaces discovered. Click SNMP Walk to scan device.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deviceInterfaces.map(iface => (
              <div 
                key={iface.id} 
                className={`p-4 rounded-lg border flex flex-col gap-2 transition-colors ${iface.is_monitored ? 'bg-slate-800 border-cyan-500/50' : 'bg-slate-950 border-slate-800'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-slate-500 font-mono mb-1">Port {iface.if_index}</div>
                    <div className="font-medium text-slate-200 truncate" title={iface.if_name}>{iface.if_name || 'Unknown'}</div>
                    <div className="text-sm text-slate-400 truncate mt-1">{iface.if_alias}</div>
                  </div>
                  <button
                    onClick={() => toggleMonitor(iface.id, !iface.is_monitored, deviceId)}
                    className={`flex items-center justify-center p-2 rounded-full transition-all ${iface.is_monitored ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'}`}
                    title={iface.is_monitored ? "Stop Monitoring" : "Start Monitoring"}
                  >
                    <Zap size={18} className={iface.is_monitored ? "fill-cyan-400" : ""} />
                  </button>
                </div>
                {iface.if_speed > 0 && (
                  <div className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded inline-block w-max mt-2">
                    Speed: {(iface.if_speed / 1000000).toFixed(0)} Mbps
                  </div>
                )}
                {iface.is_monitored && (
                  <BandwidthChart interfaceId={iface.id} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
