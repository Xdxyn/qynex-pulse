export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'CLIENT';

// Supabase Table: profiles
export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  
  // UI-only extensions
  avatar?: string;
  status?: 'active' | 'break' | 'offline';
  lastPing?: number;
  lastLocation?: { lat: number; lng: number; accuracy: number };
  currentJobCode?: {
    jobName: string;
    taskName: string;
    subtaskName: string;
  };
}

// Supabase Table: jobs
export interface Job {
  id: string;
  name: string;
  client_name: string; // db column
  status: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  name: string;
  subtasks: Subtask[];
}

export interface Subtask {
  id: string;
  name: string;
}

// Supabase Table: shifts
export interface Shift {
  id: string;
  user_id: string;
  clock_in: string; // ISO timestamp
  clock_out?: string; // ISO timestamp
  status: 'active' | 'completed' | 'auto_clockout' | 'driving';
  total_miles: number;
  
  // Job Coding Fields (Supabase)
  client_name?: string;
  job_name?: string;
  task_name?: string;
  subtask_name?: string;

  // UI helpers
  type?: 'shift' | 'break'; 
  jobId?: string;
  taskId?: string;
  subtaskId?: string;
}

// Supabase Table: breadcrumbs
export interface Breadcrumb {
  shift_id: string;
  lat: number;
  lng: number;
  accuracy: number;
  speed: number;
  timestamp: string; // Supabase uses ISO string
  isDriving?: boolean;
}

// --- UI / App State Types ---

export interface OrganizationSettings {
  features: {
    timeClock: boolean;
    mileage: boolean;
    liveMap: boolean;
    aiScheduling: boolean;
    approvals: boolean;
    clientPortal: boolean;
  };
}

export interface ScheduleItem {
  id: string;
  employeeName: string;
  day: string;
  startTime: string;
  endTime: string;
  role: string;
}

export interface AppState {
  user: Profile; 
  settings: OrganizationSettings;
  activeShift: Shift | null;
  activeTrip: { id: string, breadcrumbs: Breadcrumb[] } | null;
  activeJobConfig: { job: Job, task: Task, subtask: Subtask } | null;
}