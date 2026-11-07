'use client';

import React, { useState } from 'react';
import { useLocation } from '@/context/LocationContext';
import { useCart } from '@/context/CartContext';
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
  Store,
} from 'lucide-react';
import Image from 'next/image';

const OUTLET_DIRECT_OPTIONS = [
  {
    slug: 'gangapur-road',
    name: "Gangapur Road",
    areaKey: 'Gangapur Road / Sahdev Nagar',
    areas: 'Near Datta Chowk, Sahdev Nagar, Serene Meadows, Someshwar, Anandwalli',
    badge: 'Artisanal Bakes & Cafe',
  },
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
];

export function LocationPromptModal() {
  const {
    nearestOutlet,
    allOutlets,
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
    setDeliveryArea,
    deliveryCoordinates,
    setDeliveryCoordinates,
  } = useLocation();

  const { setCartOutletSlug } = useCart();

  const [addressInput, setAddressInput] = useState(deliveryAddress || '');
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
    // Default to the geocoded nearest outlet if user hasn't explicitly overridden it
    if (!stagedOutlet || stagedOutlet.slug === nearestOutlet.slug) {
      setStagedOutlet(data.nearestOutlet);
    }

    // Auto-fill address if not already manually customized, or update with street
    setAddressInput((prev) => {
      if (prev && prev.toLowerCase().includes('flat')) {
        const prefix = prev.split(',')[0];
        return `${prefix}, ${data.street || data.formattedAddress}`;
      }
      return data.street || data.formattedAddress;
    });

    if (data.pincode) {
      setPincodeInput(data.pincode);
    }
    setHasMapAutoFilled(true);
  };

  // Called when user clicks "Confirm Pin & Auto-fill Address" in the map picker
  const handleMapConfirm = (data: LocationSelectedData) => {
    handleMapLocationChange(data);
  };

  // Final confirmation to lock in address, coordinates, and chosen outlet
  const handleFinalConfirm = () => {
    const finalAddress = addressInput.trim() || 'Nashik Doorstep Location';
    const outletToUse = stagedOutlet || nearestOutlet;
    const finalArea = outletToUse.area || 'Nashik City';

    setDeliveryAddress(finalAddress);
    setDeliveryArea(finalArea);
    setCartOutletSlug(outletToUse.slug);

    if (stagedCoords) {
      setDeliveryCoordinates(stagedCoords);
      setManualOutlet(outletToUse.slug, finalAddress, stagedCoords);
    } else {
      setManualOutlet(outletToUse.slug, finalAddress);
    }

    closeLocationModal();
  };

  const handleSelectOutletDirect = (slug: string) => {
    const found = allOutlets.find((o) => o.slug === slug);
    if (!found) return;

    setStagedOutlet(found);
    setCartOutletSlug(found.slug);
    const finalAddress = addressInput.trim() || deliveryAddress || found.name;
    setDeliveryAddress(finalAddress);
    setDeliveryArea(found.area);

    if (stagedCoords || deliveryCoordinates) {
      const coords = stagedCoords || deliveryCoordinates!;
      setManualOutlet(found.slug, finalAddress, coords);
    } else {
      setManualOutlet(found.slug, finalAddress);
    }
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
            Pinpoint your doorstep on the map below, edit your address, and select your preferred bakery kitchen.
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
            <Store className="w-3.5 h-3.5 text-amber-700" />
            <span>Choose Bakery Outlet</span>
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

            {/* 2. Auto-filled Address Fields (Editable by customer) */}
            <div className="bg-white rounded-2xl border border-stone-200 p-3.5 space-y-3 shadow-xs">
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

              {/* Pincode Input (NO Locality field) */}
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                  Delivery Pincode *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pincodeInput}
                  placeholder="e.g. 422005"
                  onChange={(e) => setPincodeInput(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:bg-white focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              </div>

              {/* Fulfilling Bakery Kitchen / Outlet Choice */}
              <div className="pt-2 border-t border-stone-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-amber-700" />
                    <span>Fulfilling Bakery Kitchen</span>
                  </label>
                  <span className="text-[9px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {stagedOutlet ? stagedOutlet.name.replace("Puffs 'n' Rolls - ", '') : nearestOutlet.name.replace("Puffs 'n' Rolls - ", '')}
                  </span>
                </div>
                <select
                  value={stagedOutlet?.slug || nearestOutlet.slug}
                  onChange={(e) => {
                    const found = allOutlets.find((o) => o.slug === e.target.value);
                    if (found) setStagedOutlet(found);
                  }}
                  className="w-full px-3 py-2 bg-amber-50/50 hover:bg-white focus:bg-white border border-amber-300 rounded-xl text-xs font-semibold text-stone-900 focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer"
                >
                  {allOutlets.map((o) => (
                    <option key={o.slug} value={o.slug}>
                      {o.name.replace("Puffs 'n' Rolls - ", '')} ({o.area}) {o.isOpen ? '• Baking Fresh' : '• Paused'}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-stone-500">
                  You can order from Gangapur Road, Cycle Circle, or ND Patel Road. Choose your preferred kitchen above.
                </p>
              </div>
            </div>

            {/* Confirm & Continue CTA */}
            <button
              type="button"
              onClick={handleFinalConfirm}
              className="w-full py-3 bg-[#1C1917] hover:bg-stone-800 active:scale-[0.99] text-white rounded-xl text-xs font-bold tracking-wide transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Confirm Delivery Location &amp; Order</span>
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

            {/* Direct Outlet Picker */}
            <div className="space-y-2 pt-1">
              <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                Select Specific Bakery Kitchen To Order From:
              </p>
              {OUTLET_DIRECT_OPTIONS.map((loc) => {
                const currentSlug = stagedOutlet?.slug || nearestOutlet?.slug;
                const isSelected = currentSlug === loc.slug;
                return (
                  <button
                    key={loc.slug}
                    onClick={() => handleSelectOutletDirect(loc.slug)}
                    className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-white border-stone-900 ring-2 ring-stone-900/10 shadow-xs'
                        : 'bg-white/70 hover:bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-stone-900 text-amber-400'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        <Store className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-xs text-stone-900 truncate">
                            Puffs &apos;n&apos; Rolls - {loc.name}
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
            Delivering hot &amp; fresh from your selected oven in under 25 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
