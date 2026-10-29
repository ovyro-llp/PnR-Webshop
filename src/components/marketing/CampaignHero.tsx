'use client';

import React, { useState, useEffect } from 'react';
import { Campaign, Outlet } from '@/types';
import { Clock, Check, Copy, Sparkles, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface CampaignHeroProps {
  campaign: Campaign;
  outlet: Outlet;
}

export function CampaignHero({ campaign, outlet }: CampaignHeroProps) {
  const { applyCoupon, setIsCartOpen } = useCart();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    minutes: campaign.countdownMinutes || 45,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        }
        return { minutes: 45, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(campaign.offerCode);
    applyCoupon(campaign.offerCode, campaign.discountPercentage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="relative overflow-hidden bg-[#FAF8F5] border border-stone-200/90 rounded-3xl p-6 sm:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      <div className="max-w-3xl space-y-5">
        {/* Badges Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-white border border-stone-200 text-stone-800 shadow-xs">
            <Sparkles className="w-3 h-3 text-stone-600" />
            {campaign.badge}
          </span>

          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium text-stone-600 bg-white border border-stone-200">
            📍 {outlet.name.replace("Puffs 'n' Rolls - ", '')}
          </span>

          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium text-stone-600 bg-white border border-stone-200">
            Express 25-Min Doorstep Delivery
          </span>
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 tracking-tight leading-tight">
            {campaign.headline}
          </h1>
          <p className="text-sm sm:text-base text-stone-600 max-w-2xl leading-relaxed">
            {campaign.subheadline}
          </p>
        </div>

        {/* Offer Code & Timer */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex items-center gap-3 bg-white border border-stone-300 rounded-2xl px-3.5 py-2 shadow-xs">
            <div>
              <p className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">
                Promo Code
              </p>
              <p className="font-mono text-sm font-bold text-stone-900 tracking-wider">
                {campaign.offerCode}
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              className="ml-2 px-3 py-1.5 bg-[#1C1917] hover:bg-stone-800 text-white rounded-xl text-xs font-medium transition flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-white" />
                  <span>Applied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-white" />
                  <span>Apply</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-2xl px-3.5 py-2">
            <Clock className="w-4 h-4 text-stone-400" />
            <div>
              <p className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">
                Offer Active For
              </p>
              <p className="font-mono text-xs font-bold text-stone-800">
                {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              applyCoupon(campaign.offerCode, campaign.discountPercentage);
              setIsCartOpen(true);
            }}
            className="px-6 py-3 bg-[#1C1917] hover:bg-stone-800 text-white font-medium text-xs tracking-wider uppercase rounded-full shadow-sm hover:scale-[1.01] transition flex items-center gap-2"
          >
            <span>{campaign.ctaText}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {campaign.discountPercentage}% OFF
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <span className="text-xs text-stone-500">
            Min. order ₹{campaign.minOrderValue} • Freshly baked upon order
          </span>
        </div>
      </div>
    </div>
  );
}
