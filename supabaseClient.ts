import { createClient } from '@supabase/supabase-js';

// Using the provided credentials directly to ensure functionality in this environment
// In a standard Vite setup, you would use import.meta.env.VITE_SUPABASE_URL
const SUPABASE_URL = 'https://rlpcwinfbwkhoxayiyyr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_n3dfgvXCXNGRZ3Y80jNinA_miLWFKpj';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);