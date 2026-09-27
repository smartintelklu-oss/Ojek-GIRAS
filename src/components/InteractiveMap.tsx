import React, { useMemo, useState } from 'react';
import { LocationPoint, DriverLocation, TripLifecycleStep } from '../types';
import { Navigation, MapPin, Flag, Compass, ZoomIn, ZoomOut, Car } from 'lucide-react';

interface InteractiveMapProps {
  origin?: LocationPoint;
  destination?: LocationPoint;
  driverLocation?: DriverLocation;
  tripStep?: TripLifecycleStep;
  interactive?: boolean;
  onSelectLocation?: (type: 'origin' | 'destination', point: LocationPoint) => void;
  className?: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  origin,
  destination,
  driverLocation,
  tripStep,
  interactive = true,
  className = ''
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isCenteredOnDriver, setIsCenteredOnDriver] = useState<boolean>(false);

  // Center coordinate calculation
  const { centerLat, centerLng, mapPoints } = useMemo(() => {
    const points: { lat: number; lng: number }[] = [];
    if (origin) points.push({ lat: origin.lat, lng: origin.lng });
    if (destination) points.push({ lat: destination.lat, lng: destination.lng });
    if (driverLocation) points.push({ lat: driverLocation.lat, lng: driverLocation.lng });

    if (points.length === 0) {
      return { centerLat: -6.1950, centerLng: 106.8208, mapPoints: [] }; // Central Jakarta
    }

    const sumLat = points.reduce((acc, p) => acc + p.lat, 0);
    const sumLng = points.reduce((acc, p) => acc + p.lng, 0);

    return {
      centerLat: sumLat / points.length,
      centerLng: sumLng / points.length,
      mapPoints: points
    };
  }, [origin, destination, driverLocation]);

  // Convert lat/lng to SVG percentage
  const minLat = -6.255;
  const maxLat = -6.165;
  const minLng = 106.785;
  const maxLng = 106.865;

  const projectToPercent = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return {
      x: Math.min(95, Math.max(5, x)),
      y: Math.min(95, Math.max(5, y))
    };
  };

  const originPos = origin ? projectToPercent(origin.lat, origin.lng) : null;
  const destPos = destination ? projectToPercent(destination.lat, destination.lng) : null;
  const driverPos = driverLocation ? projectToPercent(driverLocation.lat, driverLocation.lng) : null;

  return (
    <div className={`relative w-full h-full overflow-hidden bg-slate-100 border border-slate-200 select-none ${className}`}>
      {/* SVG Map Canvas (Bright Light Google Maps Archetype) */}
      <svg
        className="w-full h-full"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="light-city-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.8" opacity="0.8" />
            <circle cx="20" cy="20" r="1.2" fill="#cbd5e1" opacity="0.5" />
          </pattern>
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <filter id="routeShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#047857" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Background Light Grid */}
        <rect width="100%" height="100%" fill="#f8fafc" />
        <rect width="100%" height="100%" fill="url(#light-city-grid)" />

        {/* Stylized Main Roads / Arterials in Jakarta */}
        <g strokeLinecap="round">
          {/* Minor streets */}
          <path d="M 50 40 L 350 40" stroke="#e2e8f0" strokeWidth="3" fill="none" />
          <path d="M 40 180 L 360 180" stroke="#e2e8f0" strokeWidth="3" fill="none" />
          <path d="M 40 330 L 360 330" stroke="#e2e8f0" strokeWidth="3" fill="none" />
          <path d="M 80 20 L 80 380" stroke="#e2e8f0" strokeWidth="3" fill="none" />
          <path d="M 320 20 L 320 380" stroke="#e2e8f0" strokeWidth="3" fill="none" />

          {/* Thamrin - Sudirman Boulevard (Vertical spine) */}
          <path d="M 195 20 Q 200 180 180 380" stroke="#cbd5e1" strokeWidth="12" fill="none" />
          <path d="M 195 20 Q 200 180 180 380" stroke="#ffffff" strokeWidth="8" fill="none" />
          <path d="M 195 20 Q 200 180 180 380" stroke="#f59e0b" strokeWidth="1.5" fill="none" strokeDasharray="6,6" />

          {/* Gatot Subroto / Tol Dalam Kota (Horizontal ring) */}
          <path d="M 10 270 C 120 280, 260 260, 390 285" stroke="#cbd5e1" strokeWidth="10" fill="none" />
          <path d="M 10 270 C 120 280, 260 260, 390 285" stroke="#ffffff" strokeWidth="6" fill="none" />

          {/* Merdeka / Gambir ring */}
          <path d="M 150 70 L 260 65 L 255 130 L 155 125 Z" stroke="#cbd5e1" strokeWidth="4" fill="#ffffff" />
          
          {/* Monas Green Park */}
          <circle cx="205" cy="95" r="26" fill="#dcfce7" stroke="#86efac" strokeWidth="2" />
          <circle cx="205" cy="95" r="4" fill="#15803d" />

          {/* Rasuna Said / Kuningan artery */}
          <path d="M 230 190 L 250 370" stroke="#cbd5e1" strokeWidth="8" fill="none" />
          <path d="M 230 190 L 250 370" stroke="#ffffff" strokeWidth="5" fill="none" />

          {/* Slipi / Palmerah artery */}
          <path d="M 100 110 L 90 310" stroke="#cbd5e1" strokeWidth="7" fill="none" />
          <path d="M 100 110 L 90 310" stroke="#ffffff" strokeWidth="4" fill="none" />
        </g>

        {/* Route Line if Origin and Destination Exist */}
        {originPos && destPos && (
          <g filter="url(#routeShadow)">
            {/* Outer Route Border */}
            <path
              d={`M ${(originPos.x * 4).toFixed(1)} ${(originPos.y * 4).toFixed(1)} 
                  Q ${(originPos.x * 2 + destPos.x * 2 + 15).toFixed(1)} ${(originPos.y * 2 + destPos.y * 2 - 15).toFixed(1)} 
                  ${(destPos.x * 4).toFixed(1)} ${(destPos.y * 4).toFixed(1)}`}
              fill="none"
              stroke="#047857"
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.25"
            />
            {/* Core Animated Polyline */}
            <path
              d={`M ${(originPos.x * 4).toFixed(1)} ${(originPos.y * 4).toFixed(1)} 
                  Q ${(originPos.x * 2 + destPos.x * 2 + 15).toFixed(1)} ${(originPos.y * 2 + destPos.y * 2 - 15).toFixed(1)} 
                  ${(destPos.x * 4).toFixed(1)} ${(destPos.y * 4).toFixed(1)}`}
              fill="none"
              stroke="url(#routeGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="8,5"
              className="animate-pulse"
            />
          </g>
        )}

        {/* Origin Marker */}
        {originPos && (
          <g transform={`translate(${originPos.x * 4}, ${originPos.y * 4})`}>
            <circle r="16" fill="#10b981" opacity="0.25" className="animate-ping" />
            <circle r="10" fill="#10b981" stroke="#ffffff" strokeWidth="3" />
            <circle r="4" fill="#ffffff" />
            {/* Label badge */}
            <g transform="translate(14, -12)">
              <rect width="68" height="20" rx="6" fill="#ffffff" stroke="#10b981" strokeWidth="1.5" />
              <text x="34" y="14" fill="#047857" fontSize="10" fontWeight="800" textAnchor="middle">
                Jemput
              </text>
            </g>
          </g>
        )}

        {/* Destination Marker */}
        {destPos && (
          <g transform={`translate(${destPos.x * 4}, ${destPos.y * 4})`}>
            <circle r="14" fill="#ef4444" opacity="0.25" className="animate-ping" />
            <circle r="10" fill="#ef4444" stroke="#ffffff" strokeWidth="3" />
            <circle r="4" fill="#ffffff" />
            {/* Label badge */}
            <g transform="translate(14, -12)">
              <rect width="68" height="20" rx="6" fill="#ffffff" stroke="#ef4444" strokeWidth="1.5" />
              <text x="34" y="14" fill="#b91c1c" fontSize="10" fontWeight="800" textAnchor="middle">
                Tujuan
              </text>
            </g>
          </g>
        )}

        {/* Driver Location Marker (Motorcycle Icon with Heading Rotation) */}
        {driverPos && (
          <g
            transform={`translate(${driverPos.x * 4}, ${driverPos.y * 4})`}
            className="transition-transform duration-1000 ease-linear"
          >
            {/* Active Radar Aura */}
            <circle r="22" fill="#3b82f6" opacity="0.2" className="animate-pulse" />
            <circle r="12" fill="#2563eb" stroke="#ffffff" strokeWidth="3" />

            {/* Directional heading needle */}
            <g transform={`rotate(${driverLocation?.heading || 0})`}>
              <polygon points="0,-16 4,-9 -4,-9" fill="#1d4ed8" />
            </g>

            {/* Bike icon center */}
            <circle r="4" fill="#ffffff" />

            {/* Driver Plate & ETA Pin Overlay */}
            <g transform="translate(0, -22)">
              <rect x="-35" y="-14" width="70" height="18" rx="6" fill="#ffffff" stroke="#2563eb" strokeWidth="1.5" />
              <text x="0" y="-1" fill="#1d4ed8" fontSize="9" fontWeight="800" textAnchor="middle">
                B 4920 SAK
              </text>
            </g>
          </g>
        )}
      </svg>

      {/* Map Floating Badges & Legend */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 border border-slate-200 backdrop-blur-md shadow-sm text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold text-slate-800">Google Maps Platform</span>
          <span className="text-[10px] text-slate-500 font-mono font-medium">(Simulasi Live)</span>
        </div>
        {tripStep && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-800 font-bold shadow-xs">
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {tripStep === 'HEADING_TO_PICKUP' && 'Driver menuju titik jemput'}
              {tripStep === 'ARRIVED_AT_PICKUP' && 'Driver tiba di lokasi penjemputan'}
              {tripStep === 'ON_THE_WAY' && 'Dalam perjalanan ke tujuan'}
              {tripStep === 'ARRIVED_AT_DESTINATION' && 'Tiba di tujuan akhir'}
              {tripStep === 'COMPLETED' && 'Perjalanan selesai'}
            </span>
          </div>
        )}
      </div>

      {/* Map Interactive Controls */}
      {interactive && (
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-10">
          <button
            onClick={() => setZoomLevel((z) => Math.min(2, z + 0.2))}
            title="Perbesar Peta"
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
            title="Perkecil Peta"
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
