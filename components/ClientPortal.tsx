import React from 'react';
import { Calendar } from 'lucide-react';

export const ClientPortal: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">My Project Schedule</h2>
                <p className="text-slate-400">View upcoming service appointments for your property.</p>
            </div>

            <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 text-slate-500">
                <Calendar size={48} className="mb-4 opacity-50"/>
                <p>No upcoming scheduled services found.</p>
            </div>
        </div>
    );
}