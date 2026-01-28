
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Shift } from '../types';

export const useTracking = (userId: string | undefined) => {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);

  const refreshShift = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await supabase
        .from('shifts')
        .select('*, jobs(name, client_name)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (data) {
         // Flatten joined data for easier UI consumption
         const shift: Shift = {
             ...data,
             job_name: data.jobs?.name || data.job_name,
             client_name: data.jobs?.client_name || data.client_name
         };
         setActiveShift(shift);
      } else {
        setActiveShift(null);
      }
    } catch (e) {
      console.error("Error refreshing shift:", e);
    }
  }, [userId]);

  useEffect(() => {
    refreshShift();
  }, [refreshShift]);

  return { activeShift, refreshShift };
};
