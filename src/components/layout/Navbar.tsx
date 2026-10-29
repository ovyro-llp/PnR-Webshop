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
    <header className="sticky top-0 z-40 bg-[#FDFCFB]/90 backdrop-blur-md border-b border-stone-200/70 transition-all">
      {/* Top subtle announcement bar */}
      <div className="bg-[#1C1917] text-stone-300 text-[11px] py-1.5 px-4 text-center tracking-widest uppercase font-medium">
        <span>Baking Excellence Since 2001 • Fresh Handcrafted Bakes Across Nashik</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo from puffsnrolls.com */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="relative h-12 w-36 sm:w-44 transition-transform group-hover:scale-[1.02]">
            <Image
              src="https://puffsnrolls.com/wp-content/uploads/2025/12/banner-logo.png"
              alt="Puffs 'n' Rolls"
              fill
              priority
              sizes="(max-width: 768px) 144px, 176px"
              className="object-contain object-left"
            />
          </div>
        </Link>

        {/* Minimalist Outlet Switcher */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center bg-white border border-stone-200/90 rounded-full px-3 py-1.5 text-xs text-stone-700 hover:border-stone-400 transition shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <MapPin className="w-3.5 h-3.5 text-stone-600 mr-1.5 shrink-0" />
            <select
              value={currentOutletSlug || ''}
              onChange={handleOutletChange}
              className="appearance-none bg-transparent font-medium text-stone-800 text-xs pr-6 focus:outline-none cursor-pointer tracking-wide"
            >
              <option value="">All Outlets (Nashik)</option>
              {OUTLETS.map((outlet) => (
                <option key={outlet.slug} value={outlet.slug}>
                  {outlet.name.replace("Puffs 'n' Rolls - ", '')}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Actions: Customer Account & Cart */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {user && isCustomer ? (
            <Link
              href="/account"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-stone-700 hover:text-stone-950 text-xs font-medium tracking-wide transition border border-stone-200 bg-white"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
            </Link>
          ) : (
            <button
              onClick={openCustomerLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-stone-600 hover:text-stone-950 text-xs font-medium tracking-wide transition"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Minimalist Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative px-4 py-2 rounded-full bg-[#1C1917] hover:bg-stone-800 text-white font-medium text-xs flex items-center gap-2 transition duration-200 shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-stone-300" />
            <span className="tracking-wide">Bag</span>
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
