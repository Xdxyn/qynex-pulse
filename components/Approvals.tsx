
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shift, Job, Profile } from '../types';
import { CheckCircle, XCircle, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';

export const Approvals: React.FC = () => {
  const [pendingShifts, setPendingShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      // 1. Fetch Reference Data
      const { data: jobsData, error: jobsError } = await supabase.from('jobs').select('*');
      if (jobsError) throw jobsError;

      const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('*');
      if (profilesError) throw profilesError;

      const jobLookup: Record<string, Job> = {};
      jobsData?.forEach((j: Job) => { jobLookup[j.id] = j; });

      const profileLookup: Record<string, Profile> = {};
      profilesData?.forEach((p: Profile) => { profileLookup[p.id] = p; });

      // 2. Fetch Pending Shifts
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .in('correction_status', ['pending', 'pending_addition'])
        .order('clock_in', { ascending: false });

      if (shiftsError) throw shiftsError;

      // 3. Map Data
      if (shiftsData) {
          const mapped: Shift[] = shiftsData.map((s: any) => {
              const job = s.job_id ? jobLookup[s.job_id] : null;
              const profile = s.user_id ? profileLookup[s.user_id] : null;
              
              return {
                  ...s,
                  job_name: job ? job.name : 'Unknown Job',
                  client_name: job ? job.client_name : '',
                  profiles: profile ? { name: profile.name, avatar: profile.avatar, role: profile.role } : { name: 'Unknown User' }
              };
          });
          setPendingShifts(mapped);
      }
    } catch (e) {
      console.error("Error fetching approvals:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const handleAction = async (shift: Shift, action: 'approve' | 'reject') => {
    const isApprove = action === 'approve';
    
    try {
        const manualNote = adminNotes[shift.id] || '';
        const systemTimestamp = `[${isApprove ? 'Approved' : 'Rejected'} on ${new Date().toLocaleString()}]`;
        
        const finalAdminNote = manualNote.trim() 
            ? `${manualNote} ${systemTimestamp}` 
            : `${isApprove ? 'Approved' : 'Rejected'} by Admin on ${new Date().toLocaleString()}`;

        const updatePayload: any = {
            correction_status: isApprove ? 'approved' : 'rejected', // Explicit status for history
            admin_notes: finalAdminNote
        };

        if (isApprove) {
            if (shift.requested_start) updatePayload.clock_in = shift.requested_start;
            if (shift.requested_end) updatePayload.clock_out = shift.requested_end;
            if (shift.requested_project_id) updatePayload.job_id = shift.requested_project_id;
            
            if (shift.correction_status === 'pending_addition' || shift.requested_end) {
                updatePayload.status = 'completed';
            }
        }

        const { error } = await supabase
            .from('shifts')
            .update(updatePayload)
            .eq('id', shift.id);

        if (error) throw error;

        setAdminNotes(prev => {
            const next = { ...prev };
            delete next[shift.id];
            return next;
        });

        await fetchPendingRequests();

    } catch (error: any) {
        console.error("Approval Action Failed:", error);
        alert(`Action failed: ${error.message || 'Unknown database error'}`);
    }
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  // Render logic for specific correction types
  const renderChangeDetails = (shift: Shift) => {
      // Logic to determine what changed
      const origStart = shift.clock_in ? new Date(shift.clock_in).getTime() : 0;
      const reqStart = shift.requested_start ? new Date(shift.requested_start).getTime() : 0;
      
      const origEnd = shift.clock_out ? new Date(shift.clock_out).getTime() : 0;
      const reqEnd = shift.requested_end ? new Date(shift.requested_end).getTime() : 0;

      const isStartChanged = reqStart !== 0 && reqStart !== origStart;
      const isEndChanged = reqEnd !== 0 && reqEnd !== origEnd;

      return (
          <div className="space-y-2">
              {/* Original Context */}
              <div className="text-xs text-slate-500 font-mono border-b border-slate-800 pb-1 mb-2">
                  <span className="font-bold uppercase tracking-wider mr-2 text-slate-600">Originally:</span>
                  {shift.clock_in ? `${formatTime(shift.clock_in)}` : 'N/A'} - {shift.clock_out ? `${formatTime(shift.clock_out)}` : 'Active'}
              </div>

              {/* Changes */}
              <div className="space-y-1">
                  {isStartChanged && (
                      <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">
                            CLOCK-IN CORRECTION
                          </span>
                          <div className="flex items-center text-xs font-mono text-slate-300">
                              <span className="line-through text-slate-600 mr-2">{formatTime(shift.clock_in)}</span>
                              <ArrowRight size={12} className="text-teal-500 mr-2" />
                              <span className="text-teal-400 font-bold">{formatTime(shift.requested_start!)}</span>
                          </div>
                      </div>
                  )}

                  {isEndChanged && (
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">
                            CLOCK-OUT CORRECTION
                          </span>
                          <div className="flex items-center text-xs font-mono text-slate-300">
                                <span className="line-through text-slate-600 mr-2">{shift.clock_out ? formatTime(shift.clock_out!) : 'Active'}</span>
                                <ArrowRight size={12} className="text-teal-500 mr-2" />
                                <span className="text-teal-400 font-bold">{formatTime(shift.requested_end!)}</span>
                          </div>
                       </div>
                  )}

                  {!isStartChanged && !isEndChanged && (
                      <div className="text-xs text-slate-400 italic">No time changes detected (Note only?)</div>
                  )}
              </div>
          </div>
      );
  };

  if (loading) return (
      <div className="flex flex-col items-center justify-center h-64 text-teal-500 gap-4">
          <Loader2 size={40} className="animate-spin"/>
          <span className="font-bold tracking-widest text-sm uppercase">Loading Approvals...</span>
      </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Approvals Dashboard</h2>
        <button onClick={fetchPendingRequests} className="text-xs font-bold text-teal-400 border border-slate-800 bg-slate-900 px-4 py-2 rounded-lg">Refresh</button>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-950 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                    <th className="px-6 py-4 border-b border-slate-800">Staff</th>
                    <th className="px-6 py-4 border-b border-slate-800 w-96">Change Request</th>
                    <th className="px-6 py-4 border-b border-slate-800">Employee Note</th>
                    <th className="px-6 py-4 border-b border-slate-800 text-right w-72">Admin Response</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
                {pendingShifts.length > 0 ? (
                    pendingShifts.map((shift) => (
                        <tr key={shift.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 align-top">
                                <div className="font-bold text-slate-200">{shift.profiles?.name || 'Unknown'}</div>
                                <div className="text-[10px] text-slate-500 uppercase font-bold mt-1">{shift.job_name}</div>
                            </td>
                            <td className="px-6 py-4 align-top">
                                {renderChangeDetails(shift)}
                            </td>
                            <td className="px-6 py-4 align-top">
                                <div className="flex items-start gap-2">
                                    <div className="mt-0.5"><AlertTriangle size={14} className="text-amber-500" /></div>
                                    <span className="italic text-slate-400 text-xs leading-relaxed">
                                        "{shift.employee_notes || 'No explanation provided.'}"
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4 align-top text-right">
                                <div className="flex flex-col gap-3">
                                    <textarea 
                                        placeholder="Admin notes (optional)..."
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-teal-500 resize-none h-16"
                                        value={adminNotes[shift.id] || ''}
                                        onChange={(e) => setAdminNotes(prev => ({...prev, [shift.id]: e.target.value}))}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleAction(shift, 'reject')} className="flex-1 py-2 px-3 text-slate-400 hover:text-red-400 hover:bg-red-950/20 border border-slate-800 hover:border-red-900 rounded-lg transition-colors flex items-center justify-center gap-2" title="Reject">
                                            <XCircle size={16}/>
                                            <span className="text-xs font-bold">Deny</span>
                                        </button>
                                        <button onClick={() => handleAction(shift, 'approve')} className="flex-1 py-2 px-3 text-teal-400 hover:text-white hover:bg-teal-900/20 border border-slate-800 hover:border-teal-500/50 rounded-lg transition-colors flex items-center justify-center gap-2" title="Approve">
                                            <CheckCircle size={16}/>
                                            <span className="text-xs font-bold">Approve</span>
                                        </button>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-600">No pending approvals.</td></tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};
