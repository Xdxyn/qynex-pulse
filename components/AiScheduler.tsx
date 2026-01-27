import React, { useState } from 'react';
import { ScheduleItem } from '../types';
import { Plus, Clock, Trash2, X } from 'lucide-react';
import { MOCK_USERS } from '../constants';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const Scheduler: React.FC = () => {
    const [shifts, setShifts] = useState<ScheduleItem[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newShift, setNewShift] = useState({
        employeeId: '',
        day: 'Monday',
        startTime: '09:00',
        endTime: '17:00'
    });

    const handleAddShift = () => {
        if (!newShift.employeeId) return;
        
        const user = MOCK_USERS.find(u => u.id === newShift.employeeId);
        if (!user) return;

        const shift: ScheduleItem = {
            id: Date.now().toString(),
            employeeName: user.name,
            role: user.role,
            day: newShift.day,
            startTime: newShift.startTime,
            endTime: newShift.endTime
        };

        setShifts([...shifts, shift]);
        setIsModalOpen(false);
        setNewShift({ ...newShift, employeeId: '' });
    };

    const handleDeleteShift = (id: string) => {
        setShifts(shifts.filter(s => s.id !== id));
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Staff Scheduler</h2>
                    <p className="text-slate-400 text-sm">Manage weekly shifts and coverage manually.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-teal-900/20"
                >
                    <Plus size={18} />
                    <span>Add Shift</span>
                </button>
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <div className="grid grid-cols-7 gap-4 min-w-[1000px] h-full">
                    {DAYS.map(day => (
                        <div key={day} className="bg-slate-900/50 rounded-xl border border-slate-800 flex flex-col h-full overflow-hidden">
                            <div className="p-3 border-b border-slate-800 bg-slate-900 text-center">
                                <span className="font-bold text-slate-300">{day}</span>
                            </div>
                            <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                                {shifts.filter(s => s.day === day).map(shift => (
                                    <div key={shift.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700 group hover:border-teal-500/50 transition-colors shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-white text-sm truncate pr-2">{shift.employeeName}</div>
                                            <button 
                                                onClick={() => handleDeleteShift(shift.id)}
                                                className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="text-[10px] uppercase font-bold text-teal-400 mb-1">{shift.role}</div>
                                        <div className="flex items-center text-xs text-slate-400 bg-slate-900/50 p-1 rounded">
                                            <Clock size={10} className="mr-1.5" />
                                            {shift.startTime} - {shift.endTime}
                                        </div>
                                    </div>
                                ))}
                                {shifts.filter(s => s.day === day).length === 0 && (
                                    <div className="flex items-center justify-center h-20 text-slate-600 text-xs italic">
                                        No shifts
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                            <h3 className="text-xl font-bold text-white">Add New Shift</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Employee</label>
                                <select 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                    value={newShift.employeeId}
                                    onChange={(e) => setNewShift({...newShift, employeeId: e.target.value})}
                                >
                                    <option value="">Select Employee</option>
                                    {MOCK_USERS.filter(u => u.role !== 'CLIENT').map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Day</label>
                                <select 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                    value={newShift.day}
                                    onChange={(e) => setNewShift({...newShift, day: e.target.value})}
                                >
                                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Start Time</label>
                                    <input 
                                        type="time" 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                        value={newShift.startTime}
                                        onChange={(e) => setNewShift({...newShift, startTime: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">End Time</label>
                                    <input 
                                        type="time" 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                        value={newShift.endTime}
                                        onChange={(e) => setNewShift({...newShift, endTime: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <button 
                                onClick={handleAddShift}
                                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-lg mt-4 transition-colors"
                            >
                                Save Shift
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};