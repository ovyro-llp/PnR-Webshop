'use client';

import React from 'react';
import Image from 'next/image';
import { MenuItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { Plus, Minus } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const { addItem, items, updateQuantity } = useCart();
  const cartEntry = items.find((ci) => ci.item.id === item.id);

  return (
    <div className="bg-white rounded-2xl border border-stone-200/70 hover:border-stone-400/80 transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
      {/* Product Image */}
      <div className="relative w-full h-48 bg-stone-50 overflow-hidden">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-103 transition duration-500 ease-out"
        />

        {/* Veg / Non-Veg Indicator */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm p-1 rounded-md shadow-xs z-10">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          />
        </div>

        {item.isBestseller && (
          <div className="absolute top-3 left-3 bg-[#1C1917]/90 backdrop-blur-sm text-white text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full z-10">
            Signature
          </div>
        )}
      </div>

      {/* Item Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-400 block">
            {item.category}
          </span>
          <h3 className="font-serif font-bold text-base text-stone-900 group-hover:text-stone-700 transition line-clamp-1 mt-0.5">
            {item.name}
          </h3>
          <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Price & Action */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-stone-900">
              ₹{item.price}
            </span>
            {item.originalPrice && item.originalPrice > item.price && (
              <span className="text-xs text-stone-400 line-through">
                ₹{item.originalPrice}
              </span>
            )}
          </div>

          {cartEntry ? (
            <div className="flex items-center gap-2 bg-stone-100 px-2 py-1 rounded-full border border-stone-200">
              <button
                onClick={() => updateQuantity(item.id, cartEntry.quantity - 1)}
                className="text-stone-600 hover:text-stone-950 p-0.5"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-xs font-bold text-stone-900 min-w-[14px] text-center">
                {cartEntry.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, cartEntry.quantity + 1)}
                className="text-stone-600 hover:text-stone-950 p-0.5"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addItem(item, 1)}
              className="px-4 py-1.5 bg-[#1C1917] hover:bg-stone-800 text-white rounded-full text-xs font-medium tracking-wide transition flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
