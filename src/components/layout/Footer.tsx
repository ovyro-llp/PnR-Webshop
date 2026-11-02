'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocation } from '@/context/LocationContext';
import { Phone, MapPin, ShieldCheck, Clock, Navigation } from 'lucide-react';

export function Footer() {
  const { nearestOutlet, openLocationModal, distanceKm } = useLocation();

  return (
    <footer className="bg-[#1C1917] text-stone-400 py-12 sm:py-16 text-xs w-full border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-10">
          {/* Brand & Story */}
          <div className="space-y-3 md:col-span-2">
            <Link href="/" className="inline-block relative h-10 w-36">
              <Image
                src="https://puffsnrolls.com/wp-content/uploads/2025/12/banner-logo.png"
                alt="Puffs 'n' Rolls"
                fill
                sizes="144px"
                className="object-contain brightness-0 invert"
              />
            </Link>
            <p className="text-stone-400 text-xs leading-relaxed max-w-md">
              Where Every Bite Unrolls Happiness. Handcrafting Nashik&apos;s favorite flaky puffs, artisan rolls, and decadent celebration cakes since 2001. Delivered fresh from your local bakery kitchen.
            </p>
            <div className="flex items-center gap-2 pt-2 text-stone-300 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>FSSAI Certified Bakery Kitchens • Pure Vegetarian Options Available</span>
            </div>
          </div>

          {/* Customer's Nearest Bakery Kitchen (Exclusive - No other outlets visible) */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Your Nearest Bakery</span>
            </h4>
            <div className="space-y-2 text-stone-400">
              <div>
                <p className="font-medium text-stone-200 text-sm">
                  {nearestOutlet.name.replace("Puffs 'n' Rolls - ", '')}
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {nearestOutlet.address}
                </p>
                {distanceKm && (
                  <p className="text-[10px] text-amber-400 font-mono mt-0.5">
                    {distanceKm} km from your location
                  </p>
                )}
              </div>
              <div className="pt-1 flex items-center gap-1 text-[11px] text-stone-400">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                <span>{nearestOutlet.openingHours}</span>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={openLocationModal}
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline flex items-center gap-1 cursor-pointer"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Update My Delivery Location</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick & Legal Links */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px]">
              Customer Care &amp; Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href={`/${nearestOutlet.slug}`} className="hover:text-white transition">
                  Browse Fresh Menu
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-white transition">
                  My Orders &amp; Account
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-amber-400 text-stone-300 font-medium transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-amber-400 text-stone-300 font-medium transition">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/terms#cancellation" className="hover:text-white transition">
                  Cancellation &amp; Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500">
          <p>© {new Date().getFullYear()} Puffs &apos;n&apos; Rolls Bakery. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href={`tel:${nearestOutlet.phone}`} className="hover:text-stone-300 font-mono">
              Direct Kitchen: {nearestOutlet.phone}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
