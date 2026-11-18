'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Outlet } from '@/types';
import { OUTLETS } from '@/lib/data/mock-data';

export interface LocationContextType {
  nearestOutlet: Outlet;
  allOutlets: Outlet[];
  distanceKm: number | null;
  deliveryAddress: string;
  deliveryArea: string;
  deliveryCoordinates: { lat: number; lng: number } | null;
  isDetecting: boolean;
  locationError: string | null;
  hasSetLocation: boolean;
  isLocationModalOpen: boolean;
  failoverNotice: { wasPausedOutlet: Outlet; servingOutlet: Outlet } | null;
  dismissFailoverNotice: () => void;
  isOutletPaused: (slug?: string) => boolean;
  refreshOutlets: () => Promise<Outlet[] | null>;
  setDeliveryAddress: (address: string) => void;
  setDeliveryArea: (area: string) => void;
  setDeliveryCoordinates: (coords: { lat: number; lng: number } | null) => void;
  requestLocation: () => Promise<void>;
  findNearestOutletFromCoords: (lat: number, lng: number, candidateOutlets?: Outlet[]) => {
    outlet: Outlet;
    distance: number;
    physicalNearest?: Outlet;
    isFailover?: boolean;
  };
  setManualOutlet: (slug: string, address?: string, coords?: { lat: number; lng: number }) => void;
  switchOutlet: (slug: string) => void;
  openLocationModal: () => void;
  closeLocationModal: () => void;
}

// Calculate distance between two lat/lng points using the Haversine formula
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const STORAGE_KEY_OUTLET = 'pnr_customer_assigned_outlet';
const STORAGE_KEY_DISTANCE = 'pnr_customer_distance_km';
const STORAGE_KEY_PROMPTED = 'pnr_location_prompted';
const STORAGE_KEY_ADDRESS = 'pnr_customer_delivery_address';
const STORAGE_KEY_AREA = 'pnr_customer_delivery_area';
const STORAGE_KEY_COORDS = 'pnr_customer_delivery_coords';

export function LocationProvider({ children }: { children: React.ReactNode }) {
  // Default to Cycle Circle (flagship outlet) if not yet resolved
  const [nearestOutlet, setNearestOutlet] = useState<Outlet>(() => OUTLETS[0]);
  const [allOutlets, setAllOutlets] = useState<Outlet[]>(OUTLETS);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [deliveryAddress, setDeliveryAddressState] = useState('');
  const [deliveryArea, setDeliveryAreaState] = useState('');
  const [deliveryCoordinates, setDeliveryCoordinatesState] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hasSetLocation, setHasSetLocation] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [failoverNotice, setFailoverNotice] = useState<{
    wasPausedOutlet: Outlet;
    servingOutlet: Outlet;
  } | null>(null);

  const dismissFailoverNotice = useCallback(() => {
    setFailoverNotice(null);
  }, []);

  const refreshOutlets = useCallback(async (): Promise<Outlet[] | null> => {
    try {
      const res = await fetch('/api/outlets');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.outlets) && data.outlets.length > 0) {
          setAllOutlets(data.outlets);
          return data.outlets;
        }
      }
    } catch (e) {
      console.warn('Failed to load live outlets in LocationProvider', e);
    }
    return null;
  }, []);

  const isOutletPaused = useCallback((slug?: string): boolean => {
    if (!slug) return false;
    const found = allOutlets.find((o) => o.slug === slug);
    return found ? found.isOpen === false : false;
  }, [allOutlets]);

  const findNearestOutletFromCoords = useCallback(
    (lat: number, lng: number, candidateOutlets?: Outlet[]) => {
      const outlets = candidateOutlets || allOutlets || OUTLETS;

      // 1. Compute physical closest
      let physicalNearest = outlets[0] || OUTLETS[0];
      let minPhysicalDistance = Infinity;
      for (const outlet of outlets) {
        if (outlet.coordinates) {
          const dist = calculateDistanceKm(lat, lng, outlet.coordinates.lat, outlet.coordinates.lng);
          if (dist < minPhysicalDistance) {
            minPhysicalDistance = dist;
            physicalNearest = outlet;
          }
        }
      }

      // 2. Compute closest among active/open outlets
      const openOutlets = outlets.filter((o) => o.isOpen !== false);
      const activeTargets = openOutlets.length > 0 ? openOutlets : outlets;

      let closestOutlet = activeTargets[0] || OUTLETS[0];
      let minDistance = Infinity;

      for (const outlet of activeTargets) {
        if (outlet.coordinates) {
          const dist = calculateDistanceKm(lat, lng, outlet.coordinates.lat, outlet.coordinates.lng);
          if (dist < minDistance) {
            minDistance = dist;
            closestOutlet = outlet;
          }
        }
      }

      const isFailover = physicalNearest.slug !== closestOutlet.slug && physicalNearest.isOpen === false;

      if (isFailover) {
        setFailoverNotice({
          wasPausedOutlet: physicalNearest,
          servingOutlet: closestOutlet,
        });
      } else {
        setFailoverNotice(null);
      }

      setNearestOutlet(closestOutlet);
      setDistanceKm(minDistance);
      setHasSetLocation(true);
      setLocationError(null);
      setDeliveryCoordinatesState({ lat, lng });

      try {
        localStorage.setItem(STORAGE_KEY_OUTLET, closestOutlet.slug);
        localStorage.setItem(STORAGE_KEY_DISTANCE, minDistance.toString());
        localStorage.setItem(STORAGE_KEY_COORDS, JSON.stringify({ lat, lng }));
        localStorage.setItem(STORAGE_KEY_PROMPTED, 'true');
      } catch {}

      return {
        outlet: closestOutlet,
        distance: minDistance,
        physicalNearest,
        isFailover,
      };
    },
    [allOutlets]
  );

  // Restore stored outlet, coordinates and address on mount, then sync live outlet status
  useEffect(() => {
    try {
      const storedSlug = localStorage.getItem(STORAGE_KEY_OUTLET);
      const storedDist = localStorage.getItem(STORAGE_KEY_DISTANCE);
      const storedAddr = localStorage.getItem(STORAGE_KEY_ADDRESS);
      const storedArea = localStorage.getItem(STORAGE_KEY_AREA);
      const storedCoords = localStorage.getItem(STORAGE_KEY_COORDS);

      if (storedAddr) setDeliveryAddressState(storedAddr);
      if (storedArea) setDeliveryAreaState(storedArea);

      let parsedCoords: { lat: number; lng: number } | null = null;
      if (storedCoords) {
        try {
          const parsed = JSON.parse(storedCoords);
          if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
            parsedCoords = parsed;
            setDeliveryCoordinatesState(parsed);
          }
        } catch {}
      }

      const hasValidCoords = Boolean(parsedCoords);

      if (hasValidCoords) {
        setHasSetLocation(true);
        if (storedSlug) {
          const found = OUTLETS.find((o) => o.slug === storedSlug);
          if (found) setNearestOutlet(found);
        } else if (parsedCoords) {
          // Recompute closest outlet from saved coordinates
          findNearestOutletFromCoords(parsedCoords.lat, parsedCoords.lng);
        }
        if (storedDist) setDistanceKm(parseFloat(storedDist));
      } else {
        // MANDATORY GATE: No valid doorstep coordinates found
        setHasSetLocation(false);
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          const isExcluded =
            path.startsWith('/admin') ||
            path.startsWith('/login') ||
            path.startsWith('/b2b') ||
            path.startsWith('/privacy') ||
            path.startsWith('/terms');
          if (!isExcluded) {
            // Immediately open location modal (0ms) so customer cannot browse or order without coordinates
            setIsLocationModalOpen(true);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load location preference', e);
    }

    // Dynamic failover check: fetch live outlets and re-route if saved outlet is paused
    refreshOutlets().then((live) => {
      if (!live || live.length === 0) return;
      const storedSlug = localStorage.getItem(STORAGE_KEY_OUTLET);
      const storedCoords = localStorage.getItem(STORAGE_KEY_COORDS);
      let parsedCoords: { lat: number; lng: number } | null = null;
      if (storedCoords) {
        try {
          parsedCoords = JSON.parse(storedCoords);
        } catch {}
      }

      if (storedSlug) {
        const matchingOutlet = live.find((o) => o.slug === storedSlug);
        // If stored outlet was paused by kitchen, auto-failover to closest open outlet!
        if (matchingOutlet && matchingOutlet.isOpen === false && parsedCoords) {
          findNearestOutletFromCoords(parsedCoords.lat, parsedCoords.lng, live);
        } else if (matchingOutlet) {
          setNearestOutlet(matchingOutlet);
        }
      }
    });
  }, [findNearestOutletFromCoords, refreshOutlets]);

  const setDeliveryAddress = useCallback((address: string) => {
    setDeliveryAddressState(address);
    try {
      localStorage.setItem(STORAGE_KEY_ADDRESS, address);
    } catch {}
  }, []);

  const setDeliveryArea = useCallback((area: string) => {
    setDeliveryAreaState(area);
    try {
      localStorage.setItem(STORAGE_KEY_AREA, area);
    } catch {}
  }, []);

  const setDeliveryCoordinates = useCallback((coords: { lat: number; lng: number } | null) => {
    setDeliveryCoordinatesState(coords);
    try {
      if (coords) {
        localStorage.setItem(STORAGE_KEY_COORDS, JSON.stringify(coords));
      } else {
        localStorage.removeItem(STORAGE_KEY_COORDS);
      }
    } catch {}
  }, []);

  const requestLocation = useCallback(async () => {
    setIsDetecting(true);
    setLocationError(null);

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setIsDetecting(false);
      setLocationError('Geolocation is not supported by your browser. Please enter your address below.');
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY_PROMPTED, 'true');
    } catch {}

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsDetecting(false);
        const { latitude, longitude } = position.coords;
        findNearestOutletFromCoords(latitude, longitude);
        setIsLocationModalOpen(false);
      },
      (error) => {
        setIsDetecting(false);
        let msg = 'Could not access your location. Please select your nearest Nashik area below.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please select your Nashik neighborhood below.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please enter your address or area below.';
        }
        setLocationError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [findNearestOutletFromCoords]);

  const setManualOutlet = useCallback((slug: string, address?: string, coords?: { lat: number; lng: number }) => {
    const list = allOutlets && allOutlets.length > 0 ? allOutlets : OUTLETS;
    const found = list.find((o) => o.slug === slug);
    if (found) {
      setNearestOutlet(found);
      setHasSetLocation(true);
      setLocationError(null);
      setIsLocationModalOpen(false);

      const effectiveCoords = coords || deliveryCoordinates || found.coordinates;
      if (coords) {
        setDeliveryCoordinatesState(coords);
        try {
          localStorage.setItem(STORAGE_KEY_COORDS, JSON.stringify(coords));
        } catch {}
      } else if (found.coordinates && !deliveryCoordinates) {
        setDeliveryCoordinatesState(found.coordinates);
      }

      if (effectiveCoords && found.coordinates) {
        const dist = calculateDistanceKm(
          effectiveCoords.lat,
          effectiveCoords.lng,
          found.coordinates.lat,
          found.coordinates.lng
        );
        setDistanceKm(dist);
        try {
          localStorage.setItem(STORAGE_KEY_DISTANCE, String(dist));
        } catch {}
      } else {
        setDistanceKm(null);
      }

      if (address) {
        setDeliveryAddressState(address);
        try {
          localStorage.setItem(STORAGE_KEY_ADDRESS, address);
        } catch {}
      }

      try {
        localStorage.setItem(STORAGE_KEY_OUTLET, found.slug);
        localStorage.setItem(STORAGE_KEY_PROMPTED, 'true');
      } catch {}
    }
  }, [allOutlets, deliveryCoordinates]);

  const switchOutlet = useCallback((slug: string) => {
    const list = allOutlets && allOutlets.length > 0 ? allOutlets : OUTLETS;
    const found = list.find((o) => o.slug === slug);
    if (found) {
      setNearestOutlet(found);
      try {
        localStorage.setItem(STORAGE_KEY_OUTLET, found.slug);
      } catch {}

      if (deliveryCoordinates && found.coordinates) {
        const dist = calculateDistanceKm(
          deliveryCoordinates.lat,
          deliveryCoordinates.lng,
          found.coordinates.lat,
          found.coordinates.lng
        );
        setDistanceKm(dist);
        try {
          localStorage.setItem(STORAGE_KEY_DISTANCE, String(dist));
        } catch {}
      }
    }
  }, [allOutlets, deliveryCoordinates]);

  const openLocationModal = useCallback(() => setIsLocationModalOpen(true), []);
  const closeLocationModal = useCallback(() => {
    // Only allow dismissing if customer already has confirmed delivery coordinates
    if (deliveryCoordinates && typeof deliveryCoordinates.lat === 'number') {
      setIsLocationModalOpen(false);
    }
  }, [deliveryCoordinates]);

  return (
    <LocationContext.Provider
      value={{
        nearestOutlet,
        allOutlets,
        distanceKm,
        deliveryAddress,
        deliveryArea,
        deliveryCoordinates,
        setDeliveryAddress,
        setDeliveryArea,
        setDeliveryCoordinates,
        isDetecting,
        locationError,
        hasSetLocation,
        isLocationModalOpen,
        failoverNotice,
        dismissFailoverNotice,
        isOutletPaused,
        refreshOutlets,
        requestLocation,
        findNearestOutletFromCoords,
        setManualOutlet,
        switchOutlet,
        openLocationModal,
        closeLocationModal,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
