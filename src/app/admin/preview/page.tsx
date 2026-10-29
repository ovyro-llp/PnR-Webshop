'use client';

import React, { useState } from 'react';
import { OUTLETS, CAMPAIGNS } from '@/lib/data/mock-data';
import {
  Smartphone,
  RotateCw,
  ExternalLink,
  QrCode,
  Sparkles,
  Store,
  Layers,
  Copy,
  Check,
  Wifi,
  Battery,
  Signal,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function AdminPhonePreviewPage() {
  const [selectedOutlet, setSelectedOutlet] = useState('college-road');
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [deviceModel, setDeviceModel] = useState<'iphone' | 'compact'>('iphone');
  const [copiedLink, setCopiedLink] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const previewPath = selectedCampaign
    ? `/${selectedOutlet}/${selectedCampaign}`
    : `/${selectedOutlet}`;

  const fullPreviewUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${previewPath}`
    : `http://localhost:3000${previewPath}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(fullPreviewUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-stone-100 text-stone-900 border border-stone-200">
              <Smartphone className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight">
              Customer Phone View Simulator
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Test and preview how your bakery menus, promo campaigns, and mobile cart drawer appear on real customer smartphones
          </p>
        </div>

        {/* Device Controls */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-white p-1 rounded-full border border-stone-200 shadow-2xs text-xs">
            <button
              onClick={() => setDeviceModel('iphone')}
              className={`px-3.5 py-1.5 rounded-full font-medium transition ${
                deviceModel === 'iphone'
                  ? 'bg-[#1C1917] text-white font-semibold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              iPhone 16 Pro (390px)
            </button>
            <button
              onClick={() => setDeviceModel('compact')}
              className={`px-3.5 py-1.5 rounded-full font-medium transition ${
                deviceModel === 'compact'
                  ? 'bg-[#1C1917] text-white font-semibold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Android (360px)
            </button>
          </div>

          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-2 bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 rounded-full transition shadow-2xs"
            title="Reload Phone View"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side Controls (5 columns) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Quick Outlet Selector */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-serif font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-stone-700" />
                <span>Select Outlet Menu</span>
              </h3>
              <span className="text-[10px] font-mono text-stone-400">Live Switcher</span>
            </div>

            <div className="space-y-2">
              {OUTLETS.map((o) => {
                const isSelected = selectedOutlet === o.slug && !selectedCampaign;
                return (
                  <button
                    key={o.slug}
                    onClick={() => {
                      setSelectedOutlet(o.slug);
                      setSelectedCampaign('');
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border text-xs transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#1C1917] text-white border-stone-900 font-semibold shadow-xs'
                        : 'bg-[#FAF8F5] hover:bg-stone-100 text-stone-800 border-stone-200'
                    }`}
                  >
                    <div>
                      <span className="block font-medium">{o.name.replace("Puffs 'n' Rolls - ", '')}</span>
                      <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                        {o.address}
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-stone-200/80 text-stone-700'}`}>
                      /{o.slug}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ad Campaign Landing Pages */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-serif font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-stone-700" />
                <span>Ad Campaigns &amp; Discount Landers</span>
              </h3>
              <span className="text-[10px] font-mono text-stone-400">With Pixels</span>
            </div>

            <div className="space-y-2">
              {CAMPAIGNS.map((c) => {
                const isSelected = selectedCampaign === c.slug;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedOutlet(c.outletSlug);
                      setSelectedCampaign(c.slug);
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border text-xs transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#1C1917] text-white border-stone-900 font-semibold shadow-xs'
                        : 'bg-[#FAF8F5] hover:bg-stone-100 text-stone-800 border-stone-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{c.title}</span>
                        <span className={`text-[9px] px-2 py-0.2 rounded-full font-bold ${isSelected ? 'bg-amber-400 text-stone-950' : 'bg-amber-100 text-amber-800'}`}>
                          {c.badge}
                        </span>
                      </div>
                      <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                        Promo: <strong className="font-mono">{c.offerCode}</strong> ({c.discountPercentage}% OFF)
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-stone-200/80 text-stone-700'}`}>
                      /{c.outletSlug}/{c.slug}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Test on Physical Device Card */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-serif font-bold text-stone-900 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-stone-700" />
                <span>Test On Real Phone</span>
              </h3>
              <button
                onClick={copyUrl}
                className="text-[11px] font-medium text-stone-700 hover:text-stone-950 flex items-center gap-1 transition"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-stone-400" />}
                <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
              </button>
            </div>

            <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-stone-200 flex items-center gap-4">
              <div className="w-16 h-16 bg-white p-1 rounded-xl border border-stone-200 flex items-center justify-center shrink-0 shadow-2xs">
                <svg viewBox="0 0 100 100" className="w-full h-full text-stone-900" fill="currentColor">
                  <path d="M10,10 h30 v30 h-30 z M16,16 v18 h18 v-18 z M22,22 h6 v6 h-6 z" />
                  <path d="M60,10 h30 v30 h-30 z M66,16 v18 h18 v-18 z M72,22 h6 v6 h-6 z" />
                  <path d="M10,60 h30 v30 h-30 z M16,66 v18 h18 v-18 z M22,72 h6 v6 h-6 z" />
                  <circle cx="50" cy="50" r="8" fill="#1C1917" />
                  <rect x="48" y="15" width="4" height="20" />
                  <rect x="48" y="65" width="4" height="20" />
                  <rect x="65" y="48" width="20" height="4" />
                  <rect x="15" y="48" width="20" height="4" />
                </svg>
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-stone-400 block">
                  Active URL Path
                </span>
                <span className="text-xs font-mono font-medium text-stone-900 block truncate">
                  {previewPath}
                </span>
                <a
                  href={previewPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-900 hover:underline pt-0.5"
                >
                  <span>Open Standalone</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Ultra-Realistic Phone Mockup (7 columns) */}
        <div className="lg:col-span-7 flex justify-center py-2">
          <div
            className={`transition-all duration-300 relative rounded-[54px] p-3.5 bg-gradient-to-b from-stone-800 to-stone-950 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.35)] border-[5px] border-stone-700/80 ring-1 ring-white/10 ${
              deviceModel === 'iphone' ? 'w-[390px] h-[800px]' : 'w-[360px] h-[750px]'
            }`}
          >
            {/* Phone Speaker & Dynamic Island */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-between px-3.5 shadow-xs">
              <div className="w-2 h-2 rounded-full bg-stone-900 border border-stone-800" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-emerald-400" />
              </div>
            </div>

            {/* Simulated Phone Status Bar */}
            <div className="absolute top-4 left-9 right-9 h-6 z-20 flex items-center justify-between text-[11px] font-semibold text-stone-900 select-none pointer-events-none">
              <span>9:41</span>
              <div className="flex items-center gap-1.5 text-stone-900">
                <Signal className="w-3 h-3" />
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Inner Glass Screen with Embedded Live Storefront */}
            <div className="w-full h-full bg-[#FDFCFB] rounded-[42px] overflow-hidden relative shadow-inner pt-6">
              <iframe
                key={refreshKey}
                src={previewPath}
                title="Puffs 'n' Rolls Phone Preview"
                className="w-full h-full border-none select-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
