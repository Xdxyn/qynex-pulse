
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Job, Shift } from '../types';
import { Play, Square, Loader2, MapPin, Building } from 'lucide-react';

export const TimeClock: React.FC<{ user: any, onShiftChange?: () => void }> = ({ user, onShiftChange }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection State (Pre-Clock In)
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState(''); 
  
  // Active Shift State
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  // Computed Data
  const uniqueClients = Array.from(new Set(jobs.map(j => j.client_id).filter(Boolean))).map(clientId => {
      const job = jobs.find(j => j.client_id === clientId);
      return {
          id: clientId!,
          name: job?.clients?.name || job?.client_name || 'Unknown Client'
      };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

  const clientJobs = jobs.filter(j => j.client_id === selectedClientId);
  const activeJob = activeShift ? jobs.find(j => j.id === activeShift.job_id) : null;

  useEffect(() => {
    const initData = async () => {
      try {
        // 1. Fetch Jobs
        const { data: jobsData } = await supabase.from('jobs').select('*, clients(*)').eq('status', 'active');
        setJobs(jobsData || []);

        // 2. Check Active Shift
        if (user) {
            const { data: shiftData } = await supabase
                .from('shifts')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .maybeSingle();
            
            if (shiftData) {
                setActiveShift(shiftData);
            }
        }
      } catch (err) {
        console.error('Error initializing TimeClock:', err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [user]);

  // Timer Effect
  useEffect(() => {
    let interval: number;
    if (activeShift?.clock_in) {
      const startTime = new Date(activeShift.clock_in).getTime();
      const updateTimer = () => {
        const now = Date.now();
        const diff = now - startTime;
        if (diff < 0) { setElapsedTime('00:00:00'); return; }
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        const fmt = (n: number) => n.toString().padStart(2, '0');
        setElapsedTime(`${fmt(hours)}:${fmt(minutes)}:${fmt(seconds)}`);
      };
      updateTimer();
      interval = window.setInterval(updateTimer, 1000);
    } else {
        setElapsedTime('00:00:00');
    }
    return () => clearInterval(interval);
  }, [activeShift]);

  // Auto-select location logic
  useEffect(() => {
      if (selectedClientId && clientJobs.length === 1) {
          setSelectedJobId(clientJobs[0].id);
      } else {
          setSelectedJobId('');
      }
  }, [selectedClientId]);

  // --- ACTIONS ---

  const handleClockIn = async () => {
    if (!user || !selectedJobId) return;
    setActionLoading(true);
    try {
        const { data, error } = await supabase.from('shifts').insert({
            user_id: user.id,
            job_id: selectedJobId,
            clock_in: new Date().toISOString(),
            status: 'active'
        }).select().single();

        if (error) throw error;
        setActiveShift(data);
        if (onShiftChange) onShiftChange();
    } catch (err: any) {
        alert('Clock In Error: ' + err.message);
    } finally {
        setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeShift || !user) return;
    setActionLoading(true);

    const nowIso = new Date().toISOString();

    try {
        // Minimal Update: Status and Time ONLY.
        const { error } = await supabase
            .from('shifts')
            .update({
                status: 'completed',
                clock_out: nowIso,
            })
            .eq('id', activeShift.id);

        if (error) throw error;

    } catch (err: any) {
        console.error("Standard Clock Out Failed:", err);
        // If the DB call fails, we still reset the UI so the user isn't trapped.
        alert("Shift ended locally. Database update may have pending issues.");
    } finally {
        // FORCE RESET UI STATE
        setActiveShift(null);
        setSelectedClientId('');
        setSelectedJobId(''); 
        setActionLoading(false);
        if (onShiftChange) onShiftChange();
    }
  };

  if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-teal-500" size={32}/></div>;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 md:p-8">
      <div className="w-full max-w-md bg-slate-900 rounded-xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 pb-2 text-center bg-slate-900 z-20">
            <h1 className="text-2xl font-bold text-white relative z-10">
                {activeShift ? 'Shift in Progress' : 'Time Clock'}
            </h1>
            {activeShift && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-emerald-500 animate-pulse"></div>}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 pt-0 custom-scrollbar">
            <div className="space-y-6">
                {activeShift ? (
                    // --- ACTIVE SHIFT STATE (SIMPLIFIED) ---
                    <div className="text-center space-y-6 animate-in fade-in duration-300 pt-4">
                        
                        {/* Timer */}
                        <div className="py-4">
                             <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Duration</p>
                             <div className="text-6xl font-mono font-black text-white tracking-wider tabular-nums shadow-teal-500/20 drop-shadow-sm">
                                {elapsedTime}
                             </div>
                        </div>

                        {/* Job Info */}
                        <div className="text-left bg-slate-950/50 p-6 rounded-xl border border-slate-800 flex flex-col items-center text-center">
                            <div className="p-3 bg-teal-500/10 rounded-full mb-3">
                                <Building size={24} className="text-teal-400" />
                            </div>
                            <h2 className="text-white text-xl font-bold mb-1">{activeJob?.clients?.name || activeJob?.client_name || 'Current Client'}</h2>
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <MapPin size={14} />
                                <span>{activeJob?.name || 'Location'}</span> 
                            </div>
                        </div>
                    </div>
                ) : (
                    // --- CLOCKED OUT STATE ---
                    <div className="animate-in fade-in duration-300 space-y-4 pt-4">
                        <div>
                            <label className="block text-slate-400 text-xs font-bold uppercase mb-2">1. Select Client</label>
                            <div className="relative">
                                <select 
                                    className="w-full bg-slate-950 border border-slate-700 text-white text-lg py-3 px-4 rounded-xl outline-none focus:border-teal-500 transition-colors appearance-none cursor-pointer"
                                    value={selectedClientId}
                                    onChange={(e) => setSelectedClientId(e.target.value)}
                                >
                                    <option value="">-- Choose Client --</option>
                                    {uniqueClients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                    <Building size={16} />
                                </div>
                            </div>
                        </div>

                        {selectedClientId && clientJobs.length > 1 && (
                             <div className="animate-in slide-in-from-top-2">
                                <label className="block text-slate-400 text-xs font-bold uppercase mb-2">2. Select Location</label>
                                <div className="relative">
                                    <select 
                                        className="w-full bg-slate-950 border border-slate-700 text-white text-lg py-3 px-4 rounded-xl outline-none focus:border-teal-500 transition-colors appearance-none cursor-pointer"
                                        value={selectedJobId}
                                        onChange={(e) => setSelectedJobId(e.target.value)}
                                    >
                                        <option value="">-- Choose Location --</option>
                                        {clientJobs.map(job => (
                                            <option key={job.id} value={job.id}>{job.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <MapPin size={16} />
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {selectedClientId && clientJobs.length === 1 && (
                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center gap-2 text-slate-400 text-sm justify-center">
                                 <MapPin size={14} className="text-teal-500" />
                                 <span>Location: {clientJobs[0].name}</span>
                            </div>
                        )}

                        <button 
                            onClick={handleClockIn}
                            disabled={!selectedJobId || actionLoading}
                            className={`w-full py-5 rounded-xl font-bold text-xl flex items-center justify-center gap-3 transition-all duration-300 mt-6 ${
                                selectedJobId 
                                ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/20 active:scale-95' 
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                            }`}
                        >
                            {actionLoading ? <Loader2 className="animate-spin" size={24}/> : <Play size={24} fill={selectedJobId ? "currentColor" : "none"} />}
                            <span>CLOCK IN</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
        
        {/* Footer - Fixed Clock Out Button */}
        {activeShift && (
            <div className="p-6 bg-slate-900 border-t border-slate-800 z-20">
                <button 
                    onClick={handleClockOut}
                    disabled={actionLoading}
                    className="w-full py-5 rounded-xl font-bold text-xl flex items-center justify-center gap-3 bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {actionLoading ? <Loader2 className="animate-spin" size={24}/> : <Square size={24} fill="currentColor" />}
                    <span>CLOCK OUT</span>
                </button>
            </div>
        )}
        
        {/* Footer for Clocked Out State (Status) */}
        {!activeShift && (
             <div className="p-4 pt-0 text-center bg-slate-900">
                 <p className="text-xs text-slate-500 font-mono">System Status: Online</p>
             </div>
        )}

      </div>
    </div>
  );
};
