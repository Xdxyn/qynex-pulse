import { OrganizationSettings, Profile, Job } from './types';

export const DEFAULT_SETTINGS: OrganizationSettings = {
  features: {
    timeClock: true,
    mileage: true,
    liveMap: true,
    aiScheduling: true,
    approvals: true,
    clientPortal: true
  }
};

export const MOCK_JOBS: Job[] = [];

// Generic Admin Profile
export const MOCK_USERS: Profile[] = [
  { 
    id: 'u1', 
    name: 'Admin User', 
    email: 'admin@qynex.com',
    role: 'OWNER', 
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff', 
    status: 'active'
  }
];

export const MOCK_PENDING_APPROVALS: any[] = [];