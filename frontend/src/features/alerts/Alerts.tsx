import { useEffect } from 'react';
import { useAlertStore } from '../../store/alertStore';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export const Alerts = () => {
  const { alerts, loading, fetchAlerts, resolveAlert } = useAlertStore();

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  if (loading && alerts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-8 flex items-center gap-4">
        <div className="bg-rose-500/10 p-3 rounded-xl text-rose-500">
          <AlertTriangle size={32} />
        </div>
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-500 mb-1 tracking-tight">
            Active Alerts
          </h1>
          <p className="text-slate-400">System generated alerts for unreachable devices.</p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
          <CheckCircle size={48} className="text-emerald-500 mb-4 opacity-80" />
          <h3 className="text-xl font-medium text-slate-300 mb-2">All Clear!</h3>
          <p className="text-slate-500">There are no active alerts at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-gradient-to-r from-slate-900 to-slate-800 border border-rose-500/30 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-[0_0_15px_rgba(244,63,94,0.05)] hover:border-rose-500/60 transition-colors">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-200 mb-1">{alert.message}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Clock size={14} />
                    <span>{new Date(alert.created_at).toLocaleString()}</span>
                    <span className="uppercase text-xs font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 ml-2">
                      {alert.severity}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => resolveAlert(alert.id)}
                className="shrink-0 bg-slate-800 hover:bg-emerald-500 hover:text-white text-slate-300 border border-slate-700 hover:border-emerald-500 px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <CheckCircle size={18} />
                Resolve
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
