'use client';

import React, { useState, useEffect } from 'react';
import { Campaign, Outlet } from '@/types';
import { Sparkles, Clock, Check, Bike, Copy } from 'lucide-react';
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

  // Countdown timer simulation for ads conversion urgency
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
    <div className="relative overflow-hidden bg-gradient-to-br from-amber-950 via-stone-900 to-amber-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-amber-800/40">
      {/* Background Decorative Pattern */}
      <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl space-y-5">
        {/* Badges Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {campaign.badge}
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-stone-200 backdrop-blur-sm">
            📍 {outlet.name}
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            <Bike className="w-3.5 h-3.5" />
            Mangwale 25-Min Delivery
          </span>
        </div>

        {/* Main Headline */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
            {campaign.headline}
          </h1>
          <p className="text-sm sm:text-base text-amber-100/90 max-w-2xl leading-relaxed">
            {campaign.subheadline}
          </p>
        </div>

        {/* Dynamic Offer & Urgency Box */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          {/* Coupon Code Pill */}
          <div className="flex items-center gap-2 bg-black/40 border border-amber-500/40 rounded-xl px-3.5 py-2 backdrop-blur-md">
            <div>
              <p className="text-[10px] text-amber-300 uppercase font-semibold">
                Use Coupon Code
              </p>
              <p className="font-mono text-base font-extrabold text-white tracking-widest">
                {campaign.offerCode}
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              className="ml-2 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 rounded-lg text-xs font-bold flex items-center gap-1 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Applied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-white" />
                  <span>Apply</span>
                </>
              )}
            </button>
          </div>

          {/* Flash Timer */}
          <div className="flex items-center gap-2 bg-rose-950/60 border border-rose-700/50 rounded-xl px-3.5 py-2">
            <Clock className="w-4 h-4 text-rose-400 animate-pulse" />
            <div>
              <p className="text-[10px] text-rose-300 uppercase font-semibold">Offer Closes In</p>
              <p className="font-mono text-sm font-bold text-white">
                {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              applyCoupon(campaign.offerCode, campaign.discountPercentage);
              setIsCartOpen(true);
            }}
            className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 hover:scale-102 transition flex items-center gap-2"
          >
            <span>{campaign.ctaText}</span>
            <span className="bg-stone-950/20 px-2 py-0.5 rounded text-xs font-bold">
              {campaign.discountPercentage}% OFF
            </span>
          </button>

          <span className="text-xs text-amber-200/80">
            Min. order ₹{campaign.minOrderValue} • Freshly prepared on order
          </span>
        </div>
      </div>
    </div>
  );
}
