'use client';

import React from 'react';
import Image from 'next/image';
import { MenuItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { Plus, Flame, Clock } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const { addItem, items, updateQuantity } = useCart();
  const cartEntry = items.find((ci) => ci.item.id === item.id);

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden group">
      {/* Product Image & Badges */}
      <div className="relative w-full h-44 bg-stone-100 overflow-hidden">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition duration-300"
        />

        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
          {item.isBestseller && (
            <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
              <Flame className="w-3 h-3" />
              BESTSELLER
            </span>
          )}
          {item.isSpicy && (
            <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
              🌶️ SPICY
            </span>
          )}
        </div>

        {/* Veg / Non-Veg Indicator */}
        <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm p-1 rounded-md shadow-sm z-10">
          <div
            className={`w-3 h-3 rounded-full border-2 ${
              item.isVeg ? 'border-emerald-600 bg-emerald-500' : 'border-rose-600 bg-rose-500'
            }`}
          />
        </div>

        {/* Oven Prep Time Badge */}
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
          <Clock className="w-2.5 h-2.5 text-amber-300" />
          <span>{item.preparationTimeMinutes}m oven bake</span>
        </div>
      </div>

      {/* Item Info */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <span className="text-[11px] font-semibold text-amber-700 tracking-wider uppercase">
            {item.category}
          </span>
          <h3 className="font-bold text-sm text-stone-900 group-hover:text-amber-700 transition line-clamp-1 mt-0.5">
            {item.name}
          </h3>
          <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Price & Action Button */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-stone-900">
                ₹{item.price}
              </span>
              {item.originalPrice && item.originalPrice > item.price && (
                <span className="text-xs text-stone-400 line-through">
                  ₹{item.originalPrice}
                </span>
              )}
            </div>
            {item.originalPrice && (
              <span className="text-[10px] text-emerald-600 font-bold">
                {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
              </span>
            )}
          </div>

          {/* Add to Cart button or stepper */}
          {cartEntry ? (
            <div className="flex items-center gap-2 bg-amber-50 px-2 py-1 rounded-lg border border-amber-300">
              <button
                onClick={() => updateQuantity(item.id, cartEntry.quantity - 1)}
                className="text-amber-800 hover:text-amber-950 font-bold text-xs p-0.5"
              >
                -
              </button>
              <span className="text-xs font-bold text-amber-900 min-w-[14px] text-center">
                {cartEntry.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, cartEntry.quantity + 1)}
                className="text-amber-800 hover:text-amber-950 font-bold text-xs p-0.5"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={() => addItem(item, 1)}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              ADD
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
