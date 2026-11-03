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
  setDeliveryAddress: (address: string) => void;
  setDeliveryArea: (area: string) => void;
  setDeliveryCoordinates: (coords: { lat: number; lng: number } | null) => void;
  requestLocation: () => Promise<void>;
  findNearestOutletFromCoords: (lat: number, lng: number) => { outlet: Outlet; distance: number };
  setManualOutlet: (slug: string, address?: string, coords?: { lat: number; lng: number }) => void;
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

  // Restore stored outlet, coordinates and address on mount
  useEffect(() => {
    try {
      const storedSlug = localStorage.getItem(STORAGE_KEY_OUTLET);
      const storedDist = localStorage.getItem(STORAGE_KEY_DISTANCE);
      const storedAddr = localStorage.getItem(STORAGE_KEY_ADDRESS);
      const storedArea = localStorage.getItem(STORAGE_KEY_AREA);
      const storedCoords = localStorage.getItem(STORAGE_KEY_COORDS);
      const prompted = localStorage.getItem(STORAGE_KEY_PROMPTED);

      if (storedAddr) setDeliveryAddressState(storedAddr);
      if (storedArea) setDeliveryAreaState(storedArea);
      if (storedCoords) {
        try {
          setDeliveryCoordinatesState(JSON.parse(storedCoords));
        } catch {}
      }

      if (storedSlug) {
        const found = OUTLETS.find((o) => o.slug === storedSlug);
        if (found) {
          setNearestOutlet(found);
          setHasSetLocation(true);
          if (storedDist) setDistanceKm(parseFloat(storedDist));
          return;
        }
      }

      // If user hasn't set location or hasn't been prompted yet, open prompt on storefront
      if (!prompted) {
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          if (path.startsWith('/admin') || path.startsWith('/login')) {
            return;
          }
        }
        // Auto-open modal after a short graceful delay (800ms)
        const timer = setTimeout(() => {
          setIsLocationModalOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.warn('Failed to load location preference', e);
    }
  }, []);

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

  const findNearestOutletFromCoords = useCallback((lat: number, lng: number) => {
    let closestOutlet = OUTLETS[0];
    let minDistance = Infinity;

    for (const outlet of OUTLETS) {
      if (outlet.coordinates) {
        const dist = calculateDistanceKm(
          lat,
          lng,
          outlet.coordinates.lat,
          outlet.coordinates.lng
        );
        if (dist < minDistance) {
          minDistance = dist;
          closestOutlet = outlet;
        }
      }
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

    return { outlet: closestOutlet, distance: minDistance };
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
    const found = OUTLETS.find((o) => o.slug === slug);
    if (found) {
      setNearestOutlet(found);
      setDistanceKm(null);
      setHasSetLocation(true);
      setLocationError(null);
      setIsLocationModalOpen(false);

      if (coords) {
        setDeliveryCoordinatesState(coords);
        try {
          localStorage.setItem(STORAGE_KEY_COORDS, JSON.stringify(coords));
        } catch {}
      } else if (found.coordinates) {
        setDeliveryCoordinatesState(found.coordinates);
      }

      if (address) {
        setDeliveryAddressState(address);
        try {
          localStorage.setItem(STORAGE_KEY_ADDRESS, address);
        } catch {}
      }

      try {
        localStorage.setItem(STORAGE_KEY_OUTLET, found.slug);
        localStorage.removeItem(STORAGE_KEY_DISTANCE);
        localStorage.setItem(STORAGE_KEY_PROMPTED, 'true');
      } catch {}
    }
  }, []);

  const openLocationModal = useCallback(() => setIsLocationModalOpen(true), []);
  const closeLocationModal = useCallback(() => {
    setIsLocationModalOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY_PROMPTED, 'true');
    } catch {}
  }, []);

  return (
    <LocationContext.Provider
      value={{
        nearestOutlet,
        allOutlets: OUTLETS,
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
        requestLocation,
        findNearestOutletFromCoords,
        setManualOutlet,
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
