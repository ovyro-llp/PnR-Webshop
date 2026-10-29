'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export function MobileCartBar() {
  const { itemCount, total, setIsCartOpen } = useCart();

  if (itemCount === 0) return null;

  return (
    <div className="sm:hidden fixed bottom-4 inset-x-3 z-30 animate-slide-up">
      <button
        onClick={() => setIsCartOpen(true)}
        className="w-full bg-[#1C1917] hover:bg-stone-800 text-white rounded-2xl p-3.5 shadow-2xl flex items-center justify-between border border-stone-700/50 active:scale-[0.99] transition"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-stone-200">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold leading-none">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </p>
            <p className="text-[11px] text-stone-300 mt-0.5">
              Total: <strong>₹{total}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white text-stone-900 px-3.5 py-1.5 rounded-xl text-xs font-bold">
          <span>View Bag</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </button>
    </div>
  );
}
