import React from 'react';
import { Download, FileText, Calendar, Table } from 'lucide-react';

export const Exports: React.FC = () => {
  const downloadCSV = (type: string) => {
    // Basic headers with no data for now
    const csvContent = "data:text/csv;charset=utf-8,Date,Employee,Type,Details,Status\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `qynex_${type}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ExportCard = ({ title, desc, icon: Icon, type }: any) => (
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-teal-500/50 transition-colors group">
          <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-slate-950 rounded-lg group-hover:bg-teal-900/20 transition-colors">
                  <Icon className="text-slate-400 group-hover:text-teal-400" size={24}/>
              </div>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
          <p className="text-sm text-slate-400 mb-6 min-h-[40px]">{desc}</p>
          <button 
            onClick={() => downloadCSV(type)}
            className="w-full py-2 bg-slate-950 border border-slate-700 text-slate-300 rounded-lg hover:text-white hover:border-teal-500 hover:bg-teal-900/10 transition-all flex items-center justify-center gap-2"
          >
              <Download size={16}/>
              <span>Download CSV</span>
          </button>
      </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Data Exports</h2>
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button className="px-3 py-1 text-xs font-bold text-teal-400 bg-slate-800 rounded">Last 7 Days</button>
            <button className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-white">This Month</button>
            <button className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-white">Custom</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ExportCard 
            title="Payroll Hours" 
            desc="Detailed shift hours, overtime calculations, and approval status." 
            icon={Calendar}
            type="hours"
          />
          <ExportCard 
            title="Job Summary" 
            desc="Hours aggregated by Job, Task, and Subtask codes for billing." 
            icon={Table}
            type="jobs"
          />
          <ExportCard 
            title="Mileage Logs" 
            desc="GPS-verified mileage reports with drive time and excluded idle time." 
            icon={FileText}
            type="mileage"
          />
          <ExportCard 
            title="Audit & Exceptions" 
            desc="Correction requests, auto-clockouts, and location verification failures." 
            icon={FileText}
            type="audit"
          />
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mt-8">
          <h3 className="font-bold text-white mb-4">Export Preview (Payroll)</h3>
          <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-400">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-950">
                      <tr>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Employee</th>
                          <th className="px-6 py-3">In</th>
                          <th className="px-6 py-3">Out</th>
                          <th className="px-6 py-3">Job Code</th>
                          <th className="px-6 py-3">Total</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-600 italic">
                              No data available for export in the selected period.
                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};