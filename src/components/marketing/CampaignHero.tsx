'use client';

import React from 'react';
import { Campaign, Outlet } from '@/types';
import { Sparkles, ArrowRight, ShieldCheck, Flame } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface CampaignHeroProps {
  campaign: Campaign;
  outlet: Outlet;
}

export function CampaignHero({ campaign, outlet }: CampaignHeroProps) {
  const { setIsCartOpen } = useCart();

  return (
    <div className="relative overflow-hidden bg-[#FAF8F5] border border-stone-200/90 rounded-3xl p-4 sm:p-7 md:p-10 shadow-xs w-full box-border">
      <div className="max-w-3xl space-y-4 sm:space-y-5 w-full">
        {/* Badges Bar */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider bg-white border border-stone-200 text-stone-800 shadow-xs">
            <Sparkles className="w-3 h-3 text-stone-500" />
            {campaign.badge}
          </span>

          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium text-stone-600 bg-white border border-stone-200">
            📍 {outlet.name.replace("Puffs 'n' Rolls - ", '')}
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium text-stone-600 bg-white border border-stone-200">
            <Flame className="w-3 h-3 text-amber-600" />
            Fresh Ovens Every 45 Min
          </span>

          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium text-stone-600 bg-white border border-stone-200">
            25-Min Doorstep Delivery
          </span>
        </div>

        {/* Headline */}
        <div className="space-y-1.5 sm:space-y-2">
          <h1 className="text-xl sm:text-3xl md:text-5xl font-serif font-bold text-stone-900 tracking-tight leading-snug sm:leading-tight break-words">
            {campaign.headline}
          </h1>
          <p className="text-xs sm:text-base text-stone-600 max-w-2xl leading-relaxed">
            {campaign.subheadline}
          </p>
        </div>

        {/* CTA Button */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full sm:w-auto px-6 py-3 bg-[#1C1917] hover:bg-stone-800 active:scale-98 text-white font-medium text-xs tracking-wider uppercase rounded-full shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{campaign.ctaText || 'Order Fresh Now'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <span className="text-[11px] sm:text-xs text-stone-500 text-center sm:text-left flex items-center gap-1.5 justify-center sm:justify-start">
            <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
            Min. order ₹{campaign.minOrderValue} • Handcrafted with pure butter &amp; fresh cream
          </span>
        </div>
      </div>
    </div>
  );
}
