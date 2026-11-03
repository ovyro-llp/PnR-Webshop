'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Outlet } from '@/types';
import { OUTLETS } from '@/lib/data/mock-data';
import { calculateDistanceKm } from '@/context/LocationContext';
import { MapPin, Navigation, Check, Store, Compass } from 'lucide-react';

interface DeliveryMapPickerProps {
  initialCoords?: { lat: number; lng: number } | null;
  onConfirmLocation: (data: {
    lat: number;
    lng: number;
    nearestOutlet: Outlet;
    distanceKm: number;
    suggestedAddress?: string;
  }) => void;
  onClose?: () => void;
}

export function DeliveryMapPicker({
  initialCoords,
  onConfirmLocation,
  onClose,
}: DeliveryMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const deliveryMarkerRef = useRef<any>(null);

  const defaultCenter = initialCoords || { lat: 20.0043996, lng: 73.7579984 }; // Cycle Circle, Nashik

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>(defaultCenter);
  const [closestOutlet, setClosestOutlet] = useState<Outlet>(OUTLETS[0]);
  const [distance, setDistance] = useState<number>(0);
  const [isLocating, setIsLocating] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Compute nearest outlet from given coords
  const computeNearest = (lat: number, lng: number) => {
    let nearest = OUTLETS[0];
    let minKm = Infinity;

    for (const out of OUTLETS) {
      if (out.coordinates) {
        const d = calculateDistanceKm(lat, lng, out.coordinates.lat, out.coordinates.lng);
        if (d < minKm) {
          minKm = d;
          nearest = out;
        }
      }
    }
    return { nearest, distanceKm: minKm };
  };

  useEffect(() => {
    const { nearest, distanceKm } = computeNearest(currentCoords.lat, currentCoords.lng);
    setClosestOutlet(nearest);
    setDistance(distanceKm);
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    let isCancelled = false;

    async function initLeaflet() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      // Dynamically load leaflet css
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const L = await import('leaflet');

      if (isCancelled || !mapContainerRef.current) return;

      // Avoid re-initialization
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapContainerRef.current, {
        center: [currentCoords.lat, currentCoords.lng],
        zoom: 14,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Bakery Outlet Markers (Gold/Black)
      const bakeryIcon = L.divIcon({
        className: 'custom-bakery-icon',
        html: `
          <div style="
            background: #1C1917;
            color: #F59E0B;
            border: 2px solid #F59E0B;
            border-radius: 9999px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-size: 14px;
            font-weight: bold;
          ">
            🍰
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      // Place 3 Outlets
      OUTLETS.forEach((outlet) => {
        if (outlet.coordinates) {
          L.marker([outlet.coordinates.lat, outlet.coordinates.lng], {
            icon: bakeryIcon,
            title: outlet.name,
          })
            .addTo(map)
            .bindPopup(
              `<div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
                <b style="color: #1C1917;">${outlet.name}</b><br/>
                <span style="color: #666;">${outlet.area}</span><br/>
                <span style="color: #15803D; font-weight: 600;">✓ Ready for Dispatch</span>
              </div>`
            );
        }
      });

      // Draggable Delivery Pin Icon (Emerald/Red Pin with pulse)
      const customerPinIcon = L.divIcon({
        className: 'custom-customer-icon',
        html: `
          <div style="position: relative; width: 40px; height: 48px;">
            <div style="
              width: 36px;
              height: 36px;
              background: #047857;
              border: 3px solid #FFFFFF;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 4px 16px rgba(4,120,87,0.5);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="transform: rotate(45deg); color: white; font-size: 16px;">📍</span>
            </div>
            <div style="
              position: absolute;
              bottom: 0px;
              left: 10px;
              width: 16px;
              height: 6px;
              background: rgba(0,0,0,0.3);
              border-radius: 50%;
              filter: blur(1px);
            "></div>
          </div>
        `,
        iconSize: [40, 48],
        iconAnchor: [18, 46],
      });

      const deliveryMarker = L.marker([currentCoords.lat, currentCoords.lng], {
        icon: customerPinIcon,
        draggable: true,
        zIndexOffset: 1000,
      }).addTo(map);

      deliveryMarkerRef.current = deliveryMarker;

      const updatePosition = (lat: number, lng: number) => {
        setCurrentCoords({ lat, lng });
        const { nearest, distanceKm } = computeNearest(lat, lng);
        setClosestOutlet(nearest);
        setDistance(distanceKm);
      };

      // Drag event
      deliveryMarker.on('dragend', (e: any) => {
        const pos = e.target.getLatLng();
        updatePosition(pos.lat, pos.lng);
      });

      // Click on map to move pin
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        deliveryMarker.setLatLng([lat, lng]);
        updatePosition(lat, lng);
      });

      mapInstanceRef.current = map;
      setIsMapReady(true);
    }

    initLeaflet();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle GPS Locate Me
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setCurrentCoords({ lat: latitude, lng: longitude });

        if (mapInstanceRef.current && deliveryMarkerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16, { animate: true });
          deliveryMarkerRef.current.setLatLng([latitude, longitude]);
        }

        const { nearest, distanceKm } = computeNearest(latitude, longitude);
        setClosestOutlet(nearest);
        setDistance(distanceKm);
      },
      (err) => {
        setIsLocating(false);
        alert('Could not retrieve your location. Please click or drag the pin on the map to set your address.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleConfirm = () => {
    onConfirmLocation({
      lat: currentCoords.lat,
      lng: currentCoords.lng,
      nearestOutlet: closestOutlet,
      distanceKm: distance,
    });
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Top Banner with Nearest Kitchen indicator */}
      <div className="bg-stone-900 text-white rounded-2xl p-3 flex items-center justify-between text-xs shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <Store className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold block">
              Nearest Dispatch Kitchen
            </span>
            <p className="font-serif font-bold text-white text-xs truncate">
              {closestOutlet.name.replace("Puffs 'n' Rolls - ", '')}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] text-stone-400 block">Distance</span>
          <span className="font-mono font-bold text-emerald-400 text-xs">
            {distance} km
          </span>
        </div>
      </div>

      {/* Map Viewport Container */}
      <div className="relative w-full h-[260px] sm:h-[300px] rounded-2xl overflow-hidden border border-stone-200 shadow-inner bg-stone-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Instruction Banner */}
        <div className="absolute top-2.5 left-2.5 right-2.5 pointer-events-none z-10 flex justify-center">
          <span className="px-3 py-1 rounded-full bg-stone-900/80 backdrop-blur-md text-white text-[10px] font-medium shadow-md flex items-center gap-1.5">
            <Compass className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>Tap map or drag green pin to your exact delivery location</span>
          </span>
        </div>

        {/* Locate Me Floating Button */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="absolute bottom-3 left-3 z-10 bg-white hover:bg-stone-50 text-stone-900 px-3 py-1.5 rounded-full shadow-md border border-stone-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
        >
          <Navigation className={`w-3.5 h-3.5 text-emerald-600 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Locating...' : 'Locate Me (GPS)'}</span>
        </button>

        {/* Coordinates Badge */}
        <div className="absolute bottom-3 right-12 z-10 hidden sm:block bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-stone-200 text-[9px] font-mono text-stone-600 shadow-xs">
          {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-3 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-50 transition cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleConfirm}
          className="flex-2 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
        >
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Confirm Delivery Pin</span>
        </button>
      </div>
    </div>
  );
}
