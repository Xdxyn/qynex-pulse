import React, { useState } from 'react';
import { MOCK_PENDING_APPROVALS } from '../constants';
import { CheckCircle, XCircle, Clock, MapPin, AlertCircle, FileEdit } from 'lucide-react';

// 1. Move filter options OUTSIDE the component to prevent re-creation on every render
const FILTER_OPTIONS = ['all', 'time', 'mileage', 'correction'] as const;
type FilterType = typeof FILTER_OPTIONS[number];

export const Approvals: React.FC = () => {
  // 2. Set the state with the strict FilterType
  const [filter, setFilter] = useState<FilterType>('all');

  // 3. Logic to filter items based on the selected tab
  const filteredItems = MOCK_PENDING_APPROVALS.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'time') return item.type === 'Time Entry';
    if (filter === 'mileage') return item.type === 'Mileage';
    if (filter === 'correction') return item.type === 'Correction';
    return false;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Approvals & Corrections</h2>
          <p className="text-slate-400 text-sm">Review timesheets, mileage, and staff correction requests.</p>
        </div>
        
        {/* Navigation/Filter Tabs */}
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)} 
              className={`px-4 py-2 text-sm font-medium rounded-md capitalize transition-colors ${
                filter === f ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div 
              key={item.id} 
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start space-x-4 w-full lg:w-auto">
                <div className={`p-3 rounded-lg shrink-0 ${
                    item.type === 'Time Entry' ? 'bg-blue-500/10 text-blue-400' : 
                    item.type === 'Mileage' ? 'bg-indigo-500/10 text-indigo-400' :
                    'bg-amber-500/10 text-amber-400'
                }`}>
                  {item.type === 'Time Entry' ? <Clock size={24} /> : 
                   item.type === 'Mileage' ? <MapPin size={24} /> : 
                   <FileEdit size={24}/>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-lg">{item.user}</h4>
                    {item.type === 'Correction' && (
                      <span className="px-2 py-0.5 rounded bg-amber-900/50 text-amber-400 text-[10px] font-bold uppercase border border-amber-900">
                        Action Required
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400 mt-1">
                    <span className="font-medium text-slate-300">{item.type}</span>
                    <span>•</span>
                    <span>{item.date}</span>
                    {item.job && (
                      <>
                        <span>•</span>
                        <span className="text-teal-500">{item.job}</span>
                      </>
                    )}
                  </div>
                  
                  {item.note ? (
                    <div className="mt-3 bg-amber-950/30 border border-amber-900/50 p-3 rounded-lg flex gap-2">
                      <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5"/>
                      <p className="text-sm text-amber-200">"{item.note}"</p>
                    </div>
                  ) : (
                    <div className="mt-2 text-slate-200 font-mono bg-slate-950 px-2 py-1 rounded w-fit text-sm border border-slate-800">
                      {item.detail}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 w-full lg:w-auto border-t lg:border-t-0 border-slate-800 pt-4 lg:pt-0">
                <button className="flex-1 lg:flex-none flex items-center justify-center space-x-2 px-4 py-2 rounded-lg border border-red-900/50 text-red-400 hover:bg-red-900/20 transition-colors">
                  <XCircle size={18} />
                  <span>Reject</span>
                </button>
                <button className="flex-1 lg:flex-none flex items-center justify-center space-x-2 px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-500 transition-colors shadow-lg shadow-teal-900/20">
                  <CheckCircle size={18} />
                  <span>Approve</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
            <p className="text-slate-500">No pending {filter !== 'all' ? filter : ''} requests.</p>
          </div>
        )}
      </div>
    </div>
  );
};