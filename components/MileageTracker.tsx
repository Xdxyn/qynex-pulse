import React, { useState, useEffect } from 'react';
import { Navigation, Play, Square, MapPin, Gauge } from 'lucide-react';
import { Breadcrumb, Shift } from '../types';

interface MileageTrackerProps {
  activeTrip: { id: string, breadcrumbs: Breadcrumb[] } | null;
  activeShift: Shift | null;
  onStartTrip: () => void;
  onStopTrip: () => void;
}

export const MileageTracker: React.FC<MileageTrackerProps> = ({
  activeTrip,
  activeShift,
  onStartTrip,
  onStopTrip
}) => {
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [isDriving, setIsDriving] = useState(false);

  useEffect(() => {
    let interval: number;
    if (activeTrip) {
      interval = window.setInterval(() => {
        // SIMULATION: Random speed between 0 and 65 mph
        // Bias towards driving speeds or stopped speeds to show transition
        const newSpeed = Math.random() > 0.4 ? Math.random() * 60 + 5 : Math.random() * 4; 
        const driving = newSpeed >= 5;
        
        setCurrentSpeed(newSpeed);
        setIsDriving(driving);

        const newPoint: Breadcrumb = {
            shift_id: activeShift?.id || 'unknown_shift',
            lat: 40.7128 + (Math.random() * 0.05),
            lng: -74.0060 + (Math.random() * 0.05),
            timestamp: new Date().toISOString(),
            accuracy: Math.random() * 10,
            speed: newSpeed,
            isDriving: driving
        };

        setBreadcrumbs(prev => [...prev, newPoint]);
      }, 1500);
    } else {
        setBreadcrumbs([]);
        setCurrentSpeed(0);
        setIsDriving(false);
    }
    return () => clearInterval(interval);
  }, [activeTrip, activeShift]);

  const totalDrivingDistance = breadcrumbs
    .filter(b => b.isDriving)
    .length * 0.05; // Fake math for demo

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Control Panel */}
      <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 flex flex-col justify-between">
        <div>
            <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-teal-500/10 rounded-lg">
                    <Navigation className="text-teal-400" size={24}/>
                </div>
                <h2 className="text-xl font-bold text-white">Mileage Tracker</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative overflow-hidden">
                     {/* Speedometer bg visual */}
                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider relative z-10">Current Speed</p>
                    <div className="flex items-end gap-2 mt-1 relative z-10">
                         <span className={`text-3xl font-mono font-bold ${isDriving ? 'text-teal-400' : 'text-slate-500'}`}>
                            {currentSpeed.toFixed(0)}
                         </span>
                         <span className="text-sm text-slate-500 font-sans mb-1">mph</span>
                    </div>
                    {activeTrip && (
                        <div className={`absolute bottom-0 left-0 h-1 transition-all duration-300 ${isDriving ? 'bg-teal-500 w-full' : 'bg-slate-700 w-1/4'}`}></div>
                    )}
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">Billable Distance</p>
                    <p className="text-3xl font-mono font-bold text-white mt-1">
                        {activeTrip ? totalDrivingDistance.toFixed(2) : '0.00'} <span className="text-sm text-slate-500 font-sans">mi</span>
                    </p>
                </div>
            </div>

            {activeTrip && (
                 <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400 uppercase font-bold">Status</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${isDriving ? 'bg-teal-900 text-teal-400' : 'bg-slate-800 text-slate-400'}`}>
                            {isDriving ? 'DRIVING MODE' : 'IDLE / WALKING'}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Mileage accumulates only when speed exceeds 5 MPH. 
                        Low-speed movements (walking, idle) are breadcrumbed but excluded from totals.
                    </p>
                 </div>
            )}
        </div>

        <div>
            {!activeTrip ? (
                 <button
                 onClick={onStartTrip}
                 className="w-full flex items-center justify-center space-x-3 bg-teal-600 hover:bg-teal-500 text-white py-4 px-8 rounded-xl transition-all duration-200 shadow-lg shadow-teal-900/20 active:scale-95"
               >
                 <Play size={20} fill="currentColor" />
                 <span className="text-lg font-bold">Start Trip</span>
               </button>
            ) : (
                <button
                    onClick={onStopTrip}
                    className="w-full flex items-center justify-center space-x-3 bg-red-600 hover:bg-red-500 text-white py-4 px-8 rounded-xl transition-all duration-200 shadow-lg shadow-red-900/20 active:scale-95"
                >
                    <Square size={20} fill="currentColor" />
                    <span className="text-lg font-bold">End Trip</span>
                </button>
            )}
        </div>
      </div>

      {/* Map Visualization (Abstract) */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden relative min-h-[400px]">
        {/* Grid Background to simulate map */}
        <div className="absolute inset-0 opacity-10" 
             style={{ 
                 backgroundImage: 'linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)',
                 backgroundSize: '40px 40px'
             }}>
        </div>
        
        {/* Radar Pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
             <div className="relative">
                <div className="w-4 h-4 bg-teal-500 rounded-full z-10 relative shadow-[0_0_20px_rgba(20,184,166,0.6)]"></div>
                {activeTrip && (
                    <>
                        <div className="absolute top-0 left-0 w-4 h-4 bg-teal-500 rounded-full animate-ping opacity-75"></div>
                        <div className="absolute -top-12 -left-12 w-28 h-28 border border-teal-500/20 rounded-full animate-[spin_3s_linear_infinite]"></div>
                    </>
                )}
             </div>
        </div>

        {/* Mock Path */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
             {/* Dynamic Points */}
            {breadcrumbs.slice(-20).map((b, i) => (
                <circle 
                    key={i} 
                    cx={200 + (Math.sin(i) * 50) + (Math.random() * 20)} 
                    cy={200 + (Math.cos(i) * 50) + (Math.random() * 20)} 
                    r={b.isDriving ? "4" : "2"} 
                    fill={b.isDriving ? "#2dd4bf" : "#64748b"} // Teal for driving, Slate for idle
                    opacity={i / 20}
                />
            ))}
        </svg>
        
        <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur px-3 py-2 rounded-lg border border-slate-800 shadow-lg">
             <div className="flex items-center space-x-2 text-xs text-slate-300 mb-1">
                <MapPin size={12} className="text-teal-400"/>
                <span>GPS Accuracy: ±3m</span>
             </div>
             <div className="flex items-center space-x-2 text-xs text-slate-300">
                <Gauge size={12} className="text-teal-400"/>
                <span>Sampling: 1Hz</span>
             </div>
        </div>
      </div>
    </div>
  );
};