'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ── Venue data ────────────────────────────────────────────────────────────────
export const VENUE_CENTER = { lat: 12.9792, lng: 77.5996 };

export interface MapZone {
  id: string;
  name: string;
  density: number;
  position: { lat: number; lng: number };
}

export const VENUE_ZONES: MapZone[] = [
  { id: 'z1', name: 'North Stand',      density: 78, position: { lat: 12.9802, lng: 77.5996 } },
  { id: 'z2', name: 'East Stand (B)',   density: 91, position: { lat: 12.9792, lng: 77.6008 } },
  { id: 'z3', name: 'South Stand',      density: 42, position: { lat: 12.9782, lng: 77.5996 } },
  { id: 'z4', name: 'West Stand (A)',   density: 55, position: { lat: 12.9792, lng: 77.5984 } },
  { id: 'z5', name: 'Club House',       density: 85, position: { lat: 12.9798, lng: 77.5988 } },
  { id: 'z6', name: 'Corporate Box',    density: 30, position: { lat: 12.9786, lng: 77.6002 } },
  { id: 'z7', name: 'Main Entrance',    density: 66, position: { lat: 12.9778, lng: 77.5996 } },
  { id: 'z8', name: 'KSCA Gate',        density: 20, position: { lat: 12.9800, lng: 77.5984 } },
];

export const LOCATION_COORDS: Record<string, google.maps.LatLngLiteral> = {
  'Main Entrance':           { lat: 12.9778, lng: 77.5996 },
  'North Stand':             { lat: 12.9802, lng: 77.5996 },
  'South Stand':             { lat: 12.9782, lng: 77.5996 },
  'East Stand (B)':          { lat: 12.9792, lng: 77.6008 },
  'West Stand (A)':          { lat: 12.9792, lng: 77.5984 },
  'Club House':              { lat: 12.9798, lng: 77.5988 },
  'Corporate Box':           { lat: 12.9786, lng: 77.6002 },
  'Pavilion Food Court':     { lat: 12.9795, lng: 77.5992 },
  'Corporate Lounge Bar':    { lat: 12.9789, lng: 77.6000 },
  'KSCA Refreshment Zone':   { lat: 12.9796, lng: 77.5998 },
  'North Block Restrooms':   { lat: 12.9800, lng: 77.5994 },
  'South Block Restrooms':   { lat: 12.9784, lng: 77.5998 },
  'Gate 5 (MG Road)':        { lat: 12.9775, lng: 77.6005 },
  'First Aid Bay':           { lat: 12.9793, lng: 77.5990 },
  'My Location (GPS)':       { lat: 12.9792, lng: 77.5996 },
};

function densityColor(d: number) {
  if (d >= 80) return '#EF4444';
  if (d >= 50) return '#F59E0B';
  return '#22C55E';
}

// ── Dark map styles ───────────────────────────────────────────────────────────
const DARK_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry',                                        stylers: [{ color: '#0a0f1c' }] },
  { elementType: 'labels.text.fill',                                stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke',                              stylers: [{ color: '#0a0f1c' }] },
  { featureType: 'road',           elementType: 'geometry',         stylers: [{ color: '#161d35' }] },
  { featureType: 'road',           elementType: 'geometry.stroke',  stylers: [{ color: '#0f1629' }] },
  { featureType: 'road',           elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
  { featureType: 'road.highway',   elementType: 'geometry',         stylers: [{ color: '#1e2a45' }] },
  { featureType: 'water',          elementType: 'geometry',         stylers: [{ color: '#0a1628' }] },
  { featureType: 'water',          elementType: 'labels.text.fill', stylers: [{ color: '#38bdf8' }] },
  { featureType: 'poi',            elementType: 'geometry',         stylers: [{ color: '#0f1629' }] },
  { featureType: 'poi.park',       elementType: 'geometry',         stylers: [{ color: '#0d1f2d' }] },
  { featureType: 'transit',        elementType: 'geometry',         stylers: [{ color: '#161d35' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke',  stylers: [{ color: '#1e2a45' }] },
  { featureType: 'landscape',      elementType: 'geometry',         stylers: [{ color: '#0d1525' }] },
];

// ── Script loader — loads Maps JS API once globally ───────────────────────────
type LoadState = 'idle' | 'loading' | 'ready' | 'error';
let globalLoadState: LoadState = 'idle';
const listeners: Array<(state: LoadState) => void> = [];

function loadMapsScript(apiKey: string): void {
  if (globalLoadState !== 'idle') return;
  globalLoadState = 'loading';

  // Callback name that Google Maps will call when ready
  (window as unknown as Record<string, unknown>)['__vfMapsReady'] = () => {
    globalLoadState = 'ready';
    listeners.forEach(fn => fn('ready'));
    listeners.length = 0;
  };

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=__vfMapsReady&loading=async`;
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    globalLoadState = 'error';
    listeners.forEach(fn => fn('error'));
    listeners.length = 0;
  };
  document.head.appendChild(script);
}

function useMapsReady(): LoadState {
  const apiKey = process.env['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'] ?? '';
  const [state, setState] = useState<LoadState>(() => globalLoadState);

  useEffect(() => {
    if (!apiKey) { setState('error'); return; }
    if (globalLoadState === 'ready') { setState('ready'); return; }
    if (globalLoadState === 'error') { setState('error'); return; }

    const onChange = (s: LoadState) => setState(s);
    listeners.push(onChange);

    if (globalLoadState === 'idle') loadMapsScript(apiKey);

    return () => {
      const idx = listeners.indexOf(onChange);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, [apiKey]);

  return state;
}

// ── Marker HTML builder ───────────────────────────────────────────────────────
function buildMarkerContent(zone: MapZone): HTMLElement {
  const color = densityColor(zone.density);
  const isHigh = zone.density >= 80;

  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:pointer;';

  const circle = document.createElement('div');
  circle.style.cssText = `
    position:relative;
    background:${color};
    border:2.5px solid rgba(255,255,255,0.95);
    border-radius:50%;
    width:38px;height:38px;
    display:flex;align-items:center;justify-content:center;
    font-size:11px;font-weight:800;color:#fff;
    font-family:Inter,sans-serif;
    box-shadow:0 2px 12px ${color}99,0 0 0 3px ${color}22;
  `;
  circle.textContent = `${zone.density}%`;

  if (isHigh) {
    const ring = document.createElement('span');
    ring.style.cssText = `
      position:absolute;inset:-5px;border-radius:50%;
      border:2px solid ${color};
      animation:vfPulse 1.8s cubic-bezier(0.4,0,0.6,1) infinite;
      pointer-events:none;
    `;
    circle.appendChild(ring);
  }

  const label = document.createElement('div');
  label.style.cssText = `
    background:rgba(10,15,28,0.9);
    border:1px solid ${color}55;
    border-radius:6px;padding:2px 7px;margin-top:4px;
    font-size:9px;font-weight:600;color:#F1F5F9;
    font-family:Inter,sans-serif;white-space:nowrap;
    box-shadow:0 2px 8px rgba(0,0,0,0.4);
  `;
  label.textContent = zone.name;

  wrap.appendChild(circle);
  wrap.appendChild(label);
  return wrap;
}

// ── Inject pulse keyframe once ────────────────────────────────────────────────
function injectPulseStyle() {
  if (document.getElementById('vf-pulse-style')) return;
  const s = document.createElement('style');
  s.id = 'vf-pulse-style';
  s.textContent = `@keyframes vfPulse{0%{transform:scale(1);opacity:.8}100%{transform:scale(2.2);opacity:0}}`;
  document.head.appendChild(s);
}

// ── Main component ────────────────────────────────────────────────────────────
interface VenueMapProps {
  zones?: MapZone[];
  routeFrom?: string;
  routeTo?: string;
  onDuration?: (d: string) => void;
  onZoneClick?: (zone: MapZone) => void;
  height?: string;
  zoom?: number;
}

export function VenueMap({
  zones = VENUE_ZONES,
  routeFrom,
  routeTo,
  onDuration,
  onZoneClick,
  height = '100%',
  zoom = 16,
}: VenueMapProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<google.maps.Map | null>(null);
  const markersRef    = useRef<google.maps.Marker[]>([]);
  const rendererRef   = useRef<google.maps.DirectionsRenderer | null>(null);
  const mapsReady     = useMapsReady();

  // Init map once Maps API is ready
  useEffect(() => {
    if (mapsReady !== 'ready' || !containerRef.current || mapRef.current) return;
    injectPulseStyle();

    mapRef.current = new google.maps.Map(containerRef.current, {
      center: VENUE_CENTER,
      zoom,
      styles: DARK_STYLES,
      disableDefaultUI: true,
      gestureHandling: 'greedy',
      clickableIcons: false,
    });
  }, [mapsReady, zoom]);

  // Update markers when zones change
  useEffect(() => {
    if (!mapRef.current || mapsReady !== 'ready') return;

    // Clear old markers
    markersRef.current.forEach(m => { (m as google.maps.Marker).setMap(null); });
    markersRef.current = [];

    zones.forEach(zone => {
      const color = densityColor(zone.density);

      const marker = new google.maps.Marker({
        map: mapRef.current!,
        position: zone.position,
        title: `${zone.name}: ${zone.density}%`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 18,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2.5,
        },
        label: {
          text: `${zone.density}%`,
          color: '#ffffff',
          fontSize: '10px',
          fontWeight: '800',
          fontFamily: 'Inter, sans-serif',
        },
      });

      marker.addListener('click', () => onZoneClick?.(zone));
      (markersRef.current as google.maps.Marker[]).push(marker);
    });
  }, [zones, mapsReady, onZoneClick]);

  // Draw route when from/to change
  useEffect(() => {
    if (!mapRef.current || mapsReady !== 'ready') return;

    // Clear existing route
    if (rendererRef.current) {
      rendererRef.current.setMap(null);
      rendererRef.current = null;
    }

    if (!routeFrom || !routeTo) return;
    const originCoords = LOCATION_COORDS[routeFrom];
    const destCoords   = LOCATION_COORDS[routeTo];
    if (!originCoords || !destCoords) return;

    const renderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: { strokeColor: '#6366F1', strokeWeight: 5, strokeOpacity: 0.9 },
    });
    renderer.setMap(mapRef.current);
    rendererRef.current = renderer;

    const service = new google.maps.DirectionsService();
    service.route(
      { origin: originCoords, destination: destCoords, travelMode: google.maps.TravelMode.WALKING },
      (result, status) => {
        if (status === 'OK' && result) {
          renderer.setDirections(result);
          const leg = result.routes[0]?.legs[0];
          if (leg?.duration?.text) onDuration?.(leg.duration.text);
        }
      },
    );
  }, [routeFrom, routeTo, mapsReady, onDuration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(m => m.setMap(null));
      rendererRef.current?.setMap(null);
    };
  }, []);

  if (mapsReady === 'error') {
    return (
      <div style={{
        width: '100%', height, borderRadius: '20px',
        background: '#0F1629', border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '8px',
      }}>
        <span style={{ fontSize: '28px' }}>🗺️</span>
        <p style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 600 }}>Map unavailable</p>
        <p style={{ color: '#475569', fontSize: '11px', textAlign: 'center', padding: '0 16px' }}>
          Check your Google Maps API key
        </p>
      </div>
    );
  }

  if (mapsReady !== 'ready') {
    return (
      <div style={{
        width: '100%', height, borderRadius: '20px',
        background: '#0F1629', border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: '24px', height: '24px', borderRadius: '50%',
          border: '2px solid rgba(99,102,241,0.3)',
          borderTopColor: '#6366F1',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height, borderRadius: '20px', overflow: 'hidden' }}
    />
  );
}
