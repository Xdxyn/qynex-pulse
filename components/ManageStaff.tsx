
import React, { useEffect, useState } from 'react';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { Profile, UserRole } from '../types';
import { Loader2, Plus, Edit, Trash2, X, Search, Mail, Shield, User } from 'lucide-react';

export const ManageStaff: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({ 
      name: '', 
      email: '', 
      role: 'RBT' as UserRole
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;

      // Map DB columns (handling potential schema changes like full_name vs name)
      const mappedUsers: Profile[] = (data || []).map((u: any) => ({
          id: u.id,
          name: u.full_name || u.name || 'Unknown', // Fallback to handle both
          email: u.email,
          role: u.role,
          avatar: u.avatar,
          status: u.status
      })).sort((a, b) => a.name.localeCompare(b.name));

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this staff member?')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      setUsers(users.filter(u => u.id !== id));
    } catch (error: any) {
      alert('Error deleting user: ' + error.message);
    }
  };

  const openModal = (user?: Profile) => {
    if (user) {
      setEditingUser(user);
      setFormData({ 
          name: user.name, 
          email: user.email, 
          role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({ 
          name: '', 
          email: '', 
          role: 'RBT' 
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) return;
    setIsSaving(true);
    try {
      if (editingUser) {
        // --- EDIT EXISTING USER ---
        const { error } = await supabase.from('profiles').update({ 
            full_name: formData.name, 
            email: formData.email, 
            role: formData.role 
        }).eq('id', editingUser.id);
        
        if (error) throw error;
      } else {
        // --- CREATE NEW USER ---
        
        // 1. Generate Temporary Password
        const tempPassword = `Pulse${Math.floor(1000 + Math.random() * 9000)}!`;

        // 2. Create Auth User using a TEMPORARY client
        // We use a separate client so we don't overwrite the current Admin's session in localStorage
        const tempClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: false, // Vital: Do not persist this session
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });

        const { data: authData, error: authError } = await tempClient.auth.signUp({
            email: formData.email,
            password: tempPassword,
        });

        if (authError) throw authError;
        if (!authData.user || !authData.user.id) {
            throw new Error("Failed to generate Auth ID. Please try again.");
        }

        // 3. Create Profile linked to the new Auth ID
        // Note: Using 'full_name' for database column mapping
        const profilePayload = { 
            id: authData.user.id, // Explicitly link to Auth User ID
            full_name: formData.name, 
            email: formData.email, 
            role: formData.role, // Sends "Admin / Manager" etc.
            status: 'active'
        };

        const { error: profileError } = await supabase.from('profiles').insert([profilePayload]);

        if (profileError) {
             // If profile fails, log it. In a real app we might revert auth creation.
             console.error("Profile creation error:", profileError);
             throw new Error(`Auth created, but profile failed: ${profileError.message}`);
        }

        // 4. Simulate Email Delivery
        alert(
            `SUCCESS: Staff member added!\n\n` +
            `--- [SIMULATED EMAIL SENT TO ${formData.email}] ---\n\n` +
            `Subject: Welcome to Qynex Pulse\n\n` +
            `Hello ${formData.name},\n\n` +
            `Your account has been created.\n` +
            `Login Email: ${formData.email}\n` +
            `Temporary Password: ${tempPassword}\n\n` +
            `Please log in and change your password.`
        );
      }
      
      // Close and Refresh
      await fetchUsers();
      setIsModalOpen(false);
      
    } catch (error: any) {
      alert('Failed to save: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        {/* Placeholder for alignment */}
        <div className="flex-1"></div> 
        <button 
            onClick={() => openModal()} 
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-teal-900/20"
        >
            <Plus size={18} />
            <span>+ Add New Staff</span>
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/50">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                    type="text" 
                    placeholder="Search staff..." 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-teal-500 outline-none transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {loading ? (
             <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p>Loading staff...</p>
            </div>
        ) : (
            <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-950 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                        <th className="px-6 py-4 border-b border-slate-800">Name</th>
                        <th className="px-6 py-4 border-b border-slate-800">Role</th>
                        <th className="px-6 py-4 border-b border-slate-800">Email Address</th>
                        <th className="px-6 py-4 border-b border-slate-800 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 border border-slate-700">
                                    {user.avatar ? <img src={user.avatar} alt="av" className="w-full h-full rounded-full"/> : <User size={14} />}
                                </div>
                                {user.name}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                    user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'Admin / Manager' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                                    user.role === 'BCBA' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    user.role === 'RBT' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                                    'bg-slate-800 text-slate-400 border-slate-700'
                                }`}>
                                    {user.role}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-slate-300 flex items-center gap-2">
                                <Mail size={14} className="text-slate-600" />
                                {user.email}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => openModal(user)} className="p-2 text-slate-500 hover:text-white rounded-lg transition-colors"><Edit size={16}/></button>
                                    <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-500 hover:text-red-400 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-slate-500">No staff found.</td></tr>
                    )}
                </tbody>
            </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                    <div>
                        <h3 className="text-xl font-bold text-white">{editingUser ? 'Edit Staff Member' : 'Add New Staff'}</h3>
                        <p className="text-xs text-slate-400">
                            {editingUser ? 'Update details below.' : 'A temporary password will be generated.'}
                        </p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X size={24}/></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Full Name</label>
                        <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-teal-500" placeholder="e.g. Jane Doe" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Role</label>
                        <select className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-teal-500" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}>
                            <option value="RBT">RBT (Technician)</option>
                            <option value="BCBA">BCBA (Supervisor)</option>
                            <option value="Admin / Manager">Admin / Manager</option>
                            <option value="Staff">Staff (Generic)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email Address</label>
                        <input type="email" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-teal-500" placeholder="e.g. jane@company.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-400 bg-slate-800 hover:bg-slate-700">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving || !formData.name || !formData.email} className="flex-[2] py-3 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-500 flex justify-center gap-2 transition-all shadow-lg shadow-teal-900/20">
                            {isSaving && <Loader2 className="animate-spin" size={20} />} 
                            {editingUser ? 'Save Changes' : 'Add Staff Member'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
