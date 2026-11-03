'use client';

import React, { useState } from 'react';
import { useLocation } from '@/context/LocationContext';
import { DeliveryMapPicker, LocationSelectedData } from './DeliveryMapPicker';
import { Outlet } from '@/types';
import {
  MapPin,
  Navigation,
  X,
  Check,
  Building2,
  Sparkles,
  Loader2,
  AlertCircle,
  Home,
  ArrowRight,
  Map,
  Edit3,
} from 'lucide-react';
import Image from 'next/image';

const LOCALITY_OPTIONS = [
  {
    slug: 'cycle-circle',
    name: 'Cycle Circle',
    areaKey: 'Cycle Circle / College Road',
    areas: 'Near Cycle Circle, Krishi Nagar, Thatte Nagar, BYK Circle, Canada Corner',
    badge: 'Flagship Kitchen',
  },
  {
    slug: 'nd-patel-road',
    name: 'ND Patel Road',
    areaKey: 'ND Patel Road / Shalimar',
    areas: 'Patel Plaza, Opp. BSNL Office, Mohan Nagar, CBS, Old Nashik, Shalimar',
    badge: 'Heritage Kitchen',
  },
  {
    slug: 'gangapur-road',
    name: 'Gangapur Road',
    areaKey: 'Gangapur Road / Sahdev Nagar',
    areas: 'Near Datta Chowk, Sahdev Nagar, Serene Meadows, Someshwar, Anandwalli',
    badge: 'Artisanal Bakes',
  },
];

export function LocationPromptModal() {
  const {
    nearestOutlet,
    isLocationModalOpen,
    closeLocationModal,
    requestLocation,
    setManualOutlet,
    isDetecting,
    locationError,
    distanceKm,
    hasSetLocation,
    deliveryAddress,
    setDeliveryAddress,
    deliveryArea,
    setDeliveryArea,
    deliveryCoordinates,
    setDeliveryCoordinates,
  } = useLocation();

  const [addressInput, setAddressInput] = useState(deliveryAddress || '');
  const [selectedArea, setSelectedArea] = useState(deliveryArea || 'Cycle Circle / College Road');
  const [pincodeInput, setPincodeInput] = useState('422005');
  const [activeTab, setActiveTab] = useState<'MAP' | 'LIST'>('MAP');
  const [hasMapAutoFilled, setHasMapAutoFilled] = useState(false);
  const [stagedCoords, setStagedCoords] = useState<{ lat: number; lng: number } | null>(
    deliveryCoordinates || null
  );
  const [stagedOutlet, setStagedOutlet] = useState<Outlet | null>(nearestOutlet || null);

  if (!isLocationModalOpen) return null;

  // Called continuously as user drags the pin, taps on map, or searches
  const handleMapLocationChange = (data: LocationSelectedData) => {
    setStagedCoords({ lat: data.lat, lng: data.lng });
    setStagedOutlet(data.nearestOutlet);

    // Auto-fill address if not already manually customized, or update with street
    setAddressInput((prev) => {
      // If user has already entered a flat/apartment prefix, preserve it and update street
      if (prev && prev.toLowerCase().includes('flat')) {
        const prefix = prev.split(',')[0];
        return `${prefix}, ${data.street || data.formattedAddress}`;
      }
      return data.street || data.formattedAddress;
    });

    if (data.area) {
      setSelectedArea(data.area);
    }
    if (data.pincode) {
      setPincodeInput(data.pincode);
    }
    setHasMapAutoFilled(true);
  };

  // Called when user clicks "Confirm Pin & Auto-fill Address" in the map picker
  const handleMapConfirm = (data: LocationSelectedData) => {
    handleMapLocationChange(data);
  };

  // Final confirmation to lock in address and coordinates
  const handleFinalConfirm = () => {
    const finalAddress = addressInput.trim() || 'Nashik';
    const finalArea = selectedArea || 'Cycle Circle / College Road';
    const outletToUse = stagedOutlet || nearestOutlet;

    setDeliveryAddress(finalAddress);
    setDeliveryArea(finalArea);

    if (stagedCoords) {
      setDeliveryCoordinates(stagedCoords);
      setManualOutlet(outletToUse.slug, finalAddress, stagedCoords);
    } else {
      setManualOutlet(outletToUse.slug, finalAddress);
    }

    closeLocationModal();
  };

  const handleSelectLocalityManual = (loc: typeof LOCALITY_OPTIONS[0]) => {
    setSelectedArea(loc.areaKey);
    setManualOutlet(loc.slug, addressInput.trim() || loc.name);
    setDeliveryAddress(addressInput.trim() || loc.name);
    setDeliveryArea(loc.areaKey);
    closeLocationModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] border border-stone-200 rounded-3xl max-w-lg w-full p-5 sm:p-7 relative shadow-2xl space-y-4 max-h-[94vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={closeLocationModal}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-800 p-1.5 rounded-full hover:bg-stone-200/50 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="relative h-10 w-36 mx-auto">
            <Image
              src="https://puffsnrolls.com/wp-content/uploads/2025/12/banner-logo.png"
              alt="Puffs 'n' Rolls"
              fill
              sizes="144px"
              className="object-contain"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-semibold tracking-widest uppercase bg-amber-100/70 text-amber-900 border border-amber-200/60">
            <Sparkles className="w-3 h-3 text-amber-700" />
            <span>Map-First Doorstep Delivery</span>
          </div>
          <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900 tracking-tight">
            Choose Delivery Location
          </h3>
          <p className="text-xs text-stone-600 max-w-xs mx-auto">
            Select your location on the map below. We will auto-fill your address and connect your nearest bakery kitchen.
          </p>
        </div>

        {/* Error Alert */}
        {locationError && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-2.5 flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-snug">{locationError}</p>
          </div>
        )}

        {/* Mode Switcher */}
        <div className="flex bg-stone-200/80 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('MAP')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'MAP'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Map className="w-3.5 h-3.5 text-emerald-600" />
            <span>Map Pin Selection (Recommended)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('LIST')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'LIST'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-stone-600" />
            <span>Select Locality List</span>
          </button>
        </div>

        {activeTab === 'MAP' ? (
          <div className="space-y-3">
            {/* 1. Map is shown FIRST */}
            <div className="rounded-2xl overflow-hidden border border-stone-200 bg-white p-2">
              <DeliveryMapPicker
                initialCoords={stagedCoords || deliveryCoordinates || undefined}
                onLocationChange={handleMapLocationChange}
                onConfirmLocation={handleMapConfirm}
                autoGeocodeOnMount={true}
              />
            </div>

            {/* 2. Auto-filled Address Fields (Editable by customer afterwards) */}
            <div className="bg-white rounded-2xl border border-stone-200 p-3.5 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1">
                  <Edit3 className="w-3 h-3 text-amber-600" />
                  <span>Verify / Edit Address Details</span>
                </span>
                {hasMapAutoFilled && (
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Auto-filled from map
                  </span>
                )}
              </div>

              {/* Editable House / Building details */}
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                  Flat No., Society / Building, Street *
                </label>
                <div className="relative">
                  <Home className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 402, Shrinath Heights, Opp. Circle"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 hover:bg-white focus:bg-white border border-stone-300 rounded-xl text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Editable Area and Pincode */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                    Locality *
                  </label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-none"
                  >
                    <option value="Cycle Circle / College Road">Cycle Circle / College Road</option>
                    <option value="Krishi Nagar / Thatte Nagar">Krishi Nagar / Thatte Nagar</option>
                    <option value="Gangapur Road / Sahdev Nagar">Gangapur Road / Sahdev Nagar</option>
                    <option value="Datta Chowk / Serene Meadows">Datta Chowk / Serene Meadows</option>
                    <option value="ND Patel Road / Shalimar">ND Patel Road / Shalimar</option>
                    <option value="CBS / Old Nashik">CBS / Old Nashik</option>
                    <option value="Panchavati">Panchavati</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pincodeInput}
                    onChange={(e) => setPincodeInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:bg-white focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Confirm & Continue CTA */}
            <button
              type="button"
              onClick={handleFinalConfirm}
              className="w-full py-3 bg-[#1C1917] hover:bg-stone-800 active:scale-[0.99] text-white rounded-xl text-xs font-bold tracking-wide transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Confirm Delivery Location & Order</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* GPS Locate Me Button */}
            <button
              onClick={requestLocation}
              disabled={isDetecting}
              className="w-full py-3 bg-[#1C1917] hover:bg-stone-800 active:scale-[0.99] text-white rounded-xl text-xs font-bold tracking-wide transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isDetecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Detecting Nearest Bakery Kitchen...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Use Device Current GPS</span>
                </>
              )}
            </button>

            {/* Manual Locality Picker */}
            <div className="space-y-2 pt-1">
              {LOCALITY_OPTIONS.map((loc) => {
                const isSelected = nearestOutlet?.slug === loc.slug;
                return (
                  <button
                    key={loc.slug}
                    onClick={() => handleSelectLocalityManual(loc)}
                    className={`w-full p-2.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-white border-stone-900 ring-1 ring-stone-900 shadow-xs'
                        : 'bg-white/70 hover:bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-stone-900 text-amber-400'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-xs text-stone-900 truncate">
                            {loc.name}
                          </p>
                          <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded-md bg-stone-100 text-stone-600 shrink-0">
                            {loc.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 truncate mt-0.5">
                          {loc.areas}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-stone-900 text-white flex items-center justify-center shrink-0 ml-2">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-2 text-center border-t border-stone-200/70">
          <p className="text-[10px] text-stone-400">
            Delivering hot & fresh from your nearest oven in under 25 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
