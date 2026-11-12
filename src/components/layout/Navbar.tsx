'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { Outlet } from '@/types';
import { OUTLETS } from '@/lib/data/mock-data';
import {
  ShoppingBag,
  MapPin,
  ChevronDown,
  User,
  Menu,
  X,
  Phone,
  Store,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Compass,
  Navigation,
} from 'lucide-react';

interface NavbarProps {
  currentOutletSlug?: string;
  currentCampaignSlug?: string;
}

export function Navbar({ currentOutletSlug, currentCampaignSlug }: NavbarProps) {
  const router = useRouter();
  const { itemCount, setIsCartOpen, setCartOutletSlug } = useCart();
  const { user, isCustomer, openCustomerLogin } = useAuth();
  const {
    nearestOutlet,
    allOutlets,
    switchOutlet,
    openLocationModal,
    distanceKm,
    deliveryAddress,
    deliveryArea,
    deliveryCoordinates,
  } = useLocation();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.categories) {
          setCategories(data.categories);
        }
      })
      .catch(() => {});
  }, []);

  // Lock body scroll and prevent background wobble when mobile drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      const prevOverflow = document.body.style.overflow;
      const prevTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.touchAction = prevTouchAction;
      };
    }
  }, [isDrawerOpen]);

  // Authoritative outlet for this customer is their nearest bakery (dynamic hotline)
  const effectiveOutlet =
    nearestOutlet ||
    (currentOutletSlug && OUTLETS.find((o) => o.slug === currentOutletSlug)) ||
    OUTLETS[0];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FDFCFB]/95 backdrop-blur-md border-b border-stone-200/80 transition-all w-full">
        {/* Top subtle announcement bar */}
        <div className="bg-[#1C1917] text-stone-300 text-[10px] sm:text-[11px] py-1 px-3 text-center tracking-wider uppercase font-medium truncate w-full flex items-center justify-center gap-2">
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

          {/* Center-Left: Nearest Bakery Indicator (No other outlets exposed) */}
          <div className="flex items-center max-w-[170px] sm:max-w-xs shrink min-w-0">
            <button
              type="button"
              onClick={openLocationModal}
              className="relative flex items-center bg-white border border-stone-200/90 hover:border-stone-400 rounded-full px-2.5 sm:px-3 py-1 text-xs text-stone-700 transition shadow-xs cursor-pointer group truncate"
              title="Your assigned nearest bakery based on location. Click to update location."
            >
              <MapPin className="w-3.5 h-3.5 text-amber-700 mr-1.5 shrink-0 group-hover:scale-110 transition-transform" />
              <div className="truncate text-left">
                <span className="font-semibold text-[10px] sm:text-xs text-stone-900 block truncate">
                  {deliveryAddress ? deliveryAddress.split(',')[0] : effectiveOutlet.name.replace("Puffs 'n' Rolls - ", '')}
                </span>
                <span className="text-[9px] text-stone-500 font-mono hidden sm:block truncate">
                  {effectiveOutlet.name.replace("Puffs 'n' Rolls - ", '')} {distanceKm ? `• ${distanceKm} km` : '• Fresh Oven'}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-stone-400 ml-1.5 shrink-0" />
            </button>
          </div>

          {/* Desktop Direct Navigation (Hidden on Mobile, Visible on Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-stone-600">
            <a
              href="#bakery-catalog"
              onClick={(e) => {
                if (typeof window !== 'undefined' && window.location.pathname === '/') {
                  e.preventDefault();
                  document.getElementById('bakery-catalog')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="hover:text-stone-950 transition font-semibold cursor-pointer"
            >
              Bakery Menu
            </a>
            <button
              type="button"
              onClick={openLocationModal}
              className="hover:text-stone-950 transition flex items-center gap-1 cursor-pointer"
            >
              <Navigation className="w-3 h-3 text-amber-700" />
              <span>Change Location</span>
            </button>
            <a
              href={`tel:${effectiveOutlet.phone}`}
              className="hover:text-stone-950 transition flex items-center gap-1 font-mono text-[11px]"
              title="Call Bakery Kitchen"
            >
              <Phone className="w-3 h-3 text-amber-700" />
              <span>{effectiveOutlet.phone}</span>
            </a>
          </nav>

          {/* Right: Customer & Cart Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {user && isCustomer ? (
              <Link
                href="/account"
                aria-label="My Account"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-stone-800 hover:text-stone-950 text-xs font-semibold transition border border-stone-200 bg-white hover:bg-stone-50 shadow-2xs"
              >
                <div className="w-4 h-4 rounded-full bg-[#1C1917] text-white flex items-center justify-center text-[9px] font-bold">
                  {user.name.charAt(0)}
                </div>
                <span className="truncate max-w-[65px] sm:max-w-none">{user.name.split(' ')[0]}</span>
              </Link>
            ) : (
              <button
                onClick={openCustomerLogin}
                aria-label="Customer Sign In"
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-stone-800 hover:text-stone-950 text-xs font-semibold transition cursor-pointer border border-stone-200 bg-white hover:bg-stone-50 shadow-2xs active:scale-95"
              >
                <User className="w-3.5 h-3.5 text-amber-700" />
                <span>Sign In</span>
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
        <div className="md:hidden fixed inset-0 z-50 overflow-hidden touch-none">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in touch-none overscroll-contain"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 max-w-full flex">
            <div className="w-[85vw] max-w-xs sm:max-w-sm bg-[#FAF8F5] shadow-2xl flex flex-col justify-between border-r border-stone-200 animate-in slide-in-from-left duration-250 overscroll-contain touch-pan-y">
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
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-stone-800 text-xs overscroll-contain touch-pan-y">
                {/* 0. CUSTOMER ACCOUNT & SIGN IN BANNER */}
                <div className="p-3 bg-stone-900 text-white rounded-2xl shadow-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-xs shrink-0">
                      {user && isCustomer ? user.name.charAt(0) : <User className="w-4 h-4 text-stone-900" />}
                    </div>
                    <div className="min-w-0">
                      {user && isCustomer ? (
                        <>
                          <span className="font-bold text-xs block text-white truncate">{user.name}</span>
                          <span className="text-[10px] text-stone-400 font-mono block">+91 {(user as any).phone || 'Customer'}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-xs block text-white">Customer Account</span>
                          <span className="text-[10px] text-stone-400 block">Sign in to track orders</span>
                        </>
                      )}
                    </div>
                  </div>

                  {user && isCustomer ? (
                    <Link
                      href="/account"
                      onClick={() => setIsDrawerOpen(false)}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[11px] font-semibold transition shrink-0"
                    >
                      Orders
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDrawerOpen(false);
                        openCustomerLogin();
                      }}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-[11px] font-bold shadow-xs transition shrink-0 cursor-pointer"
                    >
                      Sign In
                    </button>
                  )}
                </div>

                {/* 1. TOP CARD: Customer's Delivery Location (Address + Update Location link) */}
                <div className="p-3.5 bg-white rounded-2xl border border-stone-200/90 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono text-amber-800 font-bold tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-700" />
                      Your Delivery Location
                    </span>
                    {deliveryCoordinates ? (
                      <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                        GPS Locked
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                        Nashik
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900 text-xs leading-snug line-clamp-2">
                      {deliveryAddress || 'Nashik Doorstep Location'}
                    </p>
                    {deliveryArea && (
                      <p className="text-[10px] text-stone-500 mt-0.5 truncate">
                        {deliveryArea}
                      </p>
                    )}
                  </div>
                  <div className="pt-2 flex items-center justify-between text-[11px] border-t border-stone-100">
                    <span className="text-stone-400 text-[10px]">
                      Doorstep GPS verified
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDrawerOpen(false);
                        openLocationModal();
                      }}
                      className="text-amber-800 hover:text-amber-950 font-bold text-xs underline underline-offset-2 cursor-pointer flex items-center gap-1"
                    >
                      <Navigation className="w-3 h-3 text-amber-700" />
                      <span>Update Location</span>
                    </button>
                  </div>
                </div>

                {/* 2. BELOW CARD: Fulfilling Bakery Kitchen with customizable outlet choice */}
                <div className="p-3.5 bg-stone-50/90 rounded-2xl border border-stone-200/90 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono text-stone-600 font-bold tracking-wider flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-stone-700" />
                      Fulfilling Bakery Kitchen
                    </span>
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      ● Baking Fresh
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-serif font-bold text-stone-900 text-sm">
                        {effectiveOutlet.name}
                      </p>
                      {distanceKm && (
                        <span className="text-[10px] font-mono text-stone-600 bg-white px-2 py-0.5 rounded-md border border-stone-200">
                          {distanceKm} km
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2">
                      {effectiveOutlet.address}
                    </p>
                  </div>

                  {/* Switch outlet dropdown for customer choice */}
                  <div className="pt-2 border-t border-stone-200/80 space-y-1">
                    <label className="block text-[9px] uppercase font-bold text-stone-500 tracking-wider">
                      Switch Fulfilling Kitchen:
                    </label>
                    <select
                      value={effectiveOutlet.slug}
                      onChange={(e) => {
                        const newSlug = e.target.value;
                        switchOutlet(newSlug);
                        setCartOutletSlug(newSlug);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none cursor-pointer"
                    >
                      {allOutlets.map((outlet) => (
                        <option key={outlet.slug} value={outlet.slug}>
                          {outlet.name} — {outlet.area}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Section: Quick Links */}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      if (typeof window !== 'undefined') {
                        if (window.location.pathname === '/') {
                          document.getElementById('bakery-catalog')?.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          router.push('/#bakery-catalog');
                        }
                      }
                    }}
                    className="w-full p-2.5 rounded-xl bg-stone-900 text-white font-medium flex items-center justify-between shadow-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-amber-400" />
                      <span>Order from {effectiveOutlet.name.replace("Puffs 'n' Rolls - ", '')}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                  </button>

                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      openLocationModal();
                    }}
                    className="w-full p-2.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 font-medium flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Navigation className="w-3.5 h-3.5 text-amber-700" />
                      <span>Detect Nearest Bakery</span>
                    </div>
                    <span className="text-[10px] text-stone-400 font-mono">GPS</span>
                  </button>
                </div>

                {/* Section: Bakery Menu Categories */}
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
                          if (typeof window !== 'undefined') {
                            window.dispatchEvent(
                              new CustomEvent('pnr-select-category', { detail: { category: cat } })
                            );
                            if (window.location.pathname === '/') {
                              document.getElementById('bakery-catalog')?.scrollIntoView({ behavior: 'smooth' });
                            } else {
                              router.push('/#bakery-catalog');
                            }
                          }
                        }}
                        className="p-2 rounded-xl bg-white border border-stone-200/80 text-[11px] font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 transition text-left cursor-pointer truncate"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section: Direct Bakery Hotline */}
                <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/70 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-amber-900 font-bold block">
                    Direct Kitchen Hotline
                  </span>
                  <a
                    href={`tel:${effectiveOutlet.phone}`}
                    className="font-mono text-xs font-bold text-stone-900 flex items-center gap-1.5 hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5 text-amber-800" />
                    <span>{effectiveOutlet.phone}</span>
                  </a>
                  <p className="text-[10px] text-stone-500">
                    Live from {effectiveOutlet.openingHours}
                  </p>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-stone-200 bg-white space-y-2">
                {user && isCustomer ? (
                  <Link
                    href="/account"
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-full py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>My Account ({user.name.split(' ')[0]})</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      openCustomerLogin();
                    }}
                    className="w-full py-2.5 px-3 bg-[#1C1917] hover:bg-stone-800 text-white rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Customer Sign In</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
