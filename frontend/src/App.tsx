import { useState } from 'react';
import { DeviceList } from './features/devices/DeviceList';
import { Dashboard } from './features/dashboard/Dashboard';
import { Alerts } from './features/alerts/Alerts';
import { Login } from './features/auth/Login';
import { useAuthStore } from './store/authStore';

function App() {
  const { token, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'devices' | 'dashboard' | 'alerts'>('devices');

  if (!token) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 flex">
      {/* Basic Sidebar */}
      <div className="w-64 border-r border-slate-800 bg-slate-900/50 hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight">
            PortSense.
          </h1>
        </div>
        <nav className="mt-6 px-4 space-y-2 flex-1">
          <button 
            onClick={() => setActiveTab('devices')}
            className={`w-full text-left block px-4 py-3 rounded-xl transition-colors ${activeTab === 'devices' ? 'bg-cyan-500/10 text-cyan-400 font-medium border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'}`}
          >
            Devices
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left block px-4 py-3 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'bg-cyan-500/10 text-cyan-400 font-medium border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('alerts')}
            className={`w-full text-left block px-4 py-3 rounded-xl transition-colors ${activeTab === 'alerts' ? 'bg-cyan-500/10 text-cyan-400 font-medium border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'}`}
          >
            Alerts
          </button>
        </nav>
        <div className="p-4">
          <button onClick={logout} className="w-full py-2 px-4 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors border border-slate-800">
            Sign Out
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 h-screen overflow-hidden">
        {activeTab === 'devices' && <DeviceList />}
        {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
        {activeTab === 'alerts' && <Alerts />}
      </div>
    </div>
  );
}

export default App;
