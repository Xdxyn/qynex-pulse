import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Layout } from './components/ui/Layout';
import { TimeClock } from './components/TimeClock';
import { LiveMap } from './components/LiveMap';
import { Scheduler } from './components/AiScheduler';
import { Approvals } from './components/Approvals';
import { Settings } from './components/Settings';
import { Exports } from './components/Exports';
import { ClientPortal } from './components/ClientPortal';
import { Auth } from './components/Auth';
import { AppState, Profile } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { Loader2 } from 'lucide-react';
import { useTracking } from './hooks/useTracking';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeclock');
  
  // Custom Hook for Tracking Logic
  const { activeShift, startShift, endShift, gpsStatus, gpsSyncStatus, authError } = useTracking(currentUser?.id);

  const [state, setState] = useState<AppState>({
    user: {} as Profile, 
    settings: DEFAULT_SETTINGS,
    activeShift: null, // Will be overridden by useTracking
    activeTrip: null,
    activeJobConfig: null
  });

  useEffect(() => {
    // Check active session
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
          console.error('Error fetching profile:', error);
      } else if (data) {
          const profile: Profile = {
              ...data,
              role: data.role || 'STAFF', 
              avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=0D8ABC&color=fff`
          };
          setCurrentUser(profile);
          setState(prev => ({ ...prev, user: profile }));
          
          if (profile.role === 'CLIENT') {
            setActiveTab('client_portal');
          }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = (key: keyof typeof DEFAULT_SETTINGS.features) => {
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        features: {
          ...prev.settings.features,
          [key]: !prev.settings.features[key]
        }
      }
    }));
  };

  const renderContent = () => {
    if (!state.user) return null;

    if (activeTab === 'timeclock' && !state.settings.features.timeClock) return <FeatureDisabled />;
    if (activeTab === 'livemap' && !state.settings.features.liveMap) return <FeatureDisabled />;
    
    switch (activeTab) {
      case 'timeclock':
        return (
          <TimeClock 
            activeShift={activeShift}
            onClockIn={startShift}
            onClockOut={endShift}
            gpsStatus={gpsStatus}
            gpsSyncStatus={gpsSyncStatus}
            authError={authError}
          />
        );
      case 'livemap':
        return <LiveMap />;
      case 'schedule':
        return <Scheduler />;
      case 'approvals':
        return <Approvals />;
      case 'exports':
        return <Exports />;
      case 'client_portal':
        return <ClientPortal />;
      case 'settings':
        return <Settings settings={state.settings} onToggleFeature={toggleFeature} />;
      default:
        return <div>Not found</div>;
    }
  };

  const FeatureDisabled = () => (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
          <h3 className="text-xl font-bold mb-2">Feature Disabled</h3>
          <p>This module has been disabled by your organization settings.</p>
      </div>
  );

  if (loading) {
      return (
          <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-teal-500">
              <Loader2 size={48} className="animate-spin" />
          </div>
      )
  }

  if (!session || !currentUser) {
    return <Auth />;
  }

  return (
    <Layout 
      user={currentUser} 
      settings={state.settings}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <div className="flex flex-col h-full">
         <div className="flex-1">
             {renderContent()}
         </div>
      </div>
    </Layout>
  );
};

export default App;