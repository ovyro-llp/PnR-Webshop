'use client';

import React, { useState, useEffect } from 'react';
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
  MapPin,
  Sparkles,
  Phone,
  Compass,
  Package,
  Navigation,
  Clock,
  ShieldCheck,
  ChevronRight,
  Flame,
} from 'lucide-react';

export default function HomePage() {
  const { nearestOutlet, distanceKm, openLocationModal, isDetecting } = useLocation();
  const [items, setItems] = useState<MenuItem[]>(() =>
    MENU_ITEMS.filter((i) => i.availableOutlets.includes(nearestOutlet.slug))
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
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
        // Fallback to local data
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
  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category)))];

  const filteredItems =
    selectedCategory === 'All'
      ? items
      : items.filter((i) => i.category === selectedCategory);

  const bestsellers = items.filter((i) => i.isBestseller);

  return (
    <TrackingProvider
      pixelId={nearestOutlet.defaultMetaPixelId || '999888777666555'}
      googleAdsId={nearestOutlet.defaultGoogleAdsId || 'AW-987654300'}
      outletSlug={nearestOutlet.slug}
    >
      <div className="min-h-screen flex flex-col bg-[#FDFCFB] overflow-x-hidden w-full">
        <Navbar currentOutletSlug={nearestOutlet.slug} />

        {/* Minimalist Mobile-First Hero Section */}
        <section className="relative border-b border-stone-200/80 py-8 sm:py-16 overflow-hidden w-full bg-gradient-to-b from-[#FAF8F5] to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase bg-stone-100 text-stone-700 border border-stone-200">
                <Sparkles className="w-3 h-3 text-amber-700" />
                <span>Baking Excellence In Nashik Since 2001</span>
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-stone-900 tracking-tight leading-snug sm:leading-tight">
                Artisanal Bakes, Warm Savory Rolls &amp; Celebration Cakes.
              </h1>
              <p className="text-xs sm:text-base text-stone-600 max-w-2xl leading-relaxed">
                Handcrafted daily at your local bakery in {nearestOutlet.area} using pure butter, slow fermentation, and authentic recipes. Delivered fresh to your doorstep in 25 minutes.
              </p>
            </div>

            {/* Exclusive Nearest Bakery Card (No other outlets visible to the customer) */}
            <div className="max-w-3xl bg-white border border-stone-200/90 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-amber-800 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-700" />
                    Your Nearest Bakery Kitchen
                  </span>
                  <h3 className="font-serif font-bold text-lg sm:text-2xl text-stone-900 mt-0.5">
                    {nearestOutlet.name}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${
                      nearestOutlet.isOpen
                        ? 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                        : 'text-rose-800 bg-rose-50 border border-rose-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        nearestOutlet.isOpen ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'
                      }`}
                    />
                    {nearestOutlet.isOpen ? 'Baking Fresh Today' : 'Scheduled Pause'}
                  </span>
                  {distanceKm && (
                    <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200 font-semibold">
                      {distanceKm} km away
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                {nearestOutlet.tagline}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-600 pt-1">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{nearestOutlet.address}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <Clock className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>Open {nearestOutlet.openingHours}</span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs text-stone-500">
                  <a
                    href={`tel:${nearestOutlet.phone}`}
                    className="flex items-center gap-1 font-mono font-medium hover:text-stone-950"
                  >
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{nearestOutlet.phone}</span>
                  </a>
                  {nearestOutlet.googleMapsUrl && (
                    <a
                      href={nearestOutlet.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-stone-800 hover:text-amber-800 font-medium transition"
                    >
                      <Compass className="w-3.5 h-3.5 text-amber-700" />
                      <span>Directions</span>
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={openLocationModal}
                  className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-800 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5 text-amber-700" />
                  <span>Change Location</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Bestselling Showcase */}
        {bestsellers.length > 0 && selectedCategory === 'All' && (
          <section className="pt-8 sm:pt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 w-full">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-600" />
              <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900">
                Today&apos;s Bakery Bestsellers
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {bestsellers.slice(0, 4).map((item) => (
                <MenuItemCard key={`best-${item.id}`} item={item} outletSlug={nearestOutlet.slug} />
              ))}
            </div>
          </section>
        )}

        {/* Live Counter Catalog */}
        <section className="py-8 sm:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 flex-1 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-400 block">
                Fresh Counter Menu
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-stone-900 mt-0.5">
                Baking at {nearestOutlet.area}
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                Prepared in small batches every morning. Fast 25-minute delivery across your neighborhood.
              </p>
            </div>

            {/* Category Pills Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#1C1917] text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
              <Package className="w-8 h-8 text-stone-400 mx-auto" />
              <p className="font-serif font-bold text-stone-800 text-sm">Fresh Batch Baking Now</p>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Our artisanal bakers are currently preparing the next fresh batch for {nearestOutlet.name}.
              </p>
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
