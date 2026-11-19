'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MenuItem } from '@/types';
import { MenuItemCard } from './MenuItemCard';
import { Package, Sparkles, Copy, Check } from 'lucide-react';
import { DietarySymbol, GlutenFreeSymbol } from '@/components/ui/DietarySymbol';
import { slugify } from '@/lib/utils/slugify';

interface MenuCatalogSectionProps {
  items: MenuItem[];
  outletSlug: string;
  title?: string;
  subtitle?: string;
}

export type DietaryFilterType = 'ALL' | 'VEG' | 'NON_VEG' | 'GLUTEN_FREE';

export function MenuCatalogSection({
  items,
  outletSlug,
  title = 'Fresh Counter Menu',
  subtitle = 'Baked in small batches throughout the day. Express delivery across Nashik.',
}: MenuCatalogSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dietaryFilter, setDietaryFilter] = useState<DietaryFilterType>('ALL');

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(items.map((i) => i.category)))];
  }, [items]);

  // Sync category in URL query params without reloading the page
  const updateCategoryInUrl = (cat: string) => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      if (cat && cat !== 'All') {
        url.searchParams.set('category', cat);
      } else {
        url.searchParams.delete('category');
      }
      window.history.replaceState(null, '', url.pathname + (url.search ? url.search : '') + url.hash);
    } catch {}
  };

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    updateCategoryInUrl(cat);
  };

  // On mount, read ?category= from URL query params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get('category');
      if (catParam) {
        const normalizedTarget = catParam.toLowerCase().trim();
        const matched = categories.find(
          (c) =>
            c.toLowerCase() === normalizedTarget ||
            slugify(c) === slugify(normalizedTarget)
        );
        if (matched) {
          setSelectedCategory(matched);

          // Track Meta Pixel ViewContent for category landing
          if ((window as any).fbq) {
            try {
              (window as any).fbq('track', 'ViewContent', {
                content_name: matched,
                content_category: matched,
              });
            } catch {}
          }
        }
      }
    } catch {}
  }, [categories]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Category Filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      // 2. Dietary Filter
      if (dietaryFilter === 'VEG' && !item.isVeg) {
        return false;
      }
      if (dietaryFilter === 'NON_VEG' && item.isVeg) {
        return false;
      }
      if (dietaryFilter === 'GLUTEN_FREE' && !item.isGlutenFree) {
        return false;
      }
      return true;
    });
  }, [items, selectedCategory, dietaryFilter]);

  const vegCount = useMemo(() => items.filter((i) => i.isVeg).length, [items]);
  const nonVegCount = useMemo(() => items.filter((i) => !i.isVeg).length, [items]);
  const glutenFreeCount = useMemo(() => items.filter((i) => i.isGlutenFree).length, [items]);

  return (
    <section className="space-y-6 w-full">
      {/* Header and Filter Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-stone-200/70">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-400 block">
            Counter Selection
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mt-0.5">
            {title}
          </h2>
          <p className="text-xs text-stone-500 mt-0.5 max-w-xl">
            {subtitle}
          </p>
        </div>

        {/* Dietary Multi-Option Filter Controls */}
        <div className="shrink-0 flex items-center gap-2">
          <div className="inline-flex items-center p-1 bg-white border border-stone-200/90 rounded-2xl shadow-2xs">
            {/* All / Both */}
            <button
              type="button"
              onClick={() => setDietaryFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                dietaryFilter === 'ALL'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
              <span>All ({items.length})</span>
            </button>

            {/* Veg Only */}
            <button
              type="button"
              onClick={() => setDietaryFilter('VEG')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                dietaryFilter === 'VEG'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-emerald-800 hover:text-emerald-950 bg-emerald-50/50'
              }`}
            >
              <DietarySymbol isVeg={true} size="xs" />
              <span>Veg ({vegCount})</span>
            </button>

            {/* Non-Veg Only */}
            <button
              type="button"
              onClick={() => setDietaryFilter('NON_VEG')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                dietaryFilter === 'NON_VEG'
                  ? 'bg-[#7d4a2f] text-white shadow-xs'
                  : 'text-[#7d4a2f] hover:text-amber-950 bg-amber-50/50'
              }`}
            >
              <DietarySymbol isVeg={false} size="xs" />
              <span>Non-Veg ({nonVegCount})</span>
            </button>

            {/* Gluten Free Only */}
            <button
              type="button"
              onClick={() => setDietaryFilter('GLUTEN_FREE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                dietaryFilter === 'GLUTEN_FREE'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-800 hover:text-amber-950 bg-amber-50/50'
              }`}
            >
              <GlutenFreeSymbol size="xs" />
              <span>Gluten-Free ({glutenFreeCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        {categories.map((cat) => {
          const count = cat === 'All'
            ? items.length
            : items.filter((i) => i.category === cat).length;

          return (
            <button
              key={cat}
              onClick={() => handleSelectCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
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

      {/* Products Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-10 text-center bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
          <Package className="w-8 h-8 text-stone-400 mx-auto" />
          <p className="font-serif font-bold text-stone-800 text-sm">
            No items match this filter
          </p>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Try switching back to &apos;All&apos; or changing your dietary preference to see all freshly baked items.
          </p>
          <button
            type="button"
            onClick={() => {
              handleSelectCategory('All');
              setDietaryFilter('ALL');
            }}
            className="px-4 py-2 bg-stone-900 text-white rounded-full text-xs font-bold hover:bg-stone-800 transition cursor-pointer"
          >
            Show All Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredItems.map((item) => (
            <MenuItemCard key={item.id} item={item} outletSlug={outletSlug} />
          ))}
        </div>
      )}
    </section>
  );
}
