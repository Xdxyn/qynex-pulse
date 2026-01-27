import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { RefreshCw, Map as MapIcon, Loader2 } from 'lucide-react';
import { Profile } from '../types';

// Access the global Leaflet variable added via CDN
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
            // 1. Get Active Shifts
            const { data: shifts, error } = await supabase
                .from('shifts')
                .select(`
                    id, 
                    user_id, 
                    job_name, 
                    client_name, 
                    created_at,
                    profiles:user_id (id, name, avatar, role)
                `)
                .in('status', ['active', 'driving'])
                .is('clock_out', null);

            if (error) {
                console.error("Error fetching shifts:", error);
                return;
            }

            if (!shifts || shifts.length === 0) {
                setMapData([]);
                setLoading(false);
                return;
            }

            // 2. Get Breadcrumbs for these shifts
            const activeUsers: MapUser[] = [];

            for (const shift of shifts) {
                // Fetch last 5 breadcrumbs for trace path
                const { data: crumbs } = await supabase
                    .from('breadcrumbs')
                    .select('lat, lng, timestamp')
                    .eq('shift_id', shift.id)
                    .order('timestamp', { ascending: false })
                    .limit(5);

                if (crumbs && crumbs.length > 0) {
                    // Supabase returns an object for single relation or array, sanitize it
                    const profileData = Array.isArray(shift.profiles) ? shift.profiles[0] : shift.profiles;
                    
                    activeUsers.push({
                        shiftId: shift.id,
                        profile: profileData as Profile,
                        jobName: shift.job_name || 'Unknown Job',
                        clientName: shift.client_name || 'Unknown Client',
                        breadcrumbs: crumbs, // [0] is latest
                        lastSeen: crumbs[0].timestamp
                    });
                }
            }
            setMapData(activeUsers);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Error fetching map data:", err);
        } finally {
            setLoading(false);
        }
    };

    // Initialize Leaflet Map
    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapInstanceRef.current) return; // Prevent double init

        const map = L.map(mapContainerRef.current).setView([39.8283, -98.5795], 4); // Default US View
        
        // CartoDB Dark Matter Tiles (Fits the UI theme)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        const layerGroup = L.layerGroup().addTo(map);
        layerGroupRef.current = layerGroup;
        mapInstanceRef.current = map;

        // Initial Fetch
        fetchLiveData();
    }, []);

    // Update Map Markers & Lines
    useEffect(() => {
        if (!mapInstanceRef.current || !layerGroupRef.current) return;
        
        const layerGroup = layerGroupRef.current;
        layerGroup.clearLayers(); // Clear old positions

        const bounds = L.latLngBounds([]);
        let hasPoints = false;

        mapData.forEach(user => {
            if (user.breadcrumbs.length === 0) return;

            const latest = user.breadcrumbs[0];
            const latLng = [latest.lat, latest.lng];
            hasPoints = true;
            bounds.extend(latLng);

            // -- 1. Custom Avatar Marker --
            // Shows avatar inside a map pin with a pulsing ring
            const avatarUrl = user.profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.profile?.name || 'User')}&background=0D8ABC&color=fff`;
            
            const iconHtml = `
                <div class="relative w-12 h-12 flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
                    <div class="absolute inset-0 bg-teal-500 rounded-full animate-ping opacity-50"></div>
                    <div class="relative w-10 h-10 rounded-full border-2 border-teal-400 bg-slate-900 overflow-hidden shadow-2xl z-10">
                        <img src="${avatarUrl}" class="w-full h-full object-cover" />
                    </div>
                    <div class="absolute -bottom-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-teal-400"></div>
                </div>
            `;

            const icon = L.divIcon({
                className: 'custom-map-icon', // no default styles
                html: iconHtml,
                iconSize: [48, 48],
                iconAnchor: [24, 48], // Tip of the pin
                popupAnchor: [0, -48]
            });

            const marker = L.marker(latLng, { icon }).addTo(layerGroup);
            
            // -- 2. Info Popup --
            const timeString = new Date(user.lastSeen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const popupContent = `
                <div class="p-1 min-w-[200px] text-slate-800 font-sans">
                    <div class="flex items-center gap-2 mb-2">
                         <div class="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                            <img src="${avatarUrl}" class="w-full h-full object-cover"/>
                         </div>
                         <div>
                            <h3 class="font-bold text-sm leading-tight">${user.profile?.name}</h3>
                            <p class="text-[10px] text-slate-500 uppercase font-bold">${user.profile?.role}</p>
                         </div>
                    </div>
                    <div class="bg-slate-100 p-2 rounded border border-slate-200 mb-2">
                        <div class="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Current Project</div>
                        <div class="text-xs font-bold text-slate-700">${user.jobName}</div>
                        <div class="text-[10px] text-slate-500">${user.clientName}</div>
                    </div>
                    <div class="flex justify-between items-center text-[10px] text-slate-500">
                        <span>Last Ping:</span>
                        <span class="font-mono font-bold">${timeString}</span>
                    </div>
                </div>
            `;
            marker.bindPopup(popupContent);

            // -- 3. Breadcrumb Trail (Polyline) --
            // Breadcrumbs come Newest -> Oldest. Reverse for path drawing (Oldest -> Newest).
            const pathLatLngs = [...user.breadcrumbs].reverse().map(b => [b.lat, b.lng]);
            
            if (pathLatLngs.length > 1) {
                L.polyline(pathLatLngs, {
                    color: '#14b8a6', // teal-500
                    weight: 3,
                    opacity: 0.8,
                    dashArray: '4, 8', // Dashed line to indicate trail
                    lineCap: 'round'
                }).addTo(layerGroup);
            }
        });

        // Fit bounds to show all active users, with some padding
        if (hasPoints && mapInstanceRef.current) {
            mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }

    }, [mapData]);

    // Auto Refresh every 60s
    useEffect(() => {
        const interval = setInterval(fetchLiveData, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <MapIcon className="text-teal-500" />
                    Live Operations Map
                </h2>
                <div className="flex items-center gap-4">
                    <div className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
                        {mapData.length} Active Crews
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                        Updated: {lastUpdated.toLocaleTimeString()}
                    </div>
                    <button 
                        onClick={fetchLiveData}
                        disabled={loading}
                        className="flex items-center space-x-2 text-sm text-teal-400 hover:text-teal-300 transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden shadow-inner group/map">
                 <div ref={mapContainerRef} id="map" className="absolute inset-0 w-full h-full z-0 bg-slate-950"></div>
                 
                 {/* Overlay if no users */}
                 {!loading && mapData.length === 0 && (
                     <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-slate-950/50 backdrop-blur-sm z-[1000]">
                         <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 text-center shadow-2xl">
                             <MapIcon size={48} className="text-slate-600 mx-auto mb-4"/>
                             <h3 className="text-white font-bold text-lg">No Active Shifts</h3>
                             <p className="text-slate-400 text-sm">Waiting for staff to clock in...</p>
                         </div>
                     </div>
                 )}
            </div>
        </div>
    );
};