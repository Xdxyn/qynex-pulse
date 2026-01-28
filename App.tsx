
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Layout } from './components/ui/Layout';
import { TimeClock } from './components/TimeClock';
import { ShiftHistory } from './components/ShiftHistory';
import { Approvals } from './components/Approvals';
import { Jobs } from './components/Jobs';
import { ManageStaff } from './components/ManageStaff';
import { Auth } from './components/Auth';
import { Profile } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { Loader2 } from 'lucide-react';
import { useTracking } from './hooks/useTracking';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeclock');

  // Basic tracking hook to update UI active state
  const { refreshShift } = useTracking(currentUser?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) {
          setCurrentUser({ ...data, role: data.role || 'STAFF' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'timeclock':
        return <TimeClock onShiftChange={refreshShift} user={currentUser || undefined} />;
      case 'history': 
        return currentUser ? <ShiftHistory userId={currentUser.id} /> : null;
      case 'approvals': 
        return <Approvals />;
      case 'manage_jobs':
        return <Jobs />;
      case 'manage_staff':
        return <ManageStaff />;
      default: 
        return <div className="p-12 text-slate-500 text-center">Module not found.</div>;
    }
  };

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-teal-500 gap-4">
        <Loader2 size={64} className="animate-spin" />
        <span className="text-xs font-black uppercase tracking-[0.3em]">Loading Pulse...</span>
    </div>
  );
  
  if (!session || !currentUser) return <Auth />;

  return (
    <Layout 
        user={currentUser} 
        settings={DEFAULT_SETTINGS} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={handleLogout}
    >
      <div className="flex flex-col h-full">
          <div className="flex-1 h-full">{renderContent()}</div>
      </div>
    </Layout>
  );
};

export default App;
