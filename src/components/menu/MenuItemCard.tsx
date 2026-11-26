'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MenuItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { Plus, Minus } from 'lucide-react';
import { DietarySymbol, GlutenFreeSymbol } from '@/components/ui/DietarySymbol';
import { slugify } from '@/lib/utils/slugify';

interface MenuItemCardProps {
  item: MenuItem;
  outletSlug?: string;
}

export function MenuItemCard({ item, outletSlug }: MenuItemCardProps) {
  const { addItem, items, updateQuantity } = useCart();
  const cartEntry = items.find((ci) => ci.item.id === item.id);
  const isSoldOut = item.isAvailable === false || (typeof item.stockQuantity === 'number' && item.stockQuantity <= 0);
  const isLowStock = !isSoldOut && typeof item.stockQuantity === 'number' && item.stockQuantity > 0 && item.stockQuantity <= 4;
  const productSlug = item.slug || slugify(item.name);

  const defaultFallback = '/images/no-image-available.png';
  const getProductImage = (img?: string) => {
    if (!img || img.includes('unsplash.com')) return defaultFallback;
    return img;
  };
  const [currentImg, setCurrentImg] = React.useState<string>(getProductImage(item.image));

  React.useEffect(() => {
    setCurrentImg(getProductImage(item.image));
  }, [item.image]);

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-[0_2px_8px_rgba(0,0,0,0.02)] ${
      isSoldOut ? 'opacity-70 border-stone-200' : 'border-stone-200/70 hover:border-stone-400/80'
    }`}>
      {/* Product Image: Centered, fully fitted within frame so all packaging & labels are clearly visible */}
      <Link
        href={`/product/${productSlug}`}
        className="relative w-full h-52 bg-gradient-to-b from-[#FAF8F5] via-stone-50 to-stone-100/70 overflow-hidden flex items-center justify-center p-2.5 block cursor-pointer"
        title={`View ${item.name} details`}
      >
        {/* Soft Ambient Studio Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25 filter blur-xl scale-125">
          <Image
            src={currentImg}
            alt=""
            fill
            aria-hidden="true"
            className="object-cover"
            unoptimized
          />
        </div>

        {/* Foreground Product Photo: object-contain preserves entire packet, label, and bread */}
        <Image
          src={currentImg}
          alt={item.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`relative z-1 object-contain object-center p-2 transition duration-500 ease-out drop-shadow-xs ${
            isSoldOut ? 'grayscale contrast-75' : 'group-hover:scale-105'
          }`}
          onError={() => {
            if (currentImg !== defaultFallback) {
              setCurrentImg(defaultFallback);
            }
          }}
        />

        {/* Dietary & Allergy Indicators */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10 pointer-events-none">
          {item.isGlutenFree && (
            <div
              className="bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-amber-200/90 shadow-2xs flex items-center"
              title="Gluten Free"
            >
              <GlutenFreeSymbol size="sm" showLabel />
            </div>
          )}
          <div
            className="bg-white/95 backdrop-blur-sm p-1 rounded-lg border border-stone-200/80 shadow-2xs flex items-center justify-center"
            title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
          >
            <DietarySymbol isVeg={item.isVeg} size="sm" />
          </div>
        </div>

        {item.isBestseller && !isSoldOut && (
          <div className="absolute top-3 left-3 bg-[#1C1917]/90 backdrop-blur-sm text-white text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full z-10 pointer-events-none">
            Signature
          </div>
        )}

        {isSoldOut && (
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[1px] flex items-center justify-center z-10">
            <span className="bg-rose-950/90 text-rose-100 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider border border-rose-500/30">
              Sold Out Today
            </span>
          </div>
        )}
      </Link>

      {/* Item Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <Link
              href={`/?category=${encodeURIComponent(item.category)}`}
              className="text-[10px] uppercase tracking-widest font-semibold text-stone-400 hover:text-stone-700 block transition truncate max-w-[150px]"
              title={`Filter by ${item.category}`}
            >
              {item.category}
            </Link>
            {isLowStock && (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                Only {item.stockQuantity} left
              </span>
            )}
          </div>
          <Link href={`/product/${productSlug}`} className="block group/link">
            <h3 className="font-serif font-bold text-base text-stone-900 group-hover/link:text-amber-800 transition line-clamp-1 mt-0.5">
              {item.name}
            </h3>
          </Link>
          {item.description && item.description.trim() ? (
            <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
              {item.description}
            </p>
          ) : null}
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

          {isSoldOut ? (
            <span className="px-3 py-1.5 bg-stone-100 text-stone-400 rounded-full text-xs font-medium cursor-not-allowed">
              Sold Out
            </span>
          ) : cartEntry ? (
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
              onClick={() => addItem(item, 1, outletSlug)}
              data-testid="add-to-cart-btn"
              aria-label={`Add ${item.name} to bag`}
              className="px-4 py-1.5 bg-[#1C1917] hover:bg-stone-800 text-white rounded-full text-xs font-medium tracking-wide transition flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
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
