'use client';

import React, { useState } from 'react';
import { useLocation } from '@/context/LocationContext';
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
} from 'lucide-react';
import Image from 'next/image';

const LOCALITY_OPTIONS = [
  {
    slug: 'college-road',
    name: 'Cycle Circle / College Road',
    areas: 'Near Cycle Circle, Krishi Nagar, Thatte Nagar, BYK Circle, Canada Corner',
    badge: 'Flagship Kitchen',
  },
  {
    slug: 'gangapur-road',
    name: 'Gangapur Road / Sahdev Nagar',
    areas: 'Near Datta Chowk, Sahdev Nagar, Serene Meadows, Someshwar, Anandwalli',
    badge: 'Artisanal Bakes',
  },
  {
    slug: 'nd-patel-road',
    name: 'ND Patel Road / Shalimar',
    areas: 'Patel Plaza, Opp. BSNL Office, Mohan Nagar, CBS, Old Nashik, Panchavati',
    badge: 'Heritage Kitchen',
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
  } = useLocation();

  const [addressInput, setAddressInput] = useState(deliveryAddress || '');

  if (!isLocationModalOpen) return null;

  const handleConfirmAddress = (slug: string) => {
    if (addressInput.trim()) {
      setDeliveryAddress(addressInput.trim());
    }
    setManualOutlet(slug, addressInput.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] border border-stone-200 rounded-3xl max-w-md w-full p-6 sm:p-8 relative shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={closeLocationModal}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-800 p-1.5 rounded-full hover:bg-stone-200/50 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="relative h-11 w-36 mx-auto">
            <Image
              src="https://puffsnrolls.com/wp-content/uploads/2025/12/banner-logo.png"
              alt="Puffs 'n' Rolls"
              fill
              sizes="144px"
              className="object-contain"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold tracking-widest uppercase bg-amber-100/70 text-amber-900 border border-amber-200/60">
            <Sparkles className="w-3 h-3 text-amber-700" />
            <span>Doorstep Bakery Delivery</span>
          </div>
          <h3 className="text-xl font-serif font-bold text-stone-900 tracking-tight pt-1">
            Where Should We Deliver?
          </h3>
          <p className="text-xs text-stone-600 max-w-xs mx-auto leading-relaxed">
            Enter your delivery address or allow location access so we can connect you to your nearest kitchen for fast 25-minute delivery.
          </p>
        </div>

        {/* Current / Detected Summary if already resolved */}
        {hasSetLocation && nearestOutlet && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Nearest Kitchen
              </span>
              <p className="font-serif font-bold text-stone-900 text-xs truncate">
                {nearestOutlet.name.replace("Puffs 'n' Rolls - ", '')}
              </p>
              <p className="text-[11px] text-stone-500 truncate">
                {distanceKm ? `${distanceKm} km away • ` : ''}
                {nearestOutlet.area}
              </p>
            </div>
          </div>
        )}

        {/* Error Alert if Permission Denied or Failed */}
        {locationError && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-snug">{locationError}</p>
          </div>
        )}

        {/* Delivery Address Input */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700">
            Delivery House / Flat / Society *
          </label>
          <div className="relative">
            <Home className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="e.g. Flat 402, Shrinath Heights, Thatte Nagar"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Primary Action: Request GPS Location */}
        <div className="space-y-1">
          <button
            onClick={requestLocation}
            disabled={isDetecting}
            className="w-full py-3 bg-[#1C1917] hover:bg-stone-800 active:scale-[0.99] text-white rounded-xl text-xs font-bold tracking-wide transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isDetecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Detecting Nearest Bakery...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Use Current Location (GPS)</span>
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center pt-1">
          <div className="border-t border-stone-200 w-full" />
          <span className="bg-[#FAF8F5] px-3 text-[10px] uppercase font-bold tracking-wider text-stone-400 shrink-0">
            Or Choose Your Nashik Area
          </span>
          <div className="border-t border-stone-200 w-full" />
        </div>

        {/* Manual Locality Picker */}
        <div className="space-y-2">
          {LOCALITY_OPTIONS.map((loc) => {
            const isSelected = nearestOutlet?.slug === loc.slug;
            return (
              <button
                key={loc.slug}
                onClick={() => handleConfirmAddress(loc.slug)}
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

        <div className="pt-2 text-center border-t border-stone-200/70">
          <p className="text-[10px] text-stone-400">
            Delivering hot and fresh from your nearest oven in under 25 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
