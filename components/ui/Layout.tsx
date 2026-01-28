
import React from 'react';
import { 
  Menu, 
  Clock, 
  Map as MapIcon, 
  Calendar, 
  CheckSquare, 
  Settings, 
  LogOut, 
  ShieldCheck,
  Download,
  History,
  X,
  Briefcase,
  Users
} from 'lucide-react';
import { OrganizationSettings, Profile } from '../../types';

interface LayoutProps {
  children: React.ReactNode;
  user: Profile;
  settings: OrganizationSettings;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  user, 
  settings, 
  activeTab, 
  onTabChange,
  onLogout
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const NavItem = ({ id, icon: Icon, label, show }: { id: string, icon: any, label: string, show: boolean }) => {
    if (!show) return null;
    return (
      <button
        onClick={() => {
          onTabChange(id);
          setIsMobileMenuOpen(false);
        }}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
          activeTab === id 
            ? 'bg-teal-600/15 text-teal-400 border-l-4 border-teal-500 shadow-lg shadow-teal-900/10' 
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
        }`}
      >
        <Icon size={20} className={`${activeTab === id ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'} transition-colors`} />
        <span className="font-semibold tracking-wide">{label}</span>
      </button>
    );
  };

  const isManagement = ['OWNER', 'ADMIN', 'MANAGER', 'Admin / Manager'].includes(user.role);
  const isClient = user.role === 'CLIENT';

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-teal-500/30">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-slate-925 shadow-2xl">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800/50">
          <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-900/30">
            <span className="font-black text-white text-xl">Q</span>
          </div>
          <span className="text-xl font-black tracking-tight text-white">Qynex Pulse</span>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {!isClient && (
            <>
              <div className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                Workflow
              </div>
              <NavItem 
                id="timeclock" 
                icon={Clock} 
                label="Time Clock" 
                show={true}
              />
              <NavItem 
                id="history" 
                icon={History} 
                label="Shift History" 
                show={true}
              />
            </>
          )}

          <div className="px-4 py-3 mt-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
            Admin Dashboard
          </div>
          <NavItem 
            id="manage_jobs" 
            icon={Briefcase} 
            label="The Hub" 
            show={true} 
          />
          <NavItem 
            id="approvals" 
            icon={CheckSquare} 
            label="Approvals" 
            show={true} 
          />
          <NavItem 
            id="manage_staff" 
            icon={Users} 
            label="Manage Staff" 
            show={isManagement} 
          />

          {isManagement && (
            <>
              <NavItem 
                id="livemap" 
                icon={MapIcon} 
                label="Live Map" 
                show={settings.features.liveMap} 
              />
              <NavItem 
                id="schedule" 
                icon={Calendar} 
                label="Staff Scheduler" 
                show={settings.features.aiScheduling} 
              />
               <NavItem 
                id="exports" 
                icon={Download} 
                label="Data Exports" 
                show={true} 
              />
            </>
          )}

          {isClient && (
             <>
              <div className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                Portal
              </div>
               <NavItem 
                id="client_portal" 
                icon={Calendar} 
                label="My Schedule" 
                show={settings.features.clientPortal} 
              />
             </>
          )}

          <div className="px-4 py-3 mt-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
            System
          </div>
          {user.role === 'OWNER' && (
             <NavItem id="settings" icon={Settings} label="Org Settings" show={true} />
          )}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800 shadow-inner">
            {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full border border-slate-700 shadow-sm" />
            ) : (
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold border border-slate-700">{user.name.charAt(0)}</div>
            )}
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-teal-500 truncate flex items-center gap-1 font-black uppercase tracking-wider">
                <ShieldCheck size={10} />
                {user.role}
              </p>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800 shadow-lg z-20">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white">Q</span>
            </div>
            <span className="font-black text-white tracking-tight">Qynex Pulse</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-teal-400 transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {isMobileMenuOpen && (
          <div className="md:hidden absolute inset-0 z-50 bg-slate-950/98 backdrop-blur-xl p-6 animate-in fade-in duration-200">
             <div className="flex justify-between items-center mb-8">
               <div className="flex items-center space-x-2">
                 <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
                   <span className="font-black text-white text-xl">Q</span>
                 </div>
                 <span className="text-xl font-black text-white">Navigation</span>
               </div>
               <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-500">
                 <X size={28} />
               </button>
             </div>
             
             <nav className="space-y-2">
                {!isClient && (
                  <>
                    <NavItem id="timeclock" icon={Clock} label="Time Clock" show={true} />
                    <NavItem id="history" icon={History} label="Shift History" show={true} />
                  </>
                )}
                <NavItem id="manage_jobs" icon={Briefcase} label="The Hub" show={true} />
                <NavItem id="approvals" icon={CheckSquare} label="Approvals" show={true} />
                <NavItem id="manage_staff" icon={Users} label="Manage Staff" show={isManagement} />
                {isManagement && (
                  <>
                    <NavItem id="livemap" icon={MapIcon} label="Live Map" show={settings.features.liveMap} />
                    <NavItem id="schedule" icon={Calendar} label="Staff Scheduler" show={settings.features.aiScheduling} />
                    <NavItem id="exports" icon={Download} label="Data Exports" show={true} />
                  </>
                )}
                {isClient && <NavItem id="client_portal" icon={Calendar} label="My Schedule" show={settings.features.clientPortal} />}
                {user.role === 'OWNER' && <NavItem id="settings" icon={Settings} label="Settings" show={true} />}
                 <div className="pt-6 mt-6 border-t border-slate-800">
                    <button 
                      onClick={onLogout}
                      className="w-full flex items-center space-x-4 px-4 py-4 rounded-xl text-red-400 bg-red-950/10 border border-red-900/20 font-bold transition-all"
                    >
                      <LogOut size={20} />
                      <span>Sign Out</span>
                    </button>
                 </div>
             </nav>
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
