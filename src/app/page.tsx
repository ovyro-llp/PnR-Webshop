'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocation } from '@/context/LocationContext';
import { Navbar } from '@/components/layout/Navbar';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { MobileCartBar } from '@/components/cart/MobileCartBar';
import { TrackingProvider } from '@/components/tracking/TrackingProvider';
import { Footer } from '@/components/layout/Footer';
import { MenuItem } from '@/types';
import { MENU_ITEMS } from '@/lib/data/mock-data';
import {
  Sparkles,
  Navigation,
  Flame,
  Package,
  Store,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export type DietaryFilterType = 'ALL' | 'VEG' | 'NON_VEG';

export default function HomePage() {
  const { nearestOutlet, distanceKm, openLocationModal, deliveryAddress } = useLocation();
  const [items, setItems] = useState<MenuItem[]>(() =>
    MENU_ITEMS.filter((i) => i.availableOutlets.includes(nearestOutlet.slug))
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dietaryFilter, setDietaryFilter] = useState<DietaryFilterType>('ALL');
  const [loading, setLoading] = useState(false);

  // Fetch updated catalog for this specific nearest outlet
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/products?outlet=${nearestOutlet.slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success && Array.isArray(data.products)) {
          setItems(data.products);
        }
      })
      .catch(() => {
        if (active) {
          setItems(
            MENU_ITEMS.filter((i) => i.availableOutlets.includes(nearestOutlet.slug))
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [nearestOutlet.slug]);

  // Categories list
  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(items.map((i) => i.category)))];
  }, [items]);

  // Filter items by category & dietary choice
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      if (dietaryFilter === 'VEG' && !item.isVeg) {
        return false;
      }
      if (dietaryFilter === 'NON_VEG' && item.isVeg) {
        return false;
      }
      return true;
    });
  }, [items, selectedCategory, dietaryFilter]);

  // Hero Bestsellers / Signature Products directly in Hero Section
  const signatureItems = useMemo(() => {
    const list = items.filter((i) => {
      if (dietaryFilter === 'VEG' && !i.isVeg) return false;
      if (dietaryFilter === 'NON_VEG' && i.isVeg) return false;
      return i.isBestseller;
    });
    // If not enough bestsellers for filter, fallback to any matching filtered items
    if (list.length < 4) {
      const remaining = items.filter((i) => {
        if (dietaryFilter === 'VEG' && !i.isVeg) return false;
        if (dietaryFilter === 'NON_VEG' && i.isVeg) return false;
        return !list.find((b) => b.id === i.id);
      });
      return [...list, ...remaining].slice(0, 4);
    }
    return list.slice(0, 4);
  }, [items, dietaryFilter]);

  const vegCount = useMemo(() => items.filter((i) => i.isVeg).length, [items]);
  const nonVegCount = useMemo(() => items.filter((i) => !i.isVeg).length, [items]);

  return (
    <TrackingProvider
      pixelId={nearestOutlet.defaultMetaPixelId || '999888777666555'}
      googleAdsId={nearestOutlet.defaultGoogleAdsId || 'AW-987654300'}
      outletSlug={nearestOutlet.slug}
    >
      <div className="min-h-screen flex flex-col bg-[#FDFCFB] overflow-x-hidden w-full">
        <Navbar currentOutletSlug={nearestOutlet.slug} />

        {/* =========================================================================
            HERO SECTION: PRODUCT-FIRST ARTISANAL SHOWCASE
            (No giant outlet info wall; delicious products featured immediately!)
           ========================================================================= */}
        <section className="relative border-b border-stone-200/80 pt-4 pb-8 sm:py-10 overflow-hidden w-full bg-gradient-to-b from-[#FAF8F5] via-white to-[#FDFCFB]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
            
            {/* Top Compact Outlet & Delivery Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-stone-200/90 rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                <p className="text-xs text-stone-800 truncate">
                  Dispatched fresh from <strong className="font-semibold text-stone-900">{nearestOutlet.name}</strong> ({nearestOutlet.area})
                </p>
                {distanceKm && (
                  <span className="text-[10px] font-mono text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200 shrink-0 hidden sm:inline">
                    {distanceKm} km
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openLocationModal}
                  className="text-xs font-bold text-amber-800 hover:text-amber-950 underline underline-offset-2 flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Navigation className="w-3.5 h-3.5 text-amber-700" />
                  <span>Choose Outlet / Location</span>
                </button>
              </div>
            </div>

            {/* Hero Main Headline & Dietary Filter Row */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-widest uppercase bg-amber-50 text-amber-900 border border-amber-200/80">
                  <Sparkles className="w-3 h-3 text-amber-700" />
                  <span>Nashik&apos;s Iconic Bakery • Since 2001</span>
                </div>
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 tracking-tight leading-tight">
                  Warm Savory Rolls, Artisanal Puffs &amp; Gourmet Cakes
                </h1>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Baked with 100% pure butter and slow fermentation. Handcrafted every morning and delivered hot in 25 minutes.
                </p>
              </div>

              {/* 3-Way Dietary Filter Toggle: All (Both) | Veg Only | Non-Veg Only */}
              <div className="shrink-0 flex items-center">
                <div className="flex items-center p-1 bg-white border border-stone-200/90 rounded-2xl shadow-2xs">
                  {/* All (Both) */}
                  <button
                    type="button"
                    onClick={() => setDietaryFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      dietaryFilter === 'ALL'
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                    <span>All Items</span>
                  </button>

                  {/* Veg Only */}
                  <button
                    type="button"
                    onClick={() => setDietaryFilter('VEG')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      dietaryFilter === 'VEG'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-800 hover:text-emerald-950 bg-emerald-50/50'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${dietaryFilter === 'VEG' ? 'bg-white' : 'bg-emerald-600'}`} />
                    <span>Veg Only ({vegCount})</span>
                  </button>

                  {/* Non-Veg Only */}
                  <button
                    type="button"
                    onClick={() => setDietaryFilter('NON_VEG')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      dietaryFilter === 'NON_VEG'
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'text-rose-800 hover:text-rose-950 bg-rose-50/50'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${dietaryFilter === 'NON_VEG' ? 'bg-white' : 'bg-rose-700'}`} />
                    <span>Non-Veg ({nonVegCount})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* =====================================================================
                PRODUCTS DIRECTLY IN HERO SECTION: SIGNATURE BESTSELLERS
               ===================================================================== */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900">
                    Fresh Out Of The Oven • Signature Bestsellers
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-stone-500">
                  ⚡ Dispatched in 25 mins
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {signatureItems.map((item) => (
                  <MenuItemCard key={`hero-${item.id}`} item={item} outletSlug={nearestOutlet.slug} />
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
            LIVE COUNTER CATALOG SECTION
           ========================================================================= */}
        <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 flex-1 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-400 block">
                Fresh Counter Menu
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-stone-900 mt-0.5">
                Baking at {nearestOutlet.area}
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                Small batch bakes prepared daily. Fast 25-minute delivery across your neighborhood.
              </p>
            </div>

            {/* Category Pills Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {categories.map((cat) => {
                const count = cat === 'All'
                  ? filteredItems.length
                  : items.filter((i) => {
                      if (dietaryFilter === 'VEG' && !i.isVeg) return false;
                      if (dietaryFilter === 'NON_VEG' && i.isVeg) return false;
                      return i.category === cat;
                    }).length;

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                      selectedCategory === cat
                        ? 'bg-[#1C1917] text-white shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        selectedCategory === cat
                          ? 'bg-white/20 text-white'
                          : 'bg-stone-200/80 text-stone-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
              <Package className="w-8 h-8 text-stone-400 mx-auto" />
              <p className="font-serif font-bold text-stone-800 text-sm">No items matching this selection</p>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                No products found for the selected category and dietary preference.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setDietaryFilter('ALL');
                }}
                className="mt-2 px-4 py-1.5 bg-stone-900 text-white text-xs font-bold rounded-full"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredItems.map((item) => (
                <MenuItemCard key={item.id} item={item} outletSlug={nearestOutlet.slug} />
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <Footer />

        {/* Mobile Sticky Cart Bar & Cart Drawer */}
        <MobileCartBar />
        <CartDrawer outletSlug={nearestOutlet.slug} />
      </div>
    </TrackingProvider>
  );
}
