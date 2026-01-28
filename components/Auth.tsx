
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldCheck, Mail, Lock, Loader2 } from 'lucide-react';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-900/20 mb-4">
             <span className="font-bold text-white text-3xl">Q</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Qynex Pulse</h1>
          <p className="text-slate-400 text-sm">Secure Sign In</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-900/20 border border-red-900/50 text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={16} className="text-slate-500" />
              </div>
              <input
                type="email"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-3 py-3 text-white outline-none focus:border-teal-500 transition-colors"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} className="text-slate-500" />
              </div>
              <input
                type="password"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-3 py-3 text-white outline-none focus:border-teal-500 transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-teal-900/20 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-800 pt-6">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest font-black">
                Restricted Access Only
            </p>
        </div>
      </div>
    </div>
  );
};
