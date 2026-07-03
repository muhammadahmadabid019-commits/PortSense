import { useEffect } from 'react';
import { useStatsStore } from '../../store/statsStore';
import { Server, Activity, AlertTriangle, Zap, ArrowRight } from 'lucide-react';

export const Dashboard = ({ onNavigate }: { onNavigate: (tab: 'devices' | 'alerts' | 'monitoring') => void }) => {
  const { stats, loading, fetchStats } = useStatsStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading || !stats) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2 tracking-tight">
          Network Overview
        </h1>
        <p className="text-slate-400">Real-time statistics for your monitored infrastructure.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/50 relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
          <div className="absolute -right-6 -top-6 text-cyan-500/10 group-hover:text-cyan-500/20 transition-colors">
            <Server size={120} />
          </div>
          <div className="relative z-10">
            <div className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
              <Server size={16} className="text-cyan-400" />
              Total Devices
            </div>
            <div className="text-5xl font-black text-white">{stats.total_devices}</div>
          </div>
          <button onClick={() => onNavigate('devices')} className="absolute bottom-4 right-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-sm font-medium">
            View <ArrowRight size={14} />
          </button>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/50 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
          <div className="absolute -right-6 -top-6 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors">
            <Activity size={120} />
          </div>
          <div className="relative z-10">
            <div className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
              <Activity size={16} className="text-emerald-400" />
              Total Interfaces
            </div>
            <div className="text-5xl font-black text-white">{stats.total_interfaces}</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/50 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
          <div className="absolute -right-6 -top-6 text-blue-500/10 group-hover:text-blue-500/20 transition-colors">
            <Zap size={120} />
          </div>
          <div className="relative z-10">
            <div className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
              <Zap size={16} className="text-blue-400 fill-blue-400" />
              Monitored Interfaces
            </div>
            <div className="text-5xl font-black text-white">{stats.monitored_interfaces}</div>
          </div>
        </div>

        <div className={`bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border relative overflow-hidden group transition-colors ${stats.active_alerts > 0 ? 'border-rose-500/50 hover:border-rose-500' : 'border-slate-700/50 hover:border-slate-600'}`}>
          <div className={`absolute -right-6 -top-6 transition-colors ${stats.active_alerts > 0 ? 'text-rose-500/10 group-hover:text-rose-500/20' : 'text-slate-500/10'}`}>
            <AlertTriangle size={120} />
          </div>
          <div className="relative z-10">
            <div className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
              <AlertTriangle size={16} className={stats.active_alerts > 0 ? "text-rose-400" : "text-slate-400"} />
              Active Alerts
            </div>
            <div className={`text-5xl font-black ${stats.active_alerts > 0 ? 'text-rose-400' : 'text-white'}`}>
              {stats.active_alerts}
            </div>
          </div>
          <button onClick={() => onNavigate('alerts')} className="absolute bottom-4 right-4 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-sm font-medium">
            View <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
