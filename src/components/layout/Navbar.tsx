'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { OUTLETS } from '@/lib/data/mock-data';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ShoppingBag, MapPin, ChevronDown, User } from 'lucide-react';

interface NavbarProps {
  currentOutletSlug?: string;
  currentCampaignSlug?: string;
}

export function Navbar({ currentOutletSlug, currentCampaignSlug }: NavbarProps) {
  const router = useRouter();
  const { itemCount, setIsCartOpen } = useCart();
  const { user, isCustomer, openCustomerLogin } = useAuth();

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
    <header className="sticky top-0 z-40 bg-[#FDFCFB]/95 backdrop-blur-md border-b border-stone-200/80 transition-all w-full overflow-hidden">
      {/* Top subtle announcement bar */}
      <div className="bg-[#1C1917] text-stone-300 text-[10px] sm:text-[11px] py-1 px-3 text-center tracking-wider uppercase font-medium truncate w-full">
        <span>Baking Excellence Since 2001 • Handcrafted in Nashik</span>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4 w-full">
        {/* Brand Logo from puffsnrolls.com */}
        <Link href="/" className="flex items-center shrink-0">
          <div className="relative h-8 w-24 sm:h-11 sm:w-36 transition-transform active:scale-95">
            <Image
              src="https://puffsnrolls.com/wp-content/uploads/2025/12/banner-logo.png"
              alt="Puffs 'n' Rolls"
              fill
              priority
              sizes="(max-width: 640px) 96px, 144px"
              className="object-contain object-left"
            />
          </div>
        </Link>

        {/* Compact Mobile-First Outlet Switcher */}
        <div className="flex items-center max-w-[110px] sm:max-w-xs shrink min-w-0">
          <div className="relative flex items-center bg-white border border-stone-200 rounded-full px-2 py-1 text-xs text-stone-700 hover:border-stone-400 transition shadow-xs w-full">
            <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-stone-600 mr-1 shrink-0" />
            <select
              value={currentOutletSlug || ''}
              onChange={handleOutletChange}
              className="appearance-none bg-transparent font-medium text-stone-800 text-[10px] sm:text-xs pr-3.5 focus:outline-none cursor-pointer truncate w-full"
            >
              <option value="">All Outlets</option>
              {OUTLETS.map((outlet) => (
                <option key={outlet.slug} value={outlet.slug}>
                  {outlet.name.replace("Puffs 'n' Rolls - ", '')}
                </option>
              ))}
            </select>
            <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-stone-400 absolute right-1.5 pointer-events-none shrink-0" />
          </div>
        </div>

        {/* Actions: Customer & Cart */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {user && isCustomer ? (
            <Link
              href="/account"
              aria-label="Account"
              className="flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-full text-stone-700 hover:text-stone-950 text-xs font-medium transition border border-stone-200 bg-white"
            >
              <User className="w-3.5 h-3.5 text-stone-700" />
              <span className="hidden sm:inline sm:ml-1">{user.name.split(' ')[0]}</span>
            </Link>
          ) : (
            <button
              onClick={openCustomerLogin}
              aria-label="Sign In"
              className="flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-full text-stone-600 hover:text-stone-950 text-xs font-medium transition"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline sm:ml-1">Sign In</span>
            </button>
          )}

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#1C1917] hover:bg-stone-800 active:scale-95 text-white font-medium text-xs flex items-center gap-1.5 transition shadow-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-stone-300" />
            <span className="hidden sm:inline tracking-wide">Bag</span>
            {itemCount > 0 && (
              <span className="bg-white text-stone-900 font-bold text-[10px] px-1.5 py-0.2 rounded-full min-w-[16px] text-center">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
