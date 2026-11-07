'use client';

import React, { useState, useMemo } from 'react';
import { MenuItem } from '@/types';
import { MenuItemCard } from './MenuItemCard';
import { Package, Sparkles } from 'lucide-react';

interface MenuCatalogSectionProps {
  items: MenuItem[];
  outletSlug: string;
  title?: string;
  subtitle?: string;
}

export type DietaryFilterType = 'ALL' | 'VEG' | 'NON_VEG';

export function MenuCatalogSection({
  items,
  outletSlug,
  title = 'Fresh Counter Menu',
  subtitle = 'Baked in small batches throughout the day. Dispatched in under 25 minutes across Nashik.',
}: MenuCatalogSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dietaryFilter, setDietaryFilter] = useState<DietaryFilterType>('ALL');

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(items.map((i) => i.category)))];
  }, [items]);

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
      return true;
    });
  }, [items, selectedCategory, dietaryFilter]);

  const vegCount = useMemo(() => items.filter((i) => i.isVeg).length, [items]);
  const nonVegCount = useMemo(() => items.filter((i) => !i.isVeg).length, [items]);

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

        {/* Dietary 3-Way Filter Controls */}
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

      {/* Category Pills Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        {categories.map((cat) => {
          const count = cat === 'All'
            ? items.length
            : items.filter((i) => i.category === cat).length;

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
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
              setSelectedCategory('All');
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
