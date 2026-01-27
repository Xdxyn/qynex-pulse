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
  Download
} from 'lucide-react';
import { OrganizationSettings, Profile } from '../../types';
import { supabase } from '../../supabaseClient';

interface LayoutProps {
  children: React.ReactNode;
  user: Profile;
  settings: OrganizationSettings;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  user, 
  settings, 
  activeTab, 
  onTabChange 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // App.tsx handles the state change via onAuthStateChange
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const NavItem = ({ id, icon: Icon, label, show }: { id: string, icon: any, label: string, show: boolean }) => {
    if (!show) return null;
    return (
      <button
        onClick={() => {
          onTabChange(id);
          setIsMobileMenuOpen(false);
        }}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
          activeTab === id 
            ? 'bg-teal-600/10 text-teal-400 border-l-4 border-teal-500' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
        }`}
      >
        <Icon size={20} className={activeTab === id ? 'text-teal-400' : ''} />
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  const isManagement = ['OWNER', 'ADMIN', 'MANAGER'].includes(user.role);
  const isClient = user.role === 'CLIENT';

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-teal-500/30">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-slate-925">
        <div className="p-6 flex items-center space-x-2 border-b border-slate-800">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-teal-900/20">
            <span className="font-bold text-white text-xl">Q</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Qynex Pulse</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {!isClient && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Workspace
              </div>
              <NavItem 
                id="timeclock" 
                icon={Clock} 
                label="Time Clock" 
                show={settings.features.timeClock} 
              />
            </>
          )}

          {isClient && (
             <>
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
          
          {(isManagement) && (
            <>
              <div className="px-4 py-2 mt-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Operations
              </div>
              <NavItem 
                id="livemap" 
                icon={MapIcon} 
                label="Live Map" 
                show={settings.features.liveMap} 
              />
              <NavItem 
                id="schedule" 
                icon={Calendar} 
                label="Scheduler" 
                show={settings.features.aiScheduling} 
              />
              <NavItem 
                id="approvals" 
                icon={CheckSquare} 
                label="Approvals" 
                show={settings.features.approvals} 
              />
               <NavItem 
                id="exports" 
                icon={Download} 
                label="Data Exports" 
                show={true} 
              />
            </>
          )}

          <div className="px-4 py-2 mt-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            System
          </div>
          {user.role === 'OWNER' && (
             <NavItem id="settings" icon={Settings} label="Org Settings" show={true} />
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 p-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
            {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-slate-700" />
            ) : (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">{user.name.charAt(0)}</div>
            )}
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-teal-500 truncate flex items-center gap-1 font-bold">
                <ShieldCheck size={10} />
                {user.role}
              </p>
            </div>
            <button 
              onClick={handleLogout}
              className="text-slate-400 hover:text-white transition-colors"
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white">Q</span>
            </div>
            <span className="font-bold text-white">Qynex Pulse</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-slate-300 hover:text-white"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-sm p-4">
             <div className="flex justify-end mb-4">
               <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400">
                 <LogOut size={24} className="rotate-180"/>
               </button>
             </div>
             <nav className="space-y-2">
                {!isClient && <NavItem id="timeclock" icon={Clock} label="Time Clock" show={settings.features.timeClock} />}
                {isClient && <NavItem id="client_portal" icon={Calendar} label="My Schedule" show={settings.features.clientPortal} />}
                {isManagement && (
                  <>
                    <NavItem id="livemap" icon={MapIcon} label="Live Map" show={settings.features.liveMap} />
                    <NavItem id="schedule" icon={Calendar} label="Scheduler" show={settings.features.aiScheduling} />
                    <NavItem id="approvals" icon={CheckSquare} label="Approvals" show={settings.features.approvals} />
                    <NavItem id="exports" icon={Download} label="Data Exports" show={true} />
                  </>
                )}
                 {user.role === 'OWNER' && <NavItem id="settings" icon={Settings} label="Settings" show={true} />}
                 
                 <div className="pt-6 mt-6 border-t border-slate-800">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <LogOut size={20} />
                      <span className="font-medium">Log Out</span>
                    </button>
                 </div>
             </nav>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};