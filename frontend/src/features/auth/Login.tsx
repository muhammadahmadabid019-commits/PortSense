import { useState } from 'react';
import { useAuthStore, api } from '../../store/authStore';

export const Login = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const { login } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      
      const res = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      login(res.data.access_token);
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 w-full max-w-md shadow-2xl">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 text-center mb-8">
          PortSense.
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded text-sm text-center">{error}</div>}
          <div>
            <label className="block text-slate-400 text-sm mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 outline-none focus:border-cyan-500 transition-colors" 
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 outline-none focus:border-cyan-500 transition-colors" 
            />
          </div>
          <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold py-3 rounded-lg transition-colors mt-6 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};
