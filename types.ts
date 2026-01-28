
/* 
   !!! DATABASE SCHEMA UPDATE REQUIRED !!!
   Run this SQL in your Supabase SQL Editor:

   -- 1. Create Locations Parent Table
   create table if not exists locations (
     id uuid default gen_random_uuid() primary key,
     name text not null,
     address text not null,
     created_at timestamptz default now()
   );

   -- 2. Create Clients Table
   create table if not exists clients (
     id uuid default gen_random_uuid() primary key,
     name text not null,
     created_at timestamptz default now()
   );

   -- 3. Update Jobs to link to Locations and Clients
   alter table jobs add column if not exists location_id uuid references locations(id);
   alter table jobs add column if not exists client_id uuid references clients(id);

   -- 4. Create Master Tasks Table (Simple List)
   create table if not exists tasks (
     id uuid default gen_random_uuid() primary key,
     task_name text not null, -- CHANGED to task_name
     created_at timestamptz default now()
   );

   -- 5. Add Columns to Shifts for Task Tracking
   alter table shifts add column if not exists subtask_note text;
   alter table shifts add column if not exists completed_tasks text; -- CHANGED to completed_tasks
*/

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'BCBA' | 'RBT' | 'STAFF' | 'CLIENT' | 'Admin / Manager' | 'Staff';

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

// Supabase Table: locations (Parent)
export interface Location {
  id: string;
  name: string;   // e.g. "Explore ES"
  address: string;
}

// Supabase Table: clients (Parent)
export interface Client {
  id: string;
  name: string;
}

// Supabase Table: tasks (Master List)
export interface TaskItem {
  id: string;
  task_name: string; // Maps to DB column 'task_name'
}

// Supabase Table: jobs (Child - Now referred to as PROJECTS)
export interface Job {
  id: string;
  name: string;        // "Project Name" in UI
  status: string;
  
  // Parent Relation: Client
  client_id?: string;
  clients?: Client;    // Joined data
  client_name?: string; // Legacy/Fallback text field

  // Parent Relation: Location
  location_id?: string;
  locations?: Location; // Joined data
}

// Supabase Table: shifts
export interface Shift {
  id: string;
  user_id: string;
  clock_in: string; // ISO timestamp
  clock_out?: string; // ISO timestamp
  status: 'active' | 'completed' | 'auto_clockout' | 'driving' | 'pending';
  total_miles: number;
  
  // Job Coding Fields (Supabase)
  client_name?: string;
  job_name?: string;
  
  completed_tasks?: string; // Comma separated list of checked tasks (DB column: completed_tasks)
  subtask_note?: string; // Free text note (e.g., "Observation in cafeteria")
  
  job_id?: string; 

  // Notes
  employee_notes?: string; 
  admin_notes?: string;   
  
  // Correction Requests
  correction_request?: string; 
  correction_status?: 'none' | 'pending' | 'approved' | 'rejected' | 'pending_addition';
  
  // New Requested Values
  requested_start?: string;     
  requested_end?: string;       
  requested_project_id?: string; 

  // UI helpers
  type?: 'shift' | 'break'; 
  jobId?: string;
  
  // Joined data
  profiles?: { name: string; avatar: string };
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
