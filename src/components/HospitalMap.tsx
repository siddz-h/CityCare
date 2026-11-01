import React, { useEffect, useRef, useState } from 'react';
import { Hospital } from '../types';

interface HospitalMapProps {
  hospitals: Hospital[];
  selectedHospital?: Hospital | null;
  onSelectHospital?: (hospital: Hospital) => void;
  center?: [number, number];
  zoom?: number;
}

export const HospitalMap: React.FC<HospitalMapProps> = ({
  hospitals,
  selectedHospital,
  onSelectHospital,
  center = [19.076, 72.8777],
  zoom = 12,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const onSelectHospitalRef = useRef(onSelectHospital);
  const lastFittedKeyRef = useRef<string>('');
  const [scrollZoomEnabled, setScrollZoomEnabled] = useState(false);

  useEffect(() => {
    onSelectHospitalRef.current = onSelectHospital;
  }, [onSelectHospital]);

  const hospitalsKey = hospitals
    .map((h) => `${h.id}:${h.lat ?? ''}:${h.lng ?? ''}`)
    .join('|');
  const centerLat = center[0];
  const centerLng = center[1];

  // Toggle Leaflet scrollWheelZoom when scrollZoomEnabled state changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (scrollZoomEnabled) {
      map.scrollWheelZoom.enable();
    } else {
      map.scrollWheelZoom.disable();
    }
  }, [scrollZoomEnabled]);

  // 1. Initialize Leaflet map once with scrollWheelZoom disabled by default
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    let isMounted = true;
    const containerEl = mapContainerRef.current;

    const setupMap = async () => {
      const L = await import('leaflet');
      if (!isMounted || !mapContainerRef.current) return;
      leafletRef.current = L;

      if (!mapInstanceRef.current) {
        const instance = L.map(mapContainerRef.current, {
          scrollWheelZoom: false,
        }).setView([centerLat, centerLng], zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(instance);

        mapInstanceRef.current = instance;
      }
    };

    // Allow Ctrl / Cmd + scroll wheel to zoom the map even when scrollZoomEnabled is false
    const handleWheel = (e: WheelEvent) => {
      const map = mapInstanceRef.current;
      if (!map) return;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          map.zoomIn();
        } else if (e.deltaY > 0) {
          map.zoomOut();
        }
      }
    };

    containerEl.addEventListener('wheel', handleWheel, { passive: false });
    setupMap();

    return () => {
      isMounted = false;
      containerEl.removeEventListener('wheel', handleWheel);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current.clear();
      }
    };
  }, []);

  // 2. Recenter map only when city/center coordinates explicitly change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView([centerLat, centerLng], zoom, { animate: true });
  }, [centerLat, centerLng, zoom]);

  // 3. Rebuild markers & fit bounds ONLY when the actual list of hospitals changes
  useEffect(() => {
    let cancelled = false;

    const syncMarkers = async () => {
      const L = leafletRef.current || (await import('leaflet'));
      if (cancelled || !mapInstanceRef.current) return;
      leafletRef.current = L;
      const map = mapInstanceRef.current;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();

      const hospitalIcon = L.divIcon({
        className: 'custom-hospital-marker',
        html: `
          <div style="background-color: #1F6E66; color: white; border-radius: 9999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(44,30,22,0.28); border: 2px solid #FAF6F0;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 6v12M6 12h12"/>
            </svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -32],
      });

      const selectedIcon = L.divIcon({
        className: 'custom-hospital-marker-selected',
        html: `
          <div style="background-color: #6E4731; color: white; border-radius: 9999px; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 18px rgba(44,30,22,0.35); border: 3px solid #FAF6F0;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 6v12M6 12h12"/>
            </svg>
          </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 42],
        popupAnchor: [0, -40],
      });

      hospitals.forEach((hosp) => {
        if (!hosp.lat || !hosp.lng) return;

        const isSelected = selectedHospital?.id === hosp.id;
        const marker = L.marker([hosp.lat, hosp.lng], {
          icon: isSelected ? selectedIcon : hospitalIcon,
        }).addTo(map);

        const popupContent = document.createElement('div');
        popupContent.className = 'p-1';
        popupContent.innerHTML = `
          <div style="min-width: 200px; font-family: inherit;">
            <h4 style="font-weight: 700; font-size: 14px; margin: 0 0 4px 0; color: #2C221E;">${hosp.name}</h4>
            <p style="font-size: 11px; color: #6E5D53; margin: 0 0 8px 0;">${hosp.city} · ${hosp.phone}</p>
          </div>
        `;

        const btn = document.createElement('button');
        btn.innerText = 'Select Facility';
        btn.style.cssText =
          'width: 100%; background: #1F6E66; color: white; border: none; padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer;';
        btn.onclick = () => {
          if (onSelectHospitalRef.current) onSelectHospitalRef.current(hosp);
        };
        popupContent.appendChild(btn);

        marker.bindPopup(popupContent);

        marker.on('click', () => {
          if (onSelectHospitalRef.current) onSelectHospitalRef.current(hosp);
        });

        markersRef.current.set(hosp.id, marker);
      });

      if (
        hospitals.length > 1 &&
        !selectedHospital &&
        lastFittedKeyRef.current !== hospitalsKey
      ) {
        const allMarkers = Array.from(markersRef.current.values());
        if (allMarkers.length > 0) {
          const group = L.featureGroup(allMarkers);
          map.fitBounds(group.getBounds().pad(0.15));
          lastFittedKeyRef.current = hospitalsKey;
        }
      }
    };

    syncMarkers();

    return () => {
      cancelled = true;
    };
  }, [hospitalsKey]);

  // 4. Update selected marker icon & open popup without resetting markers when a hospital is selected
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    const hospitalIcon = L.divIcon({
      className: 'custom-hospital-marker',
      html: `
        <div style="background-color: #1F6E66; color: white; border-radius: 9999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(44,30,22,0.28); border: 2px solid #FAF6F0;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 6v12M6 12h12"/>
          </svg>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -32],
    });

    const selectedIcon = L.divIcon({
      className: 'custom-hospital-marker-selected',
      html: `
        <div style="background-color: #6E4731; color: white; border-radius: 9999px; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 18px rgba(44,30,22,0.35); border: 3px solid #FAF6F0;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 6v12M6 12h12"/>
          </svg>
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 42],
      popupAnchor: [0, -40],
    });

    markersRef.current.forEach((marker, id) => {
      const isSelected = selectedHospital?.id === id;
      marker.setIcon(isSelected ? selectedIcon : hospitalIcon);
      if (isSelected) {
        marker.openPopup();
        const latLng = marker.getLatLng();
        map.setView(latLng, Math.max(map.getZoom(), 13), { animate: true });
      }
    });
  }, [selectedHospital?.id]);

  return (
    <div
      className="relative w-full h-full rounded-2xl overflow-hidden bg-[#EFE6DA]"
      onMouseLeave={() => {
        if (scrollZoomEnabled) setScrollZoomEnabled(false);
      }}
    >
      <div ref={mapContainerRef} className="w-full h-full min-h-[360px]" />
      <button
        type="button"
        onClick={() => setScrollZoomEnabled((prev) => !prev)}
        className={`absolute top-3 right-3 z-[400] px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all shadow-sm border ${
          scrollZoomEnabled
            ? 'bg-[#1F6E66] text-white border-[#1F6E66]'
            : 'glass-pill text-[#2C221E] border-[#E6DACB] hover:bg-white/90'
        }`}
        title="Toggle mouse wheel zoom on map (or hold Ctrl/Cmd + Scroll)"
      >
        {scrollZoomEnabled ? 'Scroll Zoom: On' : 'Scroll Zoom: Off (Ctrl + Scroll)'}
      </button>
      <div className="absolute bottom-3 right-3 z-[400] glass-pill px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#2C221E] tabular-nums">
        {hospitals.length} Facilities
      </div>
    </div>
  );
};

