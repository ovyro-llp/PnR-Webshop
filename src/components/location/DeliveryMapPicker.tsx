'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Outlet } from '@/types';
import { OUTLETS } from '@/lib/data/mock-data';
import { calculateDistanceKm } from '@/context/LocationContext';
import { MapPin, Navigation, Check, Store, Compass, Search, Loader2, Sparkles, Map as MapIcon } from 'lucide-react';

export interface LocationSelectedData {
  lat: number;
  lng: number;
  nearestOutlet: Outlet;
  distanceKm: number;
  formattedAddress: string;
  street: string;
  area: string;
  pincode: string;
  city: string;
}

interface DeliveryMapPickerProps {
  initialCoords?: { lat: number; lng: number } | null;
  onConfirmLocation?: (data: LocationSelectedData) => void;
  onLocationChange?: (data: LocationSelectedData) => void;
  onClose?: () => void;
  autoGeocodeOnMount?: boolean;
  showActionButtons?: boolean;
}

export function DeliveryMapPicker({
  initialCoords,
  onConfirmLocation,
  onLocationChange,
  onClose,
  autoGeocodeOnMount = true,
  showActionButtons = false,
}: DeliveryMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const deliveryMarkerRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);

  const defaultCenter = initialCoords || { lat: 20.0043996, lng: 73.7579984 }; // Cycle Circle, Nashik

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>(defaultCenter);
  const [closestOutlet, setClosestOutlet] = useState<Outlet>(OUTLETS[0]);
  const [distance, setDistance] = useState<number>(0);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<string>('');
  const [detectedStreet, setDetectedStreet] = useState<string>('');
  const [detectedArea, setDetectedArea] = useState<string>('Cycle Circle / College Road');
  const [detectedPincode, setDetectedPincode] = useState<string>('422005');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeProvider, setActiveProvider] = useState<'google' | 'leaflet'>('leaflet');

  // Compute nearest outlet from given coords
  const computeNearest = useCallback((lat: number, lng: number) => {
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
  }, []);

  // Reverse geocode via our unified server endpoint (Google Geocoding -> OSM fallback)
  const reverseGeocode = useCallback(
    async (lat: number, lng: number, emitChange = true) => {
      setIsGeocoding(true);
      try {
        const res = await fetch(`/api/location/reverse-geocode?lat=${lat}&lng=${lng}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setDetectedAddress(data.formattedAddress || data.street || '');
            setDetectedStreet(data.street || '');
            setDetectedArea(data.area || 'Cycle Circle / College Road');
            setDetectedPincode(data.pincode || '422005');

            const payload: LocationSelectedData = {
              lat,
              lng,
              nearestOutlet: data.nearestOutlet || closestOutlet,
              distanceKm: data.distanceKm ?? distance,
              formattedAddress: data.formattedAddress || data.street || '',
              street: data.street || '',
              area: data.area || 'Cycle Circle / College Road',
              pincode: data.pincode || '422005',
              city: data.city || 'Nashik',
            };

            if (emitChange && onLocationChange) {
              onLocationChange(payload);
            }
            return payload;
          }
        }
      } catch (err) {
        console.warn('Reverse geocode request failed:', err);
      } finally {
        setIsGeocoding(false);
      }
      return null;
    },
    [closestOutlet, distance, onLocationChange]
  );

  // Update position on map and trigger geocode
  const handlePositionChanged = useCallback(
    (lat: number, lng: number) => {
      setCurrentCoords({ lat, lng });
      const { nearest, distanceKm } = computeNearest(lat, lng);
      setClosestOutlet(nearest);
      setDistance(distanceKm);
      reverseGeocode(lat, lng, true);
    },
    [computeNearest, reverseGeocode]
  );

  // Initialize Map (Google Maps if API key is present, else Leaflet)
  useEffect(() => {
    let isCancelled = false;
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    async function loadGoogleMaps() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      // Check if google maps script is already loaded
      if (!(window as any).google || !(window as any).google.maps) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places`;
          script.async = true;
          script.defer = true;
          script.onload = () => resolve();
          script.onerror = (e) => reject(e);
          document.head.appendChild(script);
        });
      }

      if (isCancelled || !mapContainerRef.current) return;

      const google = (window as any).google;
      const map = new google.maps.Map(mapContainerRef.current, {
        center: { lat: currentCoords.lat, lng: currentCoords.lng },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      // Add Bakery Outlet Markers
      OUTLETS.forEach((outlet) => {
        if (outlet.coordinates) {
          const outletMarker = new google.maps.Marker({
            position: { lat: outlet.coordinates.lat, lng: outlet.coordinates.lng },
            map,
            title: outlet.name,
            icon: {
              url: 'https://cdn-icons-png.flaticon.com/512/992/992747.png',
              scaledSize: new google.maps.Size(32, 32),
            },
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `<div style="font-family:sans-serif;font-size:12px;padding:4px;"><b>${outlet.name}</b><br/><span style="color:#666">${outlet.area}</span></div>`,
          });

          outletMarker.addListener('click', () => {
            infoWindow.open(map, outletMarker);
          });
        }
      });

      // Draggable Delivery Pin
      const deliveryMarker = new google.maps.Marker({
        position: { lat: currentCoords.lat, lng: currentCoords.lng },
        map,
        draggable: true,
        title: 'Your Delivery Location',
        animation: google.maps.Animation.DROP,
      });

      deliveryMarker.addListener('dragend', () => {
        const pos = deliveryMarker.getPosition();
        if (pos) {
          handlePositionChanged(pos.lat(), pos.lng());
        }
      });

      map.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        deliveryMarker.setPosition({ lat, lng });
        handlePositionChanged(lat, lng);
      });

      // Google Places Autocomplete on search input
      if (searchInputRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
          componentRestrictions: { country: 'in' },
          fields: ['geometry', 'name', 'formatted_address'],
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            map.setCenter({ lat, lng });
            map.setZoom(16);
            deliveryMarker.setPosition({ lat, lng });
            handlePositionChanged(lat, lng);
          }
        });
        autocompleteRef.current = autocomplete;
      }

      mapInstanceRef.current = map;
      deliveryMarkerRef.current = deliveryMarker;
      setActiveProvider('google');
    }

    async function loadLeaflet() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const L = await import('leaflet');
      if (isCancelled || !mapContainerRef.current) return;

      if (mapInstanceRef.current && mapInstanceRef.current.remove) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapContainerRef.current, {
        center: [currentCoords.lat, currentCoords.lng],
        zoom: 15,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Bakery Icon
      const bakeryIcon = L.divIcon({
        className: 'custom-bakery-icon',
        html: `
          <div style="background:#1C1917;color:#F59E0B;border:2px solid #F59E0B;border-radius:9999px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-size:14px;font-weight:bold;">
            🍰
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      OUTLETS.forEach((outlet) => {
        if (outlet.coordinates) {
          L.marker([outlet.coordinates.lat, outlet.coordinates.lng], {
            icon: bakeryIcon,
            title: outlet.name,
          })
            .addTo(map)
            .bindPopup(
              `<div style="font-family:sans-serif;font-size:12px;padding:4px;"><b style="color:#1C1917;">${outlet.name}</b><br/><span style="color:#666;">${outlet.area}</span><br/><span style="color:#15803D;font-weight:600;">✓ Ready for Dispatch</span></div>`
            );
        }
      });

      // Customer Pin Icon
      const customerPinIcon = L.divIcon({
        className: 'custom-customer-icon',
        html: `
          <div style="position:relative;width:40px;height:48px;">
            <div style="width:36px;height:36px;background:#047857;border:3px solid #FFFFFF;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 16px rgba(4,120,87,0.5);display:flex;align-items:center;justify-content:center;">
              <span style="transform:rotate(45deg);color:white;font-size:16px;">📍</span>
            </div>
            <div style="position:absolute;bottom:0px;left:10px;width:16px;height:6px;background:rgba(0,0,0,0.3);border-radius:50%;filter:blur(1px);"></div>
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

      deliveryMarker.on('dragend', (e: any) => {
        const pos = e.target.getLatLng();
        handlePositionChanged(pos.lat, pos.lng);
      });

      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        deliveryMarker.setLatLng([lat, lng]);
        handlePositionChanged(lat, lng);
      });

      mapInstanceRef.current = map;
      deliveryMarkerRef.current = deliveryMarker;
      setActiveProvider('leaflet');
    }

    if (googleApiKey && googleApiKey.trim() !== '') {
      loadGoogleMaps().catch((err) => {
        console.warn('Google Maps loading failed, falling back to Leaflet:', err);
        loadLeaflet();
      });
    } else {
      loadLeaflet();
    }

    // Auto geocode on initial mount if requested
    if (autoGeocodeOnMount) {
      reverseGeocode(currentCoords.lat, currentCoords.lng, true);
    }

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current && mapInstanceRef.current.remove) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
      }
    };
  }, []);

  // GPS Locate Me
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

        if (activeProvider === 'google' && mapInstanceRef.current && deliveryMarkerRef.current) {
          mapInstanceRef.current.setCenter({ lat: latitude, lng: longitude });
          mapInstanceRef.current.setZoom(16);
          deliveryMarkerRef.current.setPosition({ lat: latitude, lng: longitude });
        } else if (mapInstanceRef.current && deliveryMarkerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16, { animate: true });
          deliveryMarkerRef.current.setLatLng([latitude, longitude]);
        }

        handlePositionChanged(latitude, longitude);
      },
      (err) => {
        setIsLocating(false);
        alert('Could not retrieve your GPS location. Please tap on the map or drag the green pin.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Search Address or Area in Nashik
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsGeocoding(true);
    try {
      // Geocode search query using Nominatim geocoding with Nashik bounded view
      const query = encodeURIComponent(`${searchQuery.trim()}, Nashik, Maharashtra`);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
        {
          headers: { 'User-Agent': 'PuffsNRollsBakery/1.0 (delivery@puffsnrolls.com)' },
        }
      );

      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lng = parseFloat(results[0].lon);

          if (activeProvider === 'google' && mapInstanceRef.current && deliveryMarkerRef.current) {
            mapInstanceRef.current.setCenter({ lat, lng });
            mapInstanceRef.current.setZoom(16);
            deliveryMarkerRef.current.setPosition({ lat, lng });
          } else if (mapInstanceRef.current && deliveryMarkerRef.current) {
            mapInstanceRef.current.setView([lat, lng], 16, { animate: true });
            deliveryMarkerRef.current.setLatLng([lat, lng]);
          }

          handlePositionChanged(lat, lng);
        } else {
          alert('Could not find that location in Nashik. Please tap directly on the map.');
        }
      }
    } catch (err) {
      console.warn('Search geocoding failed:', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleConfirm = () => {
    if (onConfirmLocation) {
      onConfirmLocation({
        lat: currentCoords.lat,
        lng: currentCoords.lng,
        nearestOutlet: closestOutlet,
        distanceKm: distance,
        formattedAddress: detectedAddress,
        street: detectedStreet,
        area: detectedArea,
        pincode: detectedPincode,
        city: 'Nashik',
      });
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Search Input Bar (Google Places Autocomplete or Direct Search) */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search building, street, or area in Nashik..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-16 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none shadow-2xs"
        />
        <button
          type="submit"
          disabled={isGeocoding || !searchQuery.trim()}
          className="absolute right-1.5 top-1 px-2.5 py-1 bg-stone-900 text-white rounded-lg text-[10px] font-semibold hover:bg-stone-800 disabled:opacity-50 transition cursor-pointer"
        >
          {isGeocoding ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Search'}
        </button>
      </form>

      {/* Map Viewport Container */}
      <div className="relative w-full h-[250px] sm:h-[280px] rounded-2xl overflow-hidden border border-stone-200 shadow-inner bg-stone-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Instruction Banner */}
        <div className="absolute top-2.5 left-2.5 right-2.5 pointer-events-none z-10 flex justify-center">
          <span className="px-3 py-1 rounded-full bg-stone-900/85 backdrop-blur-md text-white text-[10px] font-medium shadow-md flex items-center gap-1.5">
            <Compass className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>Tap map or drag pin to your exact delivery location</span>
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

        {/* Provider Badge */}
        <div className="absolute top-2.5 right-2.5 z-10 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full border border-stone-200 text-[9px] font-medium text-stone-600 shadow-2xs flex items-center gap-1">
          <MapIcon className="w-2.5 h-2.5 text-amber-600" />
          <span>{activeProvider === 'google' ? 'Google Maps' : 'Map Mode'}</span>
        </div>

        {/* Coordinates Badge */}
        <div className="absolute bottom-3 right-3 z-10 hidden sm:block bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-stone-200 text-[9px] font-mono text-stone-600 shadow-xs">
          {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
        </div>
      </div>

      {/* Live Auto-Detected Address Pill */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-2.5 flex items-start gap-2.5 text-xs text-amber-950">
        <MapPin className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
              Auto-Detected Pin Address
            </span>
            {isGeocoding && (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-semibold">
                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Detecting...
              </span>
            )}
          </div>
          <p className="font-medium text-stone-900 text-xs mt-0.5 line-clamp-2">
            {detectedAddress || (isGeocoding ? 'Resolving address from map pin...' : 'Near Cycle Circle, Nashik')}
          </p>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-600">
            <span className="font-semibold text-emerald-800">
              Kitchen: {closestOutlet.name.replace("Puffs 'n' Rolls - ", '')}
            </span>
            <span>•</span>
            <span className="font-mono">{distance} km away</span>
          </div>
        </div>
      </div>

      {/* Action Buttons (Only rendered when explicitly requested; otherwise no button below map) */}
      {showActionButtons && (
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
            <span>Confirm Pin &amp; Auto-fill Address</span>
          </button>
        </div>
      )}
    </div>
  );
}
