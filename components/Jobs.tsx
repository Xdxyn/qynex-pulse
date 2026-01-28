
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Job, Location, Client, TaskItem } from '../types';
import { Loader2, Plus, Edit, Trash2, Search, MapPin, CheckSquare, Users, Building } from 'lucide-react';
import { ManageStaff } from './ManageStaff';

type ViewState = 'CLIENTS' | 'LOCATIONS' | 'TASKS' | 'STAFF';

export const Jobs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ViewState>('CLIENTS');
  
  // Data State
  const [locations, setLocations] = useState<Location[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]); 
  const [loading, setLoading] = useState(true);
  
  // Common Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Editing items
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    clientName: '',
    locName: '',
    locAddress: '',
    taskName: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Clients
      const { data: clientData } = await supabase.from('clients').select('*').order('name');
      
      // AUTO-CLEANUP: Kill the Ghost Client if found
      const ghostClient = clientData?.find(c => c.name === 'SystemConfig');
      if (ghostClient) {
          console.log("Removing Ghost Client 'SystemConfig'...");
          await supabase.from('clients').delete().eq('id', ghostClient.id);
          // Refetch to clean array
          const { data: refreshedClients } = await supabase.from('clients').select('*').order('name');
          setClients(refreshedClients || []);
      } else {
          setClients(clientData || []);
      }

      // 2. Fetch Locations
      const { data: locData } = await supabase.from('locations').select('*').order('name');
      setLocations(locData || []);

      // 3. Fetch Tasks (Using task_name column)
      const { data: taskData } = await supabase.from('tasks').select('*').order('task_name');
      setTasks(taskData || []);

    } catch (error: any) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
    setEditingClient(null);
    setEditingLocation(null);
    setEditingTask(null);
    setFormData({
        clientName: '',
        locName: '',
        locAddress: '',
        taskName: '',
    });
    setIsModalOpen(false);
  };

  // --- Handlers: CLIENTS ---
  const handleSaveClient = async () => {
    if (!formData.clientName) return;
    setIsSaving(true);
    try {
        if (editingClient) {
            await supabase.from('clients').update({ name: formData.clientName }).eq('id', editingClient.id);
        } else {
            await supabase.from('clients').insert([{ name: formData.clientName }]);
        }
        await fetchData();
        resetForms();
    } catch (e: any) { alert(e.message); } finally { setIsSaving(false); }
  };
  const handleDeleteClient = async (id: string) => {
    if (!confirm('Delete this Client?')) return;
    await supabase.from('clients').delete().eq('id', id);
    fetchData();
  };

  // --- Handlers: LOCATIONS ---
  const handleSaveLocation = async () => {
    if (!formData.locName) return;
    setIsSaving(true);
    try {
        if (editingLocation) {
            await supabase.from('locations').update({ name: formData.locName, address: formData.locAddress }).eq('id', editingLocation.id);
        } else {
            await supabase.from('locations').insert([{ name: formData.locName, address: formData.locAddress }]);
        }
        await fetchData();
        resetForms();
    } catch (e: any) { alert(e.message); } finally { setIsSaving(false); }
  };
  const handleDeleteLocation = async (id: string) => {
    if (!confirm('Delete this Location?')) return;
    await supabase.from('locations').delete().eq('id', id);
    fetchData();
  };

  // --- Handlers: TASKS ---
  const handleSaveTask = async () => {
    if (!formData.taskName) {
        alert("Please enter a Task Name.");
        return;
    }
    setIsSaving(true);
    try {
        // Use 'task_name' as requested
        const payload = { task_name: formData.taskName };
        if (editingTask) {
            await supabase.from('tasks').update(payload).eq('id', editingTask.id);
        } else {
            await supabase.from('tasks').insert([payload]);
        }
        await fetchData();
        resetForms();
    } catch (e: any) { alert(e.message); } finally { setIsSaving(false); }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Delete this Task?')) return;
    await supabase.from('tasks').delete().eq('id', id);
    fetchData();
  };

  // --- Edit Task Setup ---
  const setupEditTask = (task: any) => {
      setEditingTask(task);
      setFormData({
          ...formData,
          taskName: task.task_name,
      });
      setIsModalOpen(true);
  };

  // --- Filter Logic ---
  const filteredData = () => {
      const lower = searchTerm.toLowerCase();
      if (activeTab === 'CLIENTS') return clients.filter(c => c.name.toLowerCase().includes(lower));
      if (activeTab === 'LOCATIONS') return locations.filter(l => l.name.toLowerCase().includes(lower) || l.address.toLowerCase().includes(lower));
      if (activeTab === 'TASKS') return tasks.filter(t => t.task_name && t.task_name.toLowerCase().includes(lower));
      return [];
  };

  const TabButton = ({ id, label, icon: Icon }: { id: ViewState, label: string, icon: any }) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === id 
            ? 'border-teal-500 text-teal-400 bg-teal-950/10' 
            : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900'
        }`}
    >
        <Icon size={18} />
        <span>{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto">
        {/* Header / Tabs */}
        <div className="mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">The Hub</h2>
            <p className="text-slate-400 mb-6">Manage Clients, Locations, Tasks, and Staff.</p>
            
            <div className="flex flex-wrap border-b border-slate-800">
                <TabButton id="CLIENTS" label="1. Clients" icon={Building} />
                <TabButton id="LOCATIONS" label="2. Locations" icon={MapPin} />
                <TabButton id="TASKS" label="3. Tasks" icon={CheckSquare} />
                <TabButton id="STAFF" label="4. Staff" icon={Users} />
            </div>
        </div>

        {/* --- TAB CONTENT: STAFF --- */}
        {activeTab === 'STAFF' ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <ManageStaff />
            </div>
        ) : (
            /* --- SHARED LIST VIEW --- */
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="text" 
                            placeholder={`Search ${activeTab.toLowerCase()}...`} 
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-teal-500 outline-none" 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                        />
                    </div>
                    
                    <button 
                        onClick={() => { resetForms(); setIsModalOpen(true); }}
                        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-teal-900/20"
                    >
                        <Plus size={18} />
                        <span>
                            {activeTab === 'CLIENTS' ? '+ Add New Client' : 
                             activeTab === 'LOCATIONS' ? '+ Add New Location' : 
                             '+ Add New Task'}
                        </span>
                    </button>
                </div>

                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-950 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                            <tr>
                                {activeTab === 'CLIENTS' && <th>Client Name</th>}
                                
                                {activeTab === 'LOCATIONS' && <><th>Site Name</th><th>Address</th></>}
                                
                                {activeTab === 'TASKS' && <th>Task Code / Name</th>}
                                
                                <th className="text-right px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {/* CLIENTS ROWS */}
                            {activeTab === 'CLIENTS' && (filteredData() as Client[]).map(c => (
                                <tr key={c.id} className="hover:bg-slate-800/50">
                                    <td className="px-6 py-4 font-bold text-white">{c.name}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => { setEditingClient(c); setFormData({...formData, clientName: c.name}); setIsModalOpen(true); }} className="p-2 text-slate-500 hover:text-white mr-2"><Edit size={16}/></button>
                                        <button onClick={() => handleDeleteClient(c.id)} className="p-2 text-slate-500 hover:text-red-400"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}

                            {/* LOCATIONS ROWS */}
                            {activeTab === 'LOCATIONS' && (filteredData() as Location[]).map(l => (
                                <tr key={l.id} className="hover:bg-slate-800/50">
                                    <td className="px-6 py-4 font-bold text-white">{l.name}</td>
                                    <td className="px-6 py-4 text-slate-400">{l.address}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => { setEditingLocation(l); setFormData({...formData, locName: l.name, locAddress: l.address}); setIsModalOpen(true); }} className="p-2 text-slate-500 hover:text-white mr-2"><Edit size={16}/></button>
                                        <button onClick={() => handleDeleteLocation(l.id)} className="p-2 text-slate-500 hover:text-red-400"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}

                            {/* TASKS ROWS */}
                            {activeTab === 'TASKS' && (filteredData() as TaskItem[]).map(t => (
                                <tr key={t.id} className="hover:bg-slate-800/50">
                                    <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                                        <CheckSquare size={16} className="text-teal-500" />
                                        {t.task_name}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => setupEditTask(t)} className="p-2 text-slate-500 hover:text-white mr-2"><Edit size={16}/></button>
                                        <button onClick={() => handleDeleteTask(t.id)} className="p-2 text-slate-500 hover:text-red-400"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}

                            {filteredData().length === 0 && (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-500">No records found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- MODALS --- */}
        {isModalOpen && activeTab !== 'STAFF' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md p-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                        {activeTab === 'CLIENTS' ? (editingClient ? 'Edit Client' : 'Add New Client') : 
                         activeTab === 'LOCATIONS' ? (editingLocation ? 'Edit Location' : 'Add New Location') :
                         (editingTask ? 'Edit Task' : 'Create New Task')}
                    </h3>
                    
                    <div className="space-y-4">
                        {/* CLIENTS FORM */}
                        {activeTab === 'CLIENTS' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Client Name (Payer)</label>
                                <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-teal-500" placeholder="e.g. Gold" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} />
                            </div>
                        )}

                        {/* LOCATIONS FORM */}
                        {activeTab === 'LOCATIONS' && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Site Name</label>
                                    <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-teal-500" placeholder="e.g. Northside Hospital" value={formData.locName} onChange={e => setFormData({...formData, locName: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Address</label>
                                    <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-teal-500" placeholder="e.g. 100 Main St" value={formData.locAddress} onChange={e => setFormData({...formData, locAddress: e.target.value})} />
                                </div>
                            </>
                        )}

                        {/* TASKS FORM (Simplified - Master List Only) */}
                        {activeTab === 'TASKS' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Task Code / Name</label>
                                <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-teal-500" placeholder="e.g. 97151 Assessment" value={formData.taskName} onChange={e => setFormData({...formData, taskName: e.target.value})} />
                                <p className="text-[10px] text-slate-500 mt-2 italic">This task will be available in the master checklist.</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button onClick={resetForms} className="flex-1 py-3 rounded-xl font-bold text-slate-400 bg-slate-800 hover:bg-slate-700">Cancel</button>
                        <button onClick={() => {
                            if (activeTab === 'CLIENTS') handleSaveClient();
                            else if (activeTab === 'LOCATIONS') handleSaveLocation();
                            else handleSaveTask();
                        }} disabled={isSaving} className="flex-[2] py-3 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-500 flex justify-center gap-2">{isSaving && <Loader2 className="animate-spin"/>} Save</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
