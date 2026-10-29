'use client';

import React, { useState, useEffect } from 'react';
import { OUTLETS, CAMPAIGNS } from '@/lib/data/mock-data';
import { Campaign, CampaignAnalytics } from '@/types';
import {
  SlidersHorizontal,
  Target,
  Link as LinkIcon,
  Copy,
  CheckCircle2,
  ExternalLink,
  Code2,
  TrendingUp,
  DollarSign,
  Activity,
  Sparkles,
  Share2,
  RefreshCw,
  Eye,
  Check,
} from 'lucide-react';

export default function MarketingViewPage() {
  const [activeTab, setActiveTab] = useState<'tags' | 'generator' | 'analytics'>('tags');
  const [tags, setTags] = useState({
    globalMetaPixelId: '999888777666555',
    globalGoogleAdsId: 'AW-987654300',
    globalGtmId: 'GTM-PNR2026',
    tiktokPixelId: '',
    snapchatPixelId: '',
    metaCapiEnabled: true,
    metaCapiAccessToken: 'EAABw...[ENCRYPTED_SERVER_TOKEN]',
    customHeaderScript: '<!-- P&R Universal Analytics Engine Active -->',
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>(CAMPAIGNS);
  const [analytics, setAnalytics] = useState<CampaignAnalytics[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Campaign Generator Form State
  const [genOutlet, setGenOutlet] = useState('college-road');
  const [genSlug, setGenSlug] = useState('weekend-puff-fest');
  const [genTitle, setGenTitle] = useState('Weekend Puff & Cake Carnival');
  const [genUtmSource, setGenUtmSource] = useState('meta');
  const [genUtmMedium, setGenUtmMedium] = useState('paid_social');
  const [genUtmCampaign, setGenUtmCampaign] = useState('diwali_launch_2026');
  const [genDiscountCode, setGenDiscountCode] = useState('WEEKEND20');
  const [genDiscountPercent, setGenDiscountPercent] = useState('20');
  const [genCustomPixel, setGenCustomPixel] = useState('');

  const fetchMarketingData = async () => {
    try {
      const res = await fetch('/api/marketing');
      const data = await res.json();
      if (data.success) {
        if (data.tags) {
          setTags((prev) => ({ ...prev, ...data.tags }));
        }
        if (data.campaigns) {
          setCampaigns(data.campaigns);
        }
        if (data.analytics) {
          setAnalytics(data.analytics);
        }
      }
    } catch (err) {
      console.error('Failed to fetch marketing data', err);
    }
  };

  useEffect(() => {
    fetchMarketingData();
  }, []);

  const handleSaveTags = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage('');

    try {
      const res = await fetch('/api/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_TAGS',
          tags,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage('✓ All tracking tags & Conversions API credentials updated globally!');
        setTimeout(() => setStatusMessage(''), 4000);
      }
    } catch (err) {
      console.error('Error saving tags', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_CAMPAIGN',
          campaignData: {
            slug: genSlug,
            title: genTitle,
            outletSlug: genOutlet,
            headline: genTitle,
            subheadline: 'Handcrafted fresh daily at Nashik bakery',
            badge: 'Limited Time Ad Special',
            discountPercentage: parseInt(genDiscountPercent, 10) || 0,
            discountCode: genDiscountCode,
            metaPixelId: genCustomPixel || tags.globalMetaPixelId,
            googleAdsId: tags.globalGoogleAdsId,
            gtmId: tags.globalGtmId,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage(`✓ Campaign /${genOutlet}/${genSlug} created successfully!`);
        fetchMarketingData();
        setTimeout(() => setStatusMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to create campaign', err);
    } finally {
      setIsSaving(false);
    }
  };

  const fullGeneratedUrl = `https://puffsnrolls.com/${genOutlet}/${genSlug}?utm_source=${genUtmSource}&utm_medium=${genUtmMedium}&utm_campaign=${genUtmCampaign}&offer=${genDiscountCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullGeneratedUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <SlidersHorizontal className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Performance Marketing &amp; Tag Manager
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dedicated view for media buyers, growth marketers &amp; agencies to connect tracking codes and generate UTM campaigns
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('tags')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'tags'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Tracking Tags</span>
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'generator'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Campaign Builder</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Attribution &amp; ROAS</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs font-medium text-amber-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* TAB 1: Tracking Tags & Pixels */}
      {activeTab === 'tags' && (
        <form onSubmit={handleSaveTags} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Meta (Facebook & Instagram) */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <h3 className="text-sm font-bold text-white">Meta (Facebook &amp; Instagram)</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  CAPI Active
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block font-medium mb-1">
                    Global Meta Pixel ID
                  </label>
                  <input
                    type="text"
                    value={tags.globalMetaPixelId}
                    onChange={(e) => setTags({ ...tags, globalMetaPixelId: e.target.value })}
                    placeholder="e.g. 999888777666555"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Fires standard PageView, ViewContent, AddToCart, InitiateCheckout &amp; Purchase events.
                  </span>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block font-medium mb-1">
                    Server-Side Conversions API (CAPI) Access Token
                  </label>
                  <input
                    type="password"
                    value={tags.metaCapiAccessToken}
                    onChange={(e) => setTags({ ...tags, metaCapiAccessToken: e.target.value })}
                    placeholder="EAABw..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Bypasses iOS ad-blockers by firing server-to-server purchases via Next.js backend.
                  </span>
                </div>
              </div>
            </div>

            {/* Google Ads & GTM */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <h3 className="text-sm font-bold text-white">Google Ads &amp; GTM</h3>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Dual Tagging
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block font-medium mb-1">
                    Google Ads Conversion ID
                  </label>
                  <input
                    type="text"
                    value={tags.globalGoogleAdsId}
                    onChange={(e) => setTags({ ...tags, globalGoogleAdsId: e.target.value })}
                    placeholder="AW-987654300"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block font-medium mb-1">
                    Google Tag Manager Container ID
                  </label>
                  <input
                    type="text"
                    value={tags.globalGtmId}
                    onChange={(e) => setTags({ ...tags, globalGtmId: e.target.value })}
                    placeholder="GTM-PNR2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* TikTok & Snapchat */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500" />
                <h3 className="text-sm font-bold text-white">TikTok &amp; Snapchat Ad Pixels</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block font-medium mb-1">
                    TikTok Pixel ID
                  </label>
                  <input
                    type="text"
                    value={tags.tiktokPixelId}
                    onChange={(e) => setTags({ ...tags, tiktokPixelId: e.target.value })}
                    placeholder="e.g. C1234567890ABCD"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block font-medium mb-1">
                    Snapchat Pixel ID
                  </label>
                  <input
                    type="text"
                    value={tags.snapchatPixelId}
                    onChange={(e) => setTags({ ...tags, snapchatPixelId: e.target.value })}
                    placeholder="e.g. 1a2b3c4d-5e6f-7g8h"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Custom Scripts & Code Injections */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-bold text-white">Custom Header / Body Scripts</h3>
              </div>

              <div>
                <label className="text-xs text-slate-400 block font-medium mb-1">
                  Custom Analytics &amp; Heatmap Tags (Clarity, Hotjar, Twitter)
                </label>
                <textarea
                  rows={4}
                  value={tags.customHeaderScript}
                  onChange={(e) => setTags({ ...tags, customHeaderScript: e.target.value })}
                  placeholder="<!-- Paste your custom tracking script here -->"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Saving Tags...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save All Tracking Tags</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Campaign Builder & UTM Generator */}
      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Builder Form */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Create Ad Campaign &amp; Generate UTM URL</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block font-medium mb-1">
                  Destination Bakery Outlet
                </label>
                <select
                  value={genOutlet}
                  onChange={(e) => setGenOutlet(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {OUTLETS.map((o) => (
                    <option key={o.slug} value={o.slug}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block font-medium mb-1">
                    Campaign Slug
                  </label>
                  <input
                    type="text"
                    value={genSlug}
                    onChange={(e) => setGenSlug(e.target.value)}
                    placeholder="weekend-puff-fest"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block font-medium mb-1">
                    Campaign Title
                  </label>
                  <input
                    type="text"
                    value={genTitle}
                    onChange={(e) => setGenTitle(e.target.value)}
                    placeholder="Weekend Puff Carnival"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block font-medium mb-1">UTM Source</label>
                  <input
                    type="text"
                    value={genUtmSource}
                    onChange={(e) => setGenUtmSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block font-medium mb-1">UTM Medium</label>
                  <input
                    type="text"
                    value={genUtmMedium}
                    onChange={(e) => setGenUtmMedium(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block font-medium mb-1">Campaign Tag</label>
                  <input
                    type="text"
                    value={genUtmCampaign}
                    onChange={(e) => setGenUtmCampaign(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block font-medium mb-1">
                    Promo Code (Auto-applied)
                  </label>
                  <input
                    type="text"
                    value={genDiscountCode}
                    onChange={(e) => setGenDiscountCode(e.target.value.toUpperCase())}
                    placeholder="WEEKEND20"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block font-medium mb-1">
                    Discount %
                  </label>
                  <input
                    type="number"
                    value={genDiscountPercent}
                    onChange={(e) => setGenDiscountPercent(e.target.value)}
                    placeholder="20"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block font-medium mb-1">
                  Dedicated Meta Pixel ID for this Ad Set (Optional override)
                </label>
                <input
                  type="text"
                  value={genCustomPixel}
                  onChange={(e) => setGenCustomPixel(e.target.value)}
                  placeholder="Defaults to Global Meta Pixel ID"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleCreateCampaign}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Save Dynamic Landing Page</span>
              </button>
            </div>
          </div>

          {/* Generated URL & Live Preview Card */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
                  Ready-To-Use Ad Link
                </span>
                <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Meta &amp; Google Compatible
                </span>
              </div>

              <div className="mt-3 p-4 bg-slate-950 rounded-xl border border-slate-800 break-all font-mono text-xs text-amber-300 leading-relaxed select-all">
                {fullGeneratedUrl}
              </div>

              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
                    copiedUrl
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied Ad URL!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Ad Destination URL</span>
                    </>
                  )}
                </button>

                <a
                  href={`/${genOutlet}/${genSlug}`}
                  target="_blank"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview LP</span>
                </a>
              </div>
            </div>

            {/* Campaign Summary Box */}
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2 text-xs">
              <span className="font-bold text-white block">Ad Placement Checklist:</span>
              <ul className="text-slate-400 space-y-1 list-disc pl-4 text-[11px]">
                <li>Paste this destination URL into Meta Ads Manager (Ad set level).</li>
                <li>Meta Pixel ID will fire automatic ViewContent &amp; InitiateCheckout tags.</li>
                <li>Conversions will fire both client-side and server-side via CAPI.</li>
                <li>Discount code <span className="text-amber-400 font-mono">{genDiscountCode}</span> is pre-applied in customer cart drawer.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Attribution & ROAS Dashboard */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          {/* Funnel High Level Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Total Campaign GMV</span>
              <span className="text-2xl font-bold text-amber-400 mt-1 block font-mono">
                ₹{analytics.reduce((acc, c) => acc + c.grossRevenue, 0).toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Orders Generated</span>
              <span className="text-2xl font-bold text-emerald-400 mt-1 block font-mono">
                {analytics.reduce((acc, c) => acc + c.ordersPlaced, 0)}
              </span>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Total Ad Clicks</span>
              <span className="text-2xl font-bold text-blue-400 mt-1 block font-mono">
                {analytics.reduce((acc, c) => acc + c.clicks, 0).toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Blended ROAS</span>
              <span className="text-2xl font-bold text-white mt-1 block font-mono">
                4.8x
              </span>
            </div>
          </div>

          {/* Campaign Attribution Table */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Campaign Funnel &amp; Tag Attribution</h3>
              <button
                onClick={fetchMarketingData}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Metrics</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Campaign / Landing Page</th>
                    <th className="p-3">Outlet</th>
                    <th className="p-3 text-right">Impressions</th>
                    <th className="p-3 text-right">Clicks</th>
                    <th className="p-3 text-right">CTR</th>
                    <th className="p-3 text-right">Orders</th>
                    <th className="p-3 text-right">Conv. Rate</th>
                    <th className="p-3 text-right">Revenue</th>
                    <th className="p-3">Tracking Pixel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {analytics.map((camp) => (
                    <tr key={camp.campaignSlug} className="hover:bg-slate-800/40">
                      <td className="p-3 font-medium text-white">
                        <div>
                          <span className="block font-bold">{camp.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            /{camp.outletSlug}/{camp.campaignSlug}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">
                          {camp.outletSlug}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-300">
                        {camp.impressions.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-300">
                        {camp.clicks.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-400">
                        {camp.ctr}%
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-white">
                        {camp.ordersPlaced}
                      </td>
                      <td className="p-3 text-right font-mono text-amber-400">
                        {camp.conversionRate}%
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-amber-300">
                        ₹{camp.grossRevenue.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                          {camp.metaPixelId || 'Global Pixel'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
