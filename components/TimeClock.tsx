import React, { useState, useEffect } from 'react';
import { Play, Square, Clock, Briefcase, Layers, CheckCircle2, Wifi, WifiOff, Car, MapPin, Radio, AlertTriangle, Satellite, Smartphone } from 'lucide-react';
import { Shift, Job, Task, Subtask } from '../types';
import { supabase } from '../supabaseClient';
import { QRCodeCanvas } from 'qrcode.react';

interface TimeClockProps {
  activeShift: Shift | null;
  onClockIn: (jobConfig: { job: Job; task: Task; subtask: Subtask }) => void;
  onClockOut: () => void;
  gpsStatus?: 'searching' | 'active' | 'error';
  gpsSyncStatus?: 'idle' | 'synced' | 'error';
  authError?: string | null;
}

export const TimeClock: React.FC<TimeClockProps> = ({
  activeShift,
  onClockIn,
  onClockOut,
  gpsStatus,
  gpsSyncStatus,
  authError
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedSubtask, setSelectedSubtask] = useState<Subtask | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [showMobileLink, setShowMobileLink] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');

  const isClockedIn = !!activeShift;

  useEffect(() => {
    // Determine the best URL for the QR code
    let url = window.location.href;
    try {
        if (window.parent && window.parent !== window) {
             // Try to get the parent URL if inside an iframe
             url = window.parent.location.href;
        }
    } catch (e) {
        // Access denied (cross-origin), fallback to referrer or current
        if (document.referrer) {
            url = document.referrer;
        }
    }
    setTargetUrl(url);
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select('*, tasks(*, subtasks(*))');
            
            if (error) {
                console.error('Error fetching jobs:', error);
                const { data: simpleData } = await supabase.from('jobs').select('*');
                if (simpleData) setJobs(simpleData);
            } else if (data) {
                setJobs(data);
            }
        } catch (e) {
            console.error(e);
        }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let interval: number | undefined;
    if (activeShift) {
      interval = window.setInterval(() => {
        const startTime = new Date(activeShift.clock_in).getTime();
        const diff = Math.max(0, Math.floor((new Date().getTime() - startTime) / 1000));
        setElapsed(diff);
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [activeShift]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleClockIn = () => {
    if (selectedJob) {
        const task = selectedTask || { id: 'gen', name: 'General', subtasks: [] };
        const subtask = selectedSubtask || { id: 'gen', name: 'General' };
        onClockIn({ job: selectedJob, task, subtask });
    }
  };

  const isDriving = activeShift?.status === 'driving';
  const isReady = !!selectedJob;

  const renderStatusBadge = () => {
      if (!isClockedIn) return <span className="text-slate-400">Ready to Work</span>;
      
      if (gpsStatus === 'error') {
          return <span className="text-red-500 font-bold animate-pulse flex items-center gap-2"><AlertTriangle size={16}/> GPS ERROR</span>;
      }
      
      if (gpsStatus === 'searching') {
          return <span className="text-amber-400 font-bold animate-pulse flex items-center gap-2"><Radio size={16}/> GPS: SEARCHING...</span>;
      }
      
      if (isDriving) return <span className="text-teal-400 font-bold animate-pulse flex items-center gap-2"><Car size={16}/> DRIVING MODE</span>;
      
      return <span className="text-emerald-400 font-bold">ACTIVE SHIFT</span>;
  };

  const hasTaskDetails = activeShift?.task_name && activeShift.task_name !== 'General';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full items-start content-start">
      
      {/* Mobile Link Toggle */}
      <div className="lg:col-span-2">
        {!showMobileLink ? (
            <button 
                onClick={() => setShowMobileLink(true)}
                className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xl rounded-xl shadow-lg shadow-yellow-900/20 flex items-center justify-center gap-3 transition-all active:scale-95"
            >
                <Smartphone size={28} />
                GET MOBILE LINK
            </button>
        ) : (
            <div className="bg-slate-900 border-2 border-yellow-400 p-6 rounded-xl flex flex-col items-center text-center animate-in fade-in slide-in-from-top-4 duration-200">
                <Smartphone size={48} className="text-yellow-400 mb-4"/>
                <h3 className="text-white font-bold text-lg mb-2">Scan to Open on Mobile</h3>
                <p className="text-slate-400 text-sm mb-4">Use your phone's camera to scan this QR code.</p>
                
                <div className="bg-white p-4 rounded-xl shadow-2xl mb-4">
                    <QRCodeCanvas 
                        value={targetUrl} 
                        size={200}
                        level={"H"}
                        bgColor={"#ffffff"}
                        fgColor={"#000000"}
                    />
                </div>
                
                <p className="text-xs text-slate-500 font-mono mb-4 break-all max-w-md">
                    {targetUrl}
                </p>

                <button 
                    onClick={() => setShowMobileLink(false)}
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                >
                    Close
                </button>
            </div>
        )}
      </div>

      <div className={`
        rounded-2xl p-8 border shadow-xl flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden transition-colors duration-500
        ${isDriving ? 'bg-slate-900 border-teal-500/50 shadow-teal-900/20' : 
          gpsStatus === 'error' ? 'bg-slate-900 border-red-900/50 shadow-red-900/10' :
          'bg-slate-900 border-slate-800'}
      `}>
        
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800">
            {isOnline ? <Wifi size={14} className="text-teal-500"/> : <WifiOff size={14} className="text-red-500"/>}
            <span className="text-xs text-slate-400">{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-6 shadow-inner relative">
          {isDriving ? (
              <Car size={40} className="text-teal-400 animate-bounce" />
          ) : (
              <Clock size={40} className={isClockedIn ? "text-emerald-500 animate-pulse" : "text-slate-500"} />
          )}
          {isClockedIn && (
             <div className={`absolute inset-0 rounded-full border-2 animate-ping ${
                 isDriving ? 'border-teal-500/30' : 
                 gpsStatus === 'error' ? 'border-red-500/30' :
                 'border-emerald-500/30'
             }`}></div>
          )}
        </div>
        
        <div className="text-sm font-semibold uppercase tracking-widest mb-2 h-6">
          {renderStatusBadge()}
        </div>
        
        <div className="text-7xl md:text-8xl font-bold font-mono text-white mb-2 tracking-tighter tabular-nums text-center">
          {isClockedIn ? formatTime(elapsed) : "00:00:00"}
        </div>
        
        {/* Sync Status Indicator */}
        <div className="h-6 flex items-center justify-center mb-6">
             {isClockedIn && gpsSyncStatus === 'error' && (
                 <span className="text-red-500 text-xs font-bold flex items-center gap-1 animate-pulse">
                    <AlertTriangle size={12}/> GPS Sync Error
                 </span>
             )}
             {isClockedIn && gpsSyncStatus === 'synced' && (
                 <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 size={12}/> GPS: Connected
                 </span>
             )}
        </div>

        {authError && (
          <div className="w-full max-w-md bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-xl mb-4 flex items-center gap-3 animate-pulse">
            <div className="bg-red-500 rounded-full p-1"><AlertTriangle size={16} className="text-white"/></div>
            <span className="font-bold text-sm">{authError}</span>
          </div>
        )}

        <div className="flex flex-col w-full max-w-md gap-4">
          {!isClockedIn ? (
            <>
                <div className="space-y-4 w-full bg-slate-950/50 p-4 rounded-xl border border-slate-800 mb-2">
                    <select 
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
                        onChange={(e) => {
                            const j = jobs.find(j => j.id === e.target.value);
                            setSelectedJob(j || null);
                            setSelectedTask(null);
                            setSelectedSubtask(null);
                        }}
                        value={selectedJob?.id || ''}
                    >
                        <option value="">Select Job...</option>
                        {jobs.map(j => <option key={j.id} value={j.id}>{j.name} - {j.client_name}</option>)}
                    </select>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <select 
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 text-white outline-none disabled:opacity-50"
                            disabled={!selectedJob || !selectedJob.tasks?.length}
                            onChange={(e) => {
                                const t = selectedJob?.tasks?.find(t => t.id === e.target.value);
                                setSelectedTask(t || null);
                                setSelectedSubtask(null);
                            }}
                            value={selectedTask?.id || ''}
                        >
                            <option value="">{selectedJob?.tasks?.length ? "Task..." : "General"}</option>
                            {selectedJob?.tasks?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <select 
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 text-white outline-none disabled:opacity-50"
                            disabled={!selectedTask || !selectedTask.subtasks?.length}
                            onChange={(e) => setSelectedSubtask(selectedTask?.subtasks.find(s => s.id === e.target.value) || null)}
                            value={selectedSubtask?.id || ''}
                        >
                            <option value="">{selectedTask?.subtasks?.length ? "Subtask..." : "General"}</option>
                            {selectedTask?.subtasks.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>

                <button
                    onClick={handleClockIn}
                    disabled={!isReady}
                    className="group w-full h-20 flex items-center justify-center space-x-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl transition-all duration-200 shadow-lg shadow-emerald-900/20 active:scale-95 disabled:shadow-none disabled:cursor-not-allowed"
                >
                    <div className="bg-white/20 rounded-full p-2 group-hover:scale-110 transition-transform">
                        <Play size={24} fill="currentColor" />
                    </div>
                    <span className="text-2xl font-bold">CLOCK IN</span>
                </button>
            </>
          ) : (
            <>
                <button
                    onClick={onClockOut}
                    className="w-full h-24 flex flex-col items-center justify-center bg-red-600 hover:bg-red-500 text-white rounded-2xl transition-all duration-200 active:scale-95 shadow-lg shadow-red-900/20"
                >
                    <div className="flex items-center gap-3">
                        <Square size={28} fill="currentColor" />
                        <span className="text-2xl font-bold">CLOCK OUT</span>
                    </div>
                    <span className="text-red-200 text-sm mt-1">End Current Shift</span>
                </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 h-full flex flex-col">
        <h3 className="text-lg font-bold text-white mb-4">Shift Details</h3>
        
        <div className="flex-1 space-y-6">
            {activeShift ? (
                <div className="relative pl-6 border-l-2 border-slate-800 space-y-8">
                    <div className="relative">
                        <div className="absolute -left-[31px] bg-slate-900 border-2 border-emerald-500 w-4 h-4 rounded-full"></div>
                        <p className="text-sm text-slate-400">Shift Started</p>
                        <p className="text-white font-mono text-lg">
                            {new Date(activeShift.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>

                    <div className="relative">
                        <div className="absolute -left-[31px] bg-slate-900 border-2 border-indigo-500 w-4 h-4 rounded-full flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                        </div>
                        <p className="text-sm text-slate-400">Current Trip Miles</p>
                        <div className="flex items-center gap-2 mt-1">
                             <MapPin size={20} className="text-indigo-400"/>
                             <p className="text-2xl font-mono font-bold text-white">
                                {activeShift.total_miles ? activeShift.total_miles.toFixed(2) : '0.00'} <span className="text-sm text-slate-500 font-sans">mi</span>
                             </p>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Accumulating while speed &ge; 5 mph</p>
                    </div>

                    <div className="relative">
                         <div className={`absolute -left-[31px] w-4 h-4 rounded-full animate-pulse ${isDriving ? 'bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`}></div>
                        <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${isDriving ? 'text-teal-400' : 'text-emerald-400'}`}>
                            {isDriving ? 'Vehicle Detected' : 'Currently Working'}
                        </p>
                        
                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                            <div className="flex items-start gap-3">
                                <Briefcase size={16} className="text-slate-500 mt-1"/>
                                <div>
                                    <p className="text-xs text-slate-500">Project</p>
                                    <p className="text-white font-medium">{activeShift.job_name || "Unknown Job"}</p>
                                    <p className="text-xs text-slate-600">{activeShift.client_name || "Client Info Unavailable"}</p>
                                </div>
                            </div>
                            
                            {hasTaskDetails && (
                                <div className="flex items-start gap-3 border-t border-slate-800/50 pt-2">
                                    <Layers size={16} className="text-slate-500 mt-1"/>
                                    <div>
                                        <p className="text-xs text-slate-500">Task</p>
                                        <p className="text-white font-medium">{activeShift.task_name}</p>
                                        {activeShift.subtask_name && activeShift.subtask_name !== 'General' && (
                                            <p className="text-sm text-slate-400">{activeShift.subtask_name}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* GPS Active Indicator */}
                             <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800">
                                {gpsSyncStatus === 'synced' ? (
                                     <>
                                        <div className="relative">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 z-10 relative"></div>
                                            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping"></div>
                                        </div>
                                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                            GPS Active <Satellite size={10} />
                                        </span>
                                     </>
                                ) : (
                                    <>
                                        <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                                        <span className="text-xs text-slate-500">Initializing GPS...</span>
                                    </>
                                )}
                             </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                    <Clock size={32} className="mb-2 opacity-50"/>
                    <p>No active shift.</p>
                </div>
            )}
        </div>
        
        <div className="mt-auto pt-6 border-t border-slate-800">
             <div className="flex gap-2 items-start p-3 bg-blue-900/10 border border-blue-900/30 rounded-lg">
                 <CheckCircle2 size={16} className="text-blue-400 mt-0.5 shrink-0"/>
                 <div>
                     <p className="text-xs text-blue-300 font-bold mb-0.5">Automated Compliance</p>
                     <p className="text-[10px] text-slate-400 leading-relaxed">
                         GPS tracking is active. Status automatically updates to <span className="text-teal-400 font-bold">DRIVING</span> when speed &ge; 5mph.
                         Shift will auto-close if permission is revoked.
                     </p>
                 </div>
             </div>
        </div>
      </div>
    </div>
  );
};