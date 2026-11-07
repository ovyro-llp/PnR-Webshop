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
  Search,
  X,
  UtensilsCrossed,
  Cookie,
  Cake,
  Layers,
  Coffee,
  ArrowRight,
  Phone,
} from 'lucide-react';

export type DietaryFilterType = 'ALL' | 'VEG' | 'NON_VEG';

const getCategoryIcon = (category: string) => {
  const lower = category.toLowerCase();
  if (lower.includes('all')) return <Layers className="w-4 h-4" />;
  if (lower.includes('roll')) return <Flame className="w-4 h-4" />;
  if (lower.includes('puff') || lower.includes('pattie')) return <Cookie className="w-4 h-4" />;
  if (lower.includes('cake') || lower.includes('pastr')) return <Cake className="w-4 h-4" />;
  if (lower.includes('bread') || lower.includes('bun')) return <Package className="w-4 h-4" />;
  if (lower.includes('combo') || lower.includes('snack')) return <UtensilsCrossed className="w-4 h-4" />;
  if (lower.includes('bever') || lower.includes('tea') || lower.includes('coffee')) return <Coffee className="w-4 h-4" />;
  return <Sparkles className="w-4 h-4" />;
};

export default function HomePage() {
  const { nearestOutlet, distanceKm, openLocationModal, deliveryAddress } = useLocation();
  const [items, setItems] = useState<MenuItem[]>(() =>
    MENU_ITEMS.filter((i) => i.availableOutlets.includes(nearestOutlet.slug))
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dietaryFilter, setDietaryFilter] = useState<DietaryFilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
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

  // Listen to drawer category selection events (no redirects!)
  useEffect(() => {
    const handleCategorySelect = (e: Event) => {
      const customEvent = e as CustomEvent<{ category: string }>;
      if (customEvent.detail?.category) {
        setSelectedCategory(customEvent.detail.category);
        document.getElementById('bakery-catalog')?.scrollIntoView({ behavior: 'smooth' });
      }
    };
    window.addEventListener('pnr-select-category', handleCategorySelect);
    return () => {
      window.removeEventListener('pnr-select-category', handleCategorySelect);
    };
  }, []);

  // Distinct categories list
  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(items.map((i) => i.category)))];
  }, [items]);

  // Real-time filter: category + dietary choice + search query
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      // 1. Dietary filter
      if (dietaryFilter === 'VEG' && !item.isVeg) return false;
      if (dietaryFilter === 'NON_VEG' && item.isVeg) return false;

      // 2. Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }

      // 3. Search query filter (matches name, description, category, subcategory)
      if (query) {
        const matchName = item.name.toLowerCase().includes(query);
        const matchDesc = item.description?.toLowerCase().includes(query) || false;
        const matchCat = item.category.toLowerCase().includes(query);
        const matchSubCat = item.subCategory?.toLowerCase().includes(query) || false;
        if (!matchName && !matchDesc && !matchCat && !matchSubCat) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedCategory, dietaryFilter, searchQuery]);

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
            (No giant outlet info wall; delicious signature products featured immediately!)
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
                <a
                  href="#bakery-catalog"
                  className="text-xs font-bold text-stone-700 hover:text-stone-950 flex items-center gap-1"
                >
                  <span>Browse Full Menu</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
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
            LIVE COUNTER CATALOG SECTION (LEFT NAVIGATION + SEARCH + PRODUCTS)
           ========================================================================= */}
        <section id="bakery-catalog" className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 flex-1 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-2 border-b border-stone-200/80">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-400 block">
                Artisanal Counter Menu
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-stone-900 mt-0.5">
                Baking Fresh at {nearestOutlet.area}
              </h2>
            </div>
            <p className="text-xs text-stone-500 font-medium">
              Handcrafted daily in small batches • Dispatched in 25 mins
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
            {/* =====================================================================
                STICKY LEFT-SIDE NAVIGATION & CATEGORIZATION SIDEBAR
               ===================================================================== */}
            <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-20 space-y-4 bg-[#FAF8F5]/90 p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs">
              {/* Left Search Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-stone-700" />
                    <span>Find Product</span>
                  </label>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-[10px] text-stone-500 hover:text-stone-800 font-semibold cursor-pointer underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search rolls, puffs, cakes..."
                    className="w-full pl-9 pr-8 py-2 bg-white border border-stone-300 rounded-xl text-xs placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-700 p-0.5 rounded-full cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Left Dietary Filter */}
              <div className="space-y-1.5 pt-2 border-t border-stone-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                  Dietary Choice
                </span>
                <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-2xl border border-stone-200/80">
                  <button
                    type="button"
                    onClick={() => setDietaryFilter('ALL')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition text-center cursor-pointer ${
                      dietaryFilter === 'ALL'
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setDietaryFilter('VEG')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition text-center cursor-pointer ${
                      dietaryFilter === 'VEG'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-700 hover:text-emerald-950 bg-emerald-50/50'
                    }`}
                  >
                    Veg
                  </button>
                  <button
                    type="button"
                    onClick={() => setDietaryFilter('NON_VEG')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition text-center cursor-pointer ${
                      dietaryFilter === 'NON_VEG'
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'text-rose-700 hover:text-rose-950 bg-rose-50/50'
                    }`}
                  >
                    Non-Veg
                  </button>
                </div>
              </div>

              {/* Left Vertical Categories Navigation List */}
              <div className="space-y-1.5 pt-2 border-t border-stone-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                  Bakery Categories
                </span>
                <nav className="space-y-1 max-h-[50vh] overflow-y-auto pr-1">
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    const count =
                      cat === 'All'
                        ? items.filter((i) => {
                            if (dietaryFilter === 'VEG' && !i.isVeg) return false;
                            if (dietaryFilter === 'NON_VEG' && i.isVeg) return false;
                            return true;
                          }).length
                        : items.filter((i) => {
                            if (dietaryFilter === 'VEG' && !i.isVeg) return false;
                            if (dietaryFilter === 'NON_VEG' && i.isVeg) return false;
                            return i.category === cat;
                          }).length;

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat);
                          document.getElementById('bakery-catalog')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`w-full px-3 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between transition cursor-pointer group ${
                          isSelected
                            ? 'bg-stone-900 text-white shadow-sm'
                            : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/80 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={isSelected ? 'text-amber-400' : 'text-amber-700'}>
                            {getCategoryIcon(cat)}
                          </span>
                          <span className="truncate">{cat === 'All' ? 'All Counter Bakes' : cat}</span>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
                            isSelected
                              ? 'bg-white/20 text-white font-bold'
                              : 'bg-stone-100 text-stone-600 group-hover:bg-stone-200'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Direct Kitchen Hotline Box */}
              <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 space-y-1 text-xs">
                <span className="text-[10px] uppercase font-bold text-amber-900 block flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-amber-800" />
                  <span>Direct Kitchen Hotline</span>
                </span>
                <a
                  href={`tel:${nearestOutlet.phone}`}
                  className="font-mono text-xs font-bold text-stone-900 hover:text-amber-900 flex items-center gap-1"
                >
                  <span>{nearestOutlet.phone}</span>
                </a>
                <p className="text-[10px] text-stone-500">
                  {nearestOutlet.name.replace("Puffs 'n' Rolls - ", '')} • {nearestOutlet.openingHours}
                </p>
              </div>
            </aside>

            {/* =====================================================================
                RIGHT PRODUCT CATALOG AREA
               ===================================================================== */}
            <div className="flex-1 min-w-0 space-y-4 w-full">
              {/* Mobile-Only Search & Quick Filter Pills */}
              <div className="lg:hidden space-y-2.5">
                {/* Mobile Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search rolls, puffs, cakes..."
                    className="w-full pl-9 pr-8 py-2.5 bg-white border border-stone-200 rounded-xl text-xs placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 p-0.5 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Mobile Horizontal Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                        selectedCategory === cat
                          ? 'bg-[#1C1917] text-white shadow-xs'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      <span>{cat === 'All' ? 'All' : cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status & Active Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-stone-900 text-base sm:text-lg">
                    {selectedCategory === 'All' ? 'All Counter Bakes' : selectedCategory}
                  </h3>
                  <span className="text-[11px] font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                    {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {searchQuery && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-stone-500">
                      Matching &ldquo;<strong className="text-stone-800">{searchQuery}</strong>&rdquo;
                    </span>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer text-[11px]"
                    >
                      Clear Search
                    </button>
                  </div>
                )}
              </div>

              {/* Product Cards Grid */}
              {filteredItems.length === 0 ? (
                <div className="p-10 text-center bg-stone-50 rounded-3xl border border-stone-200 space-y-3">
                  <Package className="w-10 h-10 text-stone-400 mx-auto" />
                  <p className="font-serif font-bold text-stone-800 text-base">No items matching this selection</p>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    We couldn&apos;t find any baked items matching your search or filters. Try clearing your search query or resetting filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                      setDietaryFilter('ALL');
                    }}
                    className="mt-2 px-5 py-2 bg-stone-900 text-white text-xs font-bold rounded-full hover:bg-stone-800 transition cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredItems.map((item) => (
                    <MenuItemCard key={item.id} item={item} outletSlug={nearestOutlet.slug} />
                  ))}
                </div>
              )}
            </div>
          </div>
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
