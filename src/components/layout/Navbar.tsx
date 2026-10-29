'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OUTLETS } from '@/lib/data/mock-data';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, MapPin, Store, SlidersHorizontal } from 'lucide-react';

interface NavbarProps {
  currentOutletSlug?: string;
  currentCampaignSlug?: string;
}

export function Navbar({ currentOutletSlug, currentCampaignSlug }: NavbarProps) {
  const router = useRouter();
  const { itemCount, setIsCartOpen } = useCart();

  const handleOutletChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSlug = e.target.value;
    if (newSlug) {
      if (currentCampaignSlug) {
        router.push(`/${newSlug}/${currentCampaignSlug}`);
      } else {
        router.push(`/${newSlug}`);
      }
    } else {
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-700 to-amber-500 text-white flex items-center justify-center font-black text-lg shadow-md group-hover:scale-105 transition">
            P&R
          </div>
          <div>
            <span className="font-black text-stone-900 tracking-tight text-base sm:text-lg block leading-none">
              PUFFS &amp; ROLLS
            </span>
            <span className="text-[10px] font-semibold text-amber-700 tracking-wider uppercase block mt-0.5">
              Nashik Artisanal Bakery
            </span>
          </div>
        </Link>

        {/* Outlet Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200/80 rounded-xl px-2.5 py-1.5 text-xs text-stone-700">
            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <select
              value={currentOutletSlug || ''}
              onChange={handleOutletChange}
              className="bg-transparent font-medium text-stone-800 text-xs focus:outline-none cursor-pointer"
            >
              <option value="">All Outlets (Nashik)</option>
              {OUTLETS.map((outlet) => (
                <option key={outlet.slug} value={outlet.slug}>
                  {outlet.name.replace('Puffs and Rolls - ', '')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions: Admin & Cart */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/admin"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 hover:border-stone-300 text-stone-600 hover:text-stone-900 text-xs font-semibold transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
            <span>Admin &amp; Pixels</span>
          </Link>

          {/* Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Basket</span>
            {itemCount > 0 && (
              <span className="bg-white text-amber-700 font-extrabold text-[11px] px-1.5 py-0.2 rounded-full min-w-[18px] text-center shadow">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
