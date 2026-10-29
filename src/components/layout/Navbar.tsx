'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { OUTLETS } from '@/lib/data/mock-data';
import { Outlet } from '@/types';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import {
  ShoppingBag,
  MapPin,
  ChevronDown,
  User,
  Menu,
  X,
  Phone,
  Store,
  ChevronRight,
  ShieldCheck,
  UtensilsCrossed,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  currentOutletSlug?: string;
  currentCampaignSlug?: string;
}

export function Navbar({ currentOutletSlug, currentCampaignSlug }: NavbarProps) {
  const router = useRouter();
  const { itemCount, setIsCartOpen } = useCart();
  const { user, isCustomer, openCustomerLogin } = useAuth();
  const [outlets, setOutlets] = useState<Outlet[]>(OUTLETS);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetch('/api/outlets')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.outlets) {
          setOutlets(data.outlets);
        }
      })
      .catch(() => {});

    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.categories) {
          setCategories(data.categories);
        }
      })
      .catch(() => {});
  }, []);

  const handleOutletChange = (newSlug: string) => {
    setIsDrawerOpen(false);
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

  const currentOutlet = outlets.find((o) => o.slug === currentOutletSlug);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FDFCFB]/95 backdrop-blur-md border-b border-stone-200/80 transition-all w-full">
        {/* Top subtle announcement bar */}
        <div className="bg-[#1C1917] text-stone-300 text-[10px] sm:text-[11px] py-1 px-3 text-center tracking-wider uppercase font-medium truncate w-full">
          <span>Baking Excellence Since 2001 • Handcrafted in Nashik</span>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4 w-full">
          {/* Left: Mobile-Only Hamburger Toggle & Brand Logo */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Mobile-Only Hamburger Toggle (Hidden on Desktop) */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="md:hidden p-1.5 sm:p-2 -ml-1 rounded-xl text-stone-800 hover:bg-stone-100 transition active:scale-95 flex items-center justify-center cursor-pointer"
              aria-label="Open Mobile Menu"
            >
              <Menu className="w-5 h-5 stroke-[2.2]" />
            </button>

            {/* Brand Logo */}
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
          </div>

          {/* Center-Left: Luxury Outlet Switcher */}
          <div className="flex items-center max-w-[130px] sm:max-w-xs shrink min-w-0">
            <div className="relative flex items-center bg-white border border-stone-200 rounded-full px-2.5 py-1 text-xs text-stone-700 hover:border-stone-400 transition shadow-xs w-full">
              <MapPin className="w-3 h-3 text-stone-600 mr-1 shrink-0" />
              <select
                value={currentOutletSlug || ''}
                onChange={(e) => handleOutletChange(e.target.value)}
                className="appearance-none bg-transparent font-medium text-stone-800 text-[10px] sm:text-xs pr-4 focus:outline-none cursor-pointer truncate w-full"
              >
                <option value="">All Outlets</option>
                {outlets.map((outlet) => (
                  <option key={outlet.slug} value={outlet.slug}>
                    {outlet.name.replace("Puffs 'n' Rolls - ", '')}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-stone-400 absolute right-1.5 pointer-events-none shrink-0" />
            </div>
          </div>

          {/* Desktop Direct Navigation (Hidden on Mobile, Visible on Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-stone-600">
            <Link
              href="/"
              className="hover:text-stone-950 transition"
            >
              Our Outlets
            </Link>
            <Link
              href={currentOutletSlug ? `/${currentOutletSlug}` : '/college-road'}
              className="hover:text-stone-950 transition"
            >
              Fresh Menu
            </Link>
            <a
              href="tel:+919822011223"
              className="hover:text-stone-950 transition flex items-center gap-1 font-mono text-[11px]"
              title="Call Bakery Helpline"
            >
              <Phone className="w-3 h-3 text-amber-600" />
              <span>+91 98220 11223</span>
            </a>
          </nav>

          {/* Right: Customer & Cart Actions */}
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
                className="flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-full text-stone-600 hover:text-stone-950 text-xs font-medium transition cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline sm:ml-1">Sign In</span>
              </button>
            )}

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#1C1917] hover:bg-stone-800 active:scale-95 text-white font-medium text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
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

      {/* =========================================================================
          MOBILE-ONLY CUSTOMER SLIDE-OVER DRAWER
         ========================================================================= */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 max-w-full flex">
            <div className="w-[85vw] max-w-xs sm:max-w-sm bg-[#FAF8F5] shadow-2xl flex flex-col justify-between border-r border-stone-200 animate-in slide-in-from-left duration-250">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-stone-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#1C1917] text-white flex items-center justify-center font-serif font-bold text-xs shadow-xs">
                    P&amp;R
                  </div>
                  <div>
                    <span className="font-serif font-bold text-stone-900 text-sm block">
                      Puffs &apos;n&apos; Rolls
                    </span>
                    <span className="text-[10px] font-mono uppercase text-stone-400 block -mt-0.5">
                      Artisanal Bakery Nashik
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-800 rounded-full hover:bg-stone-100 transition cursor-pointer"
                  aria-label="Close Navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Nav Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-stone-800 text-xs">
                {/* Active Outlet Quick Card */}
                {currentOutlet && (
                  <div className="p-3 bg-white rounded-2xl border border-stone-200/90 shadow-2xs space-y-1">
                    <span className="text-[10px] uppercase font-mono text-stone-400 font-semibold block">
                      Current Outlet
                    </span>
                    <p className="font-serif font-bold text-stone-900 text-sm">
                      {currentOutlet.name}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      {currentOutlet.address}
                    </p>
                    <div className="pt-2 flex items-center justify-between text-[11px]">
                      <span className="text-emerald-700 font-medium">● Open Now</span>
                      <span className="text-stone-400 font-mono">
                        {currentOutlet.deliveryTimeEstimate}
                      </span>
                    </div>
                  </div>
                )}

                {/* Section 1: Nashik Bakery Outlets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Our Nashik Outlets
                    </p>
                    <Link
                      href="/"
                      onClick={() => setIsDrawerOpen(false)}
                      className="text-[10px] text-stone-600 hover:text-stone-900 font-semibold underline"
                    >
                      View All
                    </Link>
                  </div>

                  <div className="space-y-1">
                    {outlets.map((outlet) => {
                      const isCurrent = currentOutletSlug === outlet.slug;
                      return (
                        <button
                          key={outlet.slug}
                          onClick={() => handleOutletChange(outlet.slug)}
                          className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                            isCurrent
                              ? 'bg-stone-900 text-white border-stone-900 font-medium shadow-xs'
                              : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Store className={`w-3.5 h-3.5 ${isCurrent ? 'text-amber-400' : 'text-stone-400'}`} />
                            <span className="font-semibold">{outlet.name.replace("Puffs 'n' Rolls - ", '')}</span>
                          </div>
                          <ChevronRight className={`w-3.5 h-3.5 ${isCurrent ? 'text-stone-300' : 'text-stone-400'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Bakery Menu Categories */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Artisanal Categories
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(categories.length > 0
                      ? categories.map((c) => c.name)
                      : [
                          'Puffs & Patties',
                          'Savory Rolls',
                          'Cakes & Pastries',
                          'Snack Combos',
                          'Breads & Buns',
                          'Beverages',
                        ]
                    ).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setIsDrawerOpen(false);
                          const target = currentOutletSlug ? `/${currentOutletSlug}` : '/';
                          router.push(target);
                        }}
                        className="p-2 rounded-xl bg-white border border-stone-200/80 text-[11px] font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 transition text-left cursor-pointer truncate"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 3: Customer Shortcuts */}
                <div className="space-y-2 pt-2 border-t border-stone-200/80">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Your Account
                  </p>

                  <Link
                    href="/account"
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-center justify-between hover:bg-stone-50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-stone-600" />
                      <span className="font-medium">My Orders &amp; Addresses</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                  </Link>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-stone-200 bg-white space-y-2">
                <a
                  href="tel:+919822011223"
                  className="w-full py-2.5 px-3 bg-stone-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:bg-stone-800 transition"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Call Bakery Helpline</span>
                </a>
                <p className="text-[10px] text-stone-400 text-center">
                  Baking Fresh in Nashik Since 2001
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
