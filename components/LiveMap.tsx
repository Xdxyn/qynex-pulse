
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { RefreshCw, Map as MapIcon, Loader2 } from 'lucide-react';
import { Profile } from '../types';

declare const L: any;

interface MapUser {
    shiftId: string;
    profile: Profile;
    jobName: string;
    clientName: string;
    breadcrumbs: { lat: number; lng: number; timestamp: string }[];
    lastSeen: string;
}

export const LiveMap: React.FC = () => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const layerGroupRef = useRef<any>(null);
    
    const [mapData, setMapData] = useState<MapUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchLiveData = async () => {
        setLoading(true);
        try {
            const { data: shifts, error } = await supabase
                .from('shifts')
                .select(`
                    id, user_id, job_name, client_name, created_at,
                    profiles:user_id (id, name, avatar, role)
                `)
                .in('status', ['active', 'driving'])
                .is('clock_out', null);

            if (error) throw error;

            if (!shifts || shifts.length === 0) {
                setMapData([]);
                setLoading(false);
                return;
            }

            const activeUsers: MapUser[] = [];
            for (const shift of shifts) {
                const { data: crumbs } = await supabase
                    .from('breadcrumbs')
                    .select('lat, lng, timestamp')
                    .eq('shift_id', shift.id)
                    .order('timestamp', { ascending: false })
                    .limit(5);

                if (crumbs && crumbs.length > 0) {
                    const profileData = Array.isArray(shift.profiles) ? shift.profiles[0] : shift.profiles;
                    activeUsers.push({
                        shiftId: shift.id,
                        profile: profileData as Profile,
                        jobName: shift.job_name || 'Active Task',
                        clientName: shift.client_name || 'Client',
                        breadcrumbs: crumbs,
                        lastSeen: crumbs[0].timestamp
                    });
                }
            }
            setMapData(activeUsers);
            setLastUpdated(new Date());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;
        const map = L.map(mapContainerRef.current).setView([39.8283, -98.5795], 4);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);
        layerGroupRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
        fetchLiveData();
    }, []);

    useEffect(() => {
        if (!mapInstanceRef.current || !layerGroupRef.current) return;
        const layerGroup = layerGroupRef.current;
        layerGroup.clearLayers();
        const bounds = L.latLngBounds([]);
        let hasPoints = false;

        mapData.forEach(user => {
            if (user.breadcrumbs.length === 0) return;
            const latest = user.breadcrumbs[0];
            const latLng = [latest.lat, latest.lng];
            hasPoints = true;
            bounds.extend(latLng);

            const avatarUrl = user.profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.profile?.name || 'User')}&background=0D8ABC&color=fff`;
            const iconHtml = `
                <div class="relative w-12 h-12 flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
                    <div class="absolute inset-0 bg-teal-500 rounded-full animate-ping opacity-30"></div>
                    <div class="relative w-10 h-10 rounded-full border-2 border-teal-400 bg-slate-900 overflow-hidden shadow-xl z-10">
                        <img src="${avatarUrl}" class="w-full h-full object-cover" />
                    </div>
                </div>`;
            const icon = L.divIcon({ html: iconHtml, iconSize: [48, 48], iconAnchor: [24, 24] });
            L.marker(latLng, { icon }).addTo(layerGroup).bindPopup(`<div class="text-slate-800 p-2"><b>${user.profile?.name}</b><br/>${user.jobName}</div>`);
        });

        if (hasPoints && mapInstanceRef.current) mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }, [mapData]);

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3"><MapIcon className="text-teal-500" />Live Operations</h2>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500 font-mono">Synced: {lastUpdated.toLocaleTimeString()}</span>
                    <button onClick={fetchLiveData} disabled={loading} className="text-teal-400 disabled:opacity-50"><RefreshCw size={18} className={loading ? 'animate-spin' : ''}/></button>
                </div>
            </div>
            <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden relative">
                 <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0 bg-slate-950"></div>
            </div>
        </div>
    );
};
