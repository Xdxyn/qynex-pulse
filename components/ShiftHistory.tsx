
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shift, Job } from '../types';
import { Loader2, Calendar, Clock, Briefcase, RefreshCw, AlertCircle, Edit, X, Save, AlertTriangle, CheckCircle2, XCircle, FileText } from 'lucide-react';

export const ShiftHistory: React.FC<{ userId: string }> = ({ userId }) => {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [jobs, setJobs] = useState<Record<string, Job>>({});
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Correction Modal State
    const [editingShift, setEditingShift] = useState<Shift | null>(null);
    const [correctionForm, setCorrectionForm] = useState({
        start: '',
        end: '',
        reason: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchHistory();
        }
    }, [userId]);

    const fetchHistory = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            // 1. Fetch Jobs
            const { data: jobsData, error: jobsError } = await supabase.from('jobs').select('*');
            if (jobsError) throw jobsError;

            const jobLookup: Record<string, Job> = {};
            jobsData?.forEach((j: Job) => { jobLookup[j.id] = j; });
            setJobs(jobLookup);

            // 2. Fetch Shifts
            const { data: shiftsData, error: shiftsError } = await supabase
                .from('shifts')
                .select('*')
                .eq('user_id', userId)
                .neq('status', 'active') 
                .order('clock_in', { ascending: false });

            if (shiftsError) throw shiftsError;

            // 3. Map
            if (shiftsData) {
                const mapped: Shift[] = shiftsData.map((s: any) => {
                    const matchedJob = s.job_id ? jobLookup[s.job_id] : null;
                    return {
                        ...s,
                        job_name: matchedJob ? matchedJob.name : (s.job_id ? 'Unknown Project' : 'No Project Assigned'),
                        client_name: matchedJob ? matchedJob.client_name : '',
                    };
                });
                setShifts(mapped);
            }

        } catch (e: any) {
            console.error("Error in fetchHistory:", e);
            setFetchError(e.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    const calculateDuration = (start: string, end?: string) => {
        if (!end) return 'Active';
        const diff = new Date(end).getTime() - new Date(start).getTime();
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
    };

    const formatTime = (isoString: string) => {
        if (!isoString) return '--:--';
        return new Date(isoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    const formatDate = (isoString: string) => {
        if (!isoString) return 'Unknown Date';
        return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // --- Correction Logic ---

    const toLocalInput = (isoString?: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const offset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - offset);
        return localDate.toISOString().slice(0, 16);
    };

    const handleOpenCorrection = (shift: Shift) => {
        setEditingShift(shift);
        setCorrectionForm({
            start: toLocalInput(shift.clock_in),
            end: shift.clock_out ? toLocalInput(shift.clock_out) : '',
            reason: '' 
        });
    };

    const handleSubmitCorrection = async () => {
        if (!editingShift) return;
        setIsSubmitting(true);

        try {
            const updates = {
                requested_start: new Date(correctionForm.start).toISOString(),
                requested_end: correctionForm.end ? new Date(correctionForm.end).toISOString() : null,
                employee_notes: correctionForm.reason,
                correction_status: 'pending' 
            };

            const { error } = await supabase.from('shifts').update(updates).eq('id', editingShift.id);
            if (error) throw error;

            setEditingShift(null);
            fetchHistory();
        } catch (e: any) {
            alert('Failed: ' + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 md:p-12 pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-teal-500/10 rounded-xl">
                        <Briefcase className="text-teal-400" size={24} />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Shift History</h2>
                </div>
                
                <button 
                    onClick={fetchHistory}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    <span>Refresh Data</span>
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <Loader2 className="animate-spin mb-4" size={32} />
                    <p>Loading history...</p>
                </div>
            ) : (
                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-slate-950 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 border-b border-slate-800">Project / Work</th>
                                    <th className="px-6 py-4 border-b border-slate-800">Date</th>
                                    <th className="px-6 py-4 border-b border-slate-800">Time Log</th>
                                    <th className="px-6 py-4 border-b border-slate-800 text-right">Duration</th>
                                    <th className="px-6 py-4 border-b border-slate-800 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {shifts.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            <p className="text-lg font-bold text-slate-400">No history found.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    shifts.map((shift) => (
                                        <tr key={shift.id} className="hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white text-base group-hover:text-teal-400 transition-colors">
                                                    {shift.job_name}
                                                </div>
                                                <div className="text-xs text-slate-500 font-medium mb-2">
                                                    {shift.client_name}
                                                </div>

                                                {/* Task / Subtask Details */}
                                                {(shift.completed_tasks || shift.subtask_note) && (
                                                    <div className="bg-slate-950/50 p-2 rounded border border-slate-800 mt-1 max-w-xs">
                                                        {shift.completed_tasks && (
                                                            <div className="flex items-center gap-1.5 text-xs text-teal-400 font-bold mb-1">
                                                                <span className="text-slate-500 text-[10px] uppercase">Task:</span>
                                                                {shift.completed_tasks}
                                                            </div>
                                                        )}
                                                        {shift.subtask_note && (
                                                            <div className="flex items-start gap-1.5 text-xs text-slate-300 italic">
                                                                <FileText size={12} className="mt-0.5 text-slate-500 min-w-[12px]" />
                                                                "{shift.subtask_note}"
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {/* Display Admin Notes */}
                                                {shift.admin_notes && (
                                                    <div className="mt-2 text-xs text-slate-300 bg-slate-800/50 p-2 rounded border border-slate-700/50 max-w-xs">
                                                        <span className="font-bold uppercase text-[10px] text-slate-500 block mb-1">Admin Response:</span>
                                                        {shift.admin_notes}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                <div className="flex items-center gap-2 text-slate-400 font-medium">
                                                    <Calendar size={14} className="text-slate-600" />
                                                    <span>{formatDate(shift.clock_in)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2 text-emerald-400">
                                                        <span className="text-[10px] font-bold w-8 uppercase tracking-wider text-emerald-900 bg-emerald-500/10 px-1 rounded">In</span>
                                                        <span className="font-mono">{formatTime(shift.clock_in)}</span>
                                                    </div>
                                                    {shift.clock_out ? (
                                                        <div className="flex items-center gap-2 text-red-400">
                                                            <span className="text-[10px] font-bold w-8 uppercase tracking-wider text-red-900 bg-red-500/10 px-1 rounded">Out</span>
                                                            <span className="font-mono">{formatTime(shift.clock_out)}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-slate-500 italic">No Clock Out</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-top text-right">
                                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg font-mono font-bold text-xs bg-slate-950 text-slate-400 border border-slate-800">
                                                    <Clock size={12} />
                                                    {calculateDuration(shift.clock_in, shift.clock_out)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 align-top text-center">
                                                {shift.correction_status === 'pending' ? (
                                                     <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase tracking-wider border border-yellow-900/50">
                                                        <AlertTriangle size={10} /> Pending
                                                     </span>
                                                ) : shift.correction_status === 'rejected' ? (
                                                     <div className="flex flex-col items-center gap-2">
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider border border-red-900/50">
                                                            <XCircle size={10} /> Rejected
                                                        </span>
                                                        <button 
                                                            onClick={() => handleOpenCorrection(shift)}
                                                            className="text-[10px] text-slate-500 underline hover:text-white"
                                                        >
                                                            Resubmit?
                                                        </button>
                                                     </div>
                                                ) : shift.correction_status === 'approved' ? (
                                                     <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-teal-500/10 text-teal-400 text-[10px] font-bold uppercase tracking-wider border border-teal-900/50">
                                                        <CheckCircle2 size={10} /> Corrected
                                                     </span>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleOpenCorrection(shift)}
                                                        className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                                        title="Request Correction"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* Correction Modal */}
            {editingShift && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">Request Correction</h3>
                                <p className="text-sm text-slate-400">Submit changes for admin approval.</p>
                            </div>
                            <button onClick={() => setEditingShift(null)} className="text-slate-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Time In</label>
                                <input 
                                    type="datetime-local" 
                                    value={correctionForm.start}
                                    onChange={(e) => setCorrectionForm({...correctionForm, start: e.target.value})}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-teal-500 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Time Out</label>
                                <input 
                                    type="datetime-local" 
                                    value={correctionForm.end}
                                    onChange={(e) => setCorrectionForm({...correctionForm, end: e.target.value})}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-teal-500 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Reason for Change</label>
                                <textarea 
                                    value={correctionForm.reason}
                                    onChange={(e) => setCorrectionForm({...correctionForm, reason: e.target.value})}
                                    placeholder="Explain why this change is needed..."
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-teal-500 min-h-[100px]"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button 
                                    onClick={() => setEditingShift(null)}
                                    className="flex-1 py-3 rounded-xl font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSubmitCorrection}
                                    disabled={!correctionForm.start || isSubmitting}
                                    className="flex-[2] py-3 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                    <span>Submit Request</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
