import React from 'react';
import { OrganizationSettings } from '../types';
import { ToggleLeft, ToggleRight } from 'lucide-react';

interface SettingsProps {
    settings: OrganizationSettings;
    onToggleFeature: (key: keyof OrganizationSettings['features']) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onToggleFeature }) => {
    
    const FeatureRow = ({ label, desc, fKey }: { label: string, desc: string, fKey: keyof OrganizationSettings['features'] }) => {
        const enabled = settings.features[fKey];
        return (
            <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                <div>
                    <h4 className="font-bold text-white">{label}</h4>
                    <p className="text-sm text-slate-500">{desc}</p>
                </div>
                <button 
                    onClick={() => onToggleFeature(fKey)}
                    className={`transition-colors duration-200 ${enabled ? 'text-teal-500' : 'text-slate-600'}`}
                >
                    {enabled ? <ToggleRight size={40} fill="currentColor" className="opacity-20"/> : <ToggleLeft size={40} />}
                </button>
            </div>
        )
    };

    return (
        <div className="max-w-3xl">
            <h2 className="text-2xl font-bold text-white mb-6">Organization Settings</h2>
            
            <div className="space-y-8">
                <div>
                    <h3 className="text-sm font-bold text-teal-500 uppercase tracking-wider mb-4 px-1">Modules</h3>
                    <div className="space-y-3">
                        <FeatureRow 
                            label="Time Clock & Job Coding" 
                            desc="Allow employees to clock in, select jobs/tasks, and track time."
                            fKey="timeClock" 
                        />
                         <FeatureRow 
                            label="Client Portal" 
                            desc="Allow clients to login and view their specific project schedules."
                            fKey="clientPortal" 
                        />
                        <FeatureRow 
                            label="GPS Mileage" 
                            desc="Enable background GPS tracking with driving mode logic (Speed > 5mph)."
                            fKey="mileage" 
                        />
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-teal-500 uppercase tracking-wider mb-4 px-1">Management</h3>
                     <div className="space-y-3">
                        <FeatureRow 
                            label="Live Map" 
                            desc="Show real-time location and status (Active/Stale/Lost) of active workforce."
                            fKey="liveMap" 
                        />
                        <FeatureRow 
                            label="Staff Scheduling" 
                            desc="Enable weekly shift management and manual rostering."
                            fKey="aiScheduling" 
                        />
                         <FeatureRow 
                            label="Approvals Workflow" 
                            desc="Require manager approval for timesheets and corrections."
                            fKey="approvals" 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};