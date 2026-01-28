
import { createClient } from '@supabase/supabase-js';

// Hard-coded credentials for stability test
export const SUPABASE_URL = 'https://rlpcwinfbwkhoxayiyyr.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_n3dfgvXCXNGRZ3Y80jNinA_miLWFKpj';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
