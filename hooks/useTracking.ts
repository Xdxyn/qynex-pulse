import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Shift, Job, Task, Subtask } from '../types';

// 5 mph is approximately 2.2352 meters per second
const DRIVING_SPEED_THRESHOLD_MPS = 2.2352;
const CONSECUTIVE_PINGS_FOR_DRIVING = 3;
const GPS_INTERVAL_MS = 60000; // 60 Seconds
const GPS_TIMEOUT_MS = 300000; // 5 Minutes

export const useTracking = (userId: string | undefined) => {
    const [activeShift, setActiveShift] = useState<Shift | null>(null);
    const [gpsStatus, setGpsStatus] = useState<'searching' | 'active' | 'error'>('searching');
    const [gpsSyncStatus, setGpsSyncStatus] = useState<'idle' | 'synced' | 'error'>('idle');
    const [authError, setAuthError] = useState<string | null>(null);
    
    // Refs for state accessible inside intervals/closures
    const activeShiftRef = useRef<Shift | null>(null);
    const consecutiveDrivingPingsRef = useRef(0);
    const locationIntervalRef = useRef<number | null>(null);
    const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);
    const lastSuccessfulPingRef = useRef<number>(Date.now());

    // Keep ref in sync with state
    useEffect(() => {
        activeShiftRef.current = activeShift;
    }, [activeShift]);

    // 1. Initial Load
    useEffect(() => {
        if (!userId) return;
        checkActiveShift();
    }, [userId]);

    const checkActiveShift = async () => {
        try {
            const { data, error } = await supabase
                .from('shifts')
                .select(`
                    *,
                    jobs (
                        name,
                        client_name
                    )
                `)
                .eq('user_id', userId)
                .in('status', ['active', 'driving'])
                .is('clock_out', null)
                .order('clock_in', { ascending: false })
                .limit(1)
                .maybeSingle();
            
            if (data) {
                const mappedShift: Shift = {
                    ...data,
                    total_miles: data.total_miles || 0,
                    job_name: data.jobs?.name,
                    client_name: data.jobs?.client_name,
                    jobId: data.job_id
                };
                setActiveShift(mappedShift);
                // Reset ping timer on restore
                lastSuccessfulPingRef.current = Date.now();
                setGpsStatus('searching');
            }
        } catch (err) {
            console.error("Error restoring shift:", err);
        }
    };

    // 2. Start Shift
    const startShift = async (jobConfig: { job: Job, task: Task, subtask: Subtask }) => {
        setAuthError(null);
        setGpsSyncStatus('idle');

        const { data: { user }, error: sessionError } = await supabase.auth.getUser();

        if (sessionError || !user) {
            const msg = "Authentication Error: Please Log Out and Log In again";
            console.error(msg, sessionError);
            setAuthError(msg);
            return;
        }

        const validUserId = user.id;

        // Reset state
        consecutiveDrivingPingsRef.current = 0;
        lastLocationRef.current = null;
        lastSuccessfulPingRef.current = Date.now();
        setGpsStatus('searching');

        // A. Optimistic Update
        const tempId = 'temp-' + Date.now();
        const nowIso = new Date().toISOString();

        const optimisticShift: Shift = {
            id: tempId,
            user_id: validUserId,
            clock_in: nowIso,
            status: 'active',
            client_name: jobConfig.job.client_name,
            job_name: jobConfig.job.name,
            task_name: jobConfig.task.name,
            subtask_name: jobConfig.subtask.name,
            total_miles: 0.00,
            jobId: jobConfig.job.id,
            taskId: jobConfig.task.id,
            subtaskId: jobConfig.subtask.id
        };
        setActiveShift(optimisticShift);

        // B. Database Insert
        console.log('Starting shift for User ID:', validUserId);

        const insertPayload = {
            user_id: validUserId,
            job_id: jobConfig.job.id,
            clock_in: nowIso,
            status: 'active',
            total_miles: 0.00
        };

        const { data, error } = await supabase
            .from('shifts')
            .insert(insertPayload)
            .select()
            .single();

        if (error) {
            console.error('Supabase Insert Error:', error);
            const errMsg = `Failed to save shift: ${error.message}`;
            setAuthError(errMsg);
            alert(`${errMsg}\n\nThe timer is running locally, but data is NOT saved.`);
        } else if (data) {
            console.log('Shift saved successfully. ID:', data.id);
            setActiveShift(prev => prev ? { ...prev, id: data.id } : null);
        }
    };

    // 3. End Shift
    const endShift = async () => {
        if (!activeShiftRef.current) return;

        const oldShiftId = activeShiftRef.current.id;
        
        setActiveShift(null);
        setGpsStatus('searching');
        setGpsSyncStatus('idle');
        consecutiveDrivingPingsRef.current = 0;
        lastLocationRef.current = null;
        setAuthError(null);
        
        if (locationIntervalRef.current) {
            clearInterval(locationIntervalRef.current);
            locationIntervalRef.current = null;
        }

        if (!oldShiftId.startsWith('temp-')) {
            const { error } = await supabase
                .from('shifts')
                .update({ 
                    clock_out: new Date().toISOString(),
                    status: 'completed'
                })
                .eq('id', oldShiftId);

            if (error) {
                console.error('Error ending shift:', error);
                alert(`Error ending shift: ${error.message}`);
            }
        }
    };

    // 3.5 Auto Clockout
    const handleAutoClockout = async () => {
        if (!activeShiftRef.current) return;

        const oldShiftId = activeShiftRef.current.id;
        console.warn("Auto-clockout triggered: GPS timeout > 5 mins");

        setActiveShift(null);
        setGpsStatus('error');
        setAuthError('Shift ended automatically: GPS signal lost for > 5 minutes.');

        if (locationIntervalRef.current) {
            clearInterval(locationIntervalRef.current);
            locationIntervalRef.current = null;
        }

        if (!oldShiftId.startsWith('temp-')) {
            await supabase
                .from('shifts')
                .update({ 
                    clock_out: new Date().toISOString(),
                    status: 'auto_clockout'
                })
                .eq('id', oldShiftId);
        }
    };

    // 4. Background Service
    useEffect(() => {
        // Only start tracking if we have a real DB ID (not optimistic)
        // We check activeShift?.id here to trigger the effect
        if (activeShift?.id && !activeShift.id.startsWith('temp-')) {
            console.log("Tracking started for Shift ID:", activeShift.id);
            
            // CRITICAL: Pass the current activeShift explicitly to bypass any Ref staleness
            // This ensures the first ping has the correct ID immediately.
            captureLocation(activeShift);
            
            // Start interval
            locationIntervalRef.current = window.setInterval(() => captureLocation(), GPS_INTERVAL_MS);
        } else {
            if (locationIntervalRef.current) {
                clearInterval(locationIntervalRef.current);
                locationIntervalRef.current = null;
            }
        }

        return () => {
            if (locationIntervalRef.current) {
                clearInterval(locationIntervalRef.current);
            }
        };
    }, [activeShift?.id]); // Re-run when ID changes (e.g. temp -> real)

    const captureLocation = (overrideShift?: Shift | null) => {
        // Use override if provided (for immediate call), otherwise ref (for interval)
        const currentShift = overrideShift || activeShiftRef.current;
        if (!currentShift) return;

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude, accuracy, speed } = position.coords;
                
                // 1. Data Validation
                if (typeof latitude !== 'number' || typeof longitude !== 'number') {
                    console.warn("Invalid GPS data (NaN or Null). Retrying in 5s.");
                    setTimeout(() => captureLocation(currentShift), 5000);
                    return;
                }

                setGpsStatus('active');
                lastSuccessfulPingRef.current = Date.now(); // Update ping time

                const currentSpeedMps = speed || 0;
                let milesToAdd = 0;
                
                if (!currentShift.id.startsWith('temp-')) {
                     // Mileage Logic
                     if (lastLocationRef.current && currentSpeedMps >= DRIVING_SPEED_THRESHOLD_MPS) {
                        const distMiles = getDistanceFromLatLonInMiles(
                            lastLocationRef.current.lat, 
                            lastLocationRef.current.lng, 
                            latitude, 
                            longitude
                        );
                        // Sanity check: discard unrealistic jumps (> 5 miles in 60s)
                        if (distMiles < 5) milesToAdd = distMiles;
                    }
                    lastLocationRef.current = { lat: latitude, lng: longitude };

                    // 2. Breadcrumb Insert - STRICT COLUMN MATCH
                    // shift_id, lat, lng, accuracy, speed (No timestamp)
                    const { error } = await supabase.from('breadcrumbs').insert({
                        shift_id: currentShift.id,
                        lat: latitude,
                        lng: longitude,
                        accuracy: accuracy,
                        speed: currentSpeedMps
                    });
                    
                    // 3. Retry Logic & Success Signal
                    if (error) {
                        console.error("Breadcrumb Sync Failed:", error);
                        // Silent retry in background
                        console.log("Silently retrying in 30 seconds...");
                        setTimeout(() => captureLocation(currentShift), 30000);
                    } else {
                        console.log(`Breadcrumb sent: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
                        setGpsSyncStatus('synced');
                    }
                    
                    // 4. Update Totals
                    if (milesToAdd > 0) {
                        const newTotal = (currentShift.total_miles || 0) + milesToAdd;
                        await supabase.from('shifts')
                            .update({ total_miles: newTotal })
                            .eq('id', currentShift.id);
                        
                        // Update state and ref
                        setActiveShift(prev => prev ? { ...prev, total_miles: newTotal } : null);
                    }

                    // 5. Driving Status Logic
                    if (currentSpeedMps >= DRIVING_SPEED_THRESHOLD_MPS) {
                        consecutiveDrivingPingsRef.current += 1;
                        if (consecutiveDrivingPingsRef.current >= CONSECUTIVE_PINGS_FOR_DRIVING) {
                            if (currentShift.status !== 'driving') {
                                updateShiftStatus(currentShift.id, 'driving');
                                setActiveShift(prev => prev ? { ...prev, status: 'driving' } : null);
                            }
                        }
                    } else {
                        consecutiveDrivingPingsRef.current = 0;
                        if (currentShift.status === 'driving') {
                            updateShiftStatus(currentShift.id, 'active');
                            setActiveShift(prev => prev ? { ...prev, status: 'active' } : null);
                        }
                    }
                }
            },
            (error) => {
                console.warn('GPS Signal Error:', error.message);
                setGpsStatus('error');
                
                // Check for safety timeout
                const timeSinceLastPing = Date.now() - lastSuccessfulPingRef.current;
                if (timeSinceLastPing > GPS_TIMEOUT_MS) {
                    handleAutoClockout();
                }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const updateShiftStatus = async (shiftId: string, status: 'active' | 'driving') => {
        if (shiftId.startsWith('temp-')) return;
        await supabase.from('shifts').update({ status }).eq('id', shiftId);
    };

    return { activeShift, startShift, endShift, gpsStatus, gpsSyncStatus, authError };
};

// --- Helper: Haversine Formula ---
function getDistanceFromLatLonInMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8; // Radius of the earth in miles
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in miles
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
}