'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MenuItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { useLocation } from '@/context/LocationContext';
import { DietarySymbol, GlutenFreeSymbol } from '@/components/ui/DietarySymbol';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import {
  Plus,
  Minus,
  ShoppingBag,
  Sparkles,
  MapPin,
  Check,
  Copy,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  Flame,
} from 'lucide-react';

interface ProductViewProps {
  product: MenuItem;
  relatedProducts: MenuItem[];
}

export function ProductView({ product, relatedProducts }: ProductViewProps) {
  const { addItem, setIsCartOpen, items: cartItems, updateQuantity } = useCart();
  const { nearestOutlet, openLocationModal } = useLocation();

  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const cartEntry = cartItems.find((ci) => ci.item.id === product.id);
  const isSoldOut = product.isAvailable === false || (typeof product.stockQuantity === 'number' && product.stockQuantity <= 0);

  const defaultFallback = '/images/no-image-available.png';
  const getProductImage = (img?: string) => {
    if (!img || img.includes('unsplash.com')) return defaultFallback;
    return img;
  };
  const [currentImg, setCurrentImg] = useState<string>(getProductImage(product.image));

  useEffect(() => {
    setCurrentImg(getProductImage(product.image));
  }, [product.image]);

  // Fire Meta Pixel ViewContent for this specific product
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      try {
        (window as any).fbq('track', 'ViewContent', {
          content_name: product.name,
          content_ids: [product.id],
          content_type: 'product',
          value: product.price,
          currency: 'INR',
          content_category: product.category,
        });
      } catch (err) {
        console.warn('[Meta Pixel ViewContent Error]:', err);
      }
    }
  }, [product]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddToBag = () => {
    if (isSoldOut) return;
    addItem(product, quantity, nearestOutlet.slug);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const handleBuyNow = () => {
    if (isSoldOut) return;
    addItem(product, quantity, nearestOutlet.slug);
    setIsCartOpen(true);
  };

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10 w-full">
      {/* Top Breadcrumb & Share Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500 border-b border-stone-200/80 pb-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 flex-wrap">
          <Link
            href="/"
            className="hover:text-stone-900 transition flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <Link
            href={`/?category=${encodeURIComponent(product.category)}`}
            className="hover:text-stone-900 transition font-medium"
          >
            {product.category}
          </Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <span className="text-stone-900 font-semibold truncate max-w-[200px] sm:max-w-none">
            {product.name}
          </span>
        </nav>

        {/* 1-Click Copy Link Button for Ads & Social */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-stone-50 border border-stone-200/90 text-stone-700 text-xs font-medium transition shadow-2xs cursor-pointer active:scale-95"
          title="Copy direct product URL for Meta Ads or WhatsApp"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Link Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-stone-500" />
              <span>Copy Product Link for Ads</span>
            </>
          )}
        </button>
      </div>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: Product Image Card */}
        <div className="lg:col-span-6 space-y-3">
          <div className="relative w-full aspect-square max-h-[500px] bg-gradient-to-b from-[#FAF8F5] via-stone-50 to-stone-100/80 rounded-3xl border border-stone-200/90 overflow-hidden p-6 sm:p-10 flex items-center justify-center shadow-xs">
            {/* Soft Ambient Background Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 filter blur-2xl scale-125">
              <Image
                src={currentImg}
                alt=""
                fill
                aria-hidden="true"
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Main Product Photography */}
            <Image
              src={currentImg}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              className={`relative z-1 object-contain object-center p-4 transition-transform duration-500 ${
                isSoldOut ? 'grayscale contrast-75' : 'hover:scale-105'
              }`}
              onError={() => {
                if (currentImg !== defaultFallback) {
                  setCurrentImg(defaultFallback);
                }
              }}
            />

            {/* Badges Overlay */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              {product.isGlutenFree && (
                <div
                  className="bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl border border-amber-200 shadow-2xs flex items-center"
                  title="Gluten Free"
                >
                  <GlutenFreeSymbol size="sm" showLabel />
                </div>
              )}
              <div
                className="bg-white/95 backdrop-blur-sm p-1.5 rounded-xl border border-stone-200 shadow-2xs flex items-center justify-center"
                title={product.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
              >
                <DietarySymbol isVeg={product.isVeg} size="sm" />
              </div>
            </div>

            {product.isBestseller && !isSoldOut && (
              <div className="absolute top-4 left-4 bg-[#1C1917]/90 backdrop-blur-sm text-white text-[11px] uppercase tracking-wider font-semibold px-3 py-1 rounded-full z-10 shadow-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Bakery Signature</span>
              </div>
            )}

            {isSoldOut && (
              <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                <span className="bg-rose-950/90 text-rose-100 text-sm font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider border border-rose-500/30 shadow-md">
                  Sold Out for Today
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Product Details & Purchase Actions */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <Link
              href={`/?category=${encodeURIComponent(product.category)}`}
              className="inline-block text-[11px] uppercase tracking-widest font-bold text-amber-800 hover:text-amber-950 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80 transition"
            >
              {product.category}
              {product.subCategory ? ` • ${product.subCategory}` : ''}
            </Link>

            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Pricing Section */}
            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-3xl font-bold text-stone-900">
                ₹{product.price}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <>
                  <span className="text-lg text-stone-400 line-through">
                    ₹{product.originalPrice}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Save {discountPercent}%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          {product.description && product.description.trim() ? (
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 block mb-1">
                About this bake
              </span>
              <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          ) : (
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                Handcrafted daily in small batches at our Nashik kitchen using premium, authentic bakery ingredients. Prepared fresh for express delivery to your doorstep.
              </p>
            </div>
          )}

          {/* Delivering Kitchen Location Strip */}
          <div className="flex items-center justify-between p-3.5 bg-white border border-stone-200 rounded-2xl text-xs shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-amber-800" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-stone-400 uppercase font-bold block">
                  Delivering From
                </span>
                <span className="font-semibold text-stone-800 truncate block">
                  {nearestOutlet.name.replace("Puffs 'n' Rolls - ", '')} Kitchen
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={openLocationModal}
              className="text-amber-800 hover:text-amber-950 font-bold underline underline-offset-2 shrink-0 cursor-pointer"
            >
              Change
            </button>
          </div>

          {/* Express Delivery Guarantee */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-stone-50/80 border border-stone-200/70 rounded-2xl flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <div>
                <span className="font-bold text-stone-800 block">100% Fresh Daily</span>
                <span className="text-[10px] text-stone-500">Baked fresh in Nashik</span>
              </div>
            </div>
            <div className="p-3 bg-stone-50/80 border border-stone-200/70 rounded-2xl flex items-center gap-2.5">
              <Flame className="w-4 h-4 text-amber-700 shrink-0" />
              <div>
                <span className="font-bold text-stone-800 block">Express Delivery</span>
                <span className="text-[10px] text-stone-500">Fast doorstep delivery</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Quantity, Add to Bag & Buy Now */}
          <div className="space-y-3 pt-2">
            {isSoldOut ? (
              <div className="p-4 bg-stone-100 rounded-2xl text-center text-sm font-semibold text-stone-500 border border-stone-200">
                This item is currently sold out for today. Please check back tomorrow morning!
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                {/* Quantity Control */}
                <div className="inline-flex items-center justify-between bg-stone-100 border border-stone-200 rounded-2xl p-1.5 sm:w-36">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-9 h-9 rounded-xl bg-white text-stone-700 hover:text-stone-900 disabled:opacity-40 flex items-center justify-center transition shadow-2xs cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-stone-900 text-sm px-2">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-9 h-9 rounded-xl bg-white text-stone-700 hover:text-stone-900 flex items-center justify-center transition shadow-2xs cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Add to Bag Button */}
                <button
                  type="button"
                  onClick={handleAddToBag}
                  className={`flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.99] ${
                    addedAnimation
                      ? 'bg-emerald-700 text-white'
                      : 'bg-stone-900 hover:bg-stone-800 text-white'
                  }`}
                >
                  {addedAnimation ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Bag • ₹{product.price * quantity}</span>
                    </>
                  )}
                </button>

                {/* Express Checkout / Buy Now */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="py-3.5 px-6 rounded-2xl font-bold text-sm bg-amber-600 hover:bg-amber-700 text-white transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.99]"
                >
                  <span>Order Now</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="pt-10 border-t border-stone-200/80 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400 block">
                More from {product.category}
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mt-0.5">
                Fresh From the Same Bakery Counter
              </h2>
            </div>
            <Link
              href={`/?category=${encodeURIComponent(product.category)}`}
              className="text-xs font-bold text-stone-900 hover:text-amber-800 underline underline-offset-4"
            >
              View All ({product.category})
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((item) => (
              <MenuItemCard key={item.id} item={item} outletSlug={nearestOutlet.slug} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
