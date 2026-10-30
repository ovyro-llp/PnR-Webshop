'use client';

import React, { useState, useEffect } from 'react';
import { CampaignAnalytics } from '@/types';
import {
  SlidersHorizontal,
  Copy,
  CheckCircle2,
  ExternalLink,
  Code2,
  TrendingUp,
  RefreshCw,
  Check,
  CreditCard,
  Lock,
  ShieldCheck,
} from 'lucide-react';

export default function MarketingViewPage() {
  const [activeTab, setActiveTab] = useState<'tags' | 'payments' | 'analytics'>('tags');
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

  const [paymentConfig, setPaymentConfig] = useState({
    razorpayKeyId: 'rzp_test_pnr_demo',
    razorpayKeySecret: '',
    razorpayWebhookSecret: '',
    testKeyId: 'rzp_test_pnr_demo',
    testKeySecret: '',
    testWebhookSecret: '',
    liveKeyId: '',
    liveKeySecret: '',
    liveWebhookSecret: '',
    isEnabled: true,
    testMode: true,
    businessName: "Puffs 'n' Rolls Nashik",
  });
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);
  const [copiedMangwaleUrl, setCopiedMangwaleUrl] = useState(false);

  const [analytics, setAnalytics] = useState<CampaignAnalytics[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const fetchMarketingData = async () => {
    try {
      const res = await fetch('/api/marketing');
      const data = await res.json();
      if (data.success) {
        if (data.tags) {
          setTags((prev) => ({ ...prev, ...data.tags }));
        }
        if (data.analytics) {
          setAnalytics(data.analytics);
        }
      }
    } catch (err) {
      console.error('Failed to fetch marketing data', err);
    }
  };

  const fetchPaymentConfig = async () => {
    try {
      const res = await fetch('/api/payments/config');
      const data = await res.json();
      if (data.success && data.config) {
        setPaymentConfig((prev) => ({
          ...prev,
          razorpayKeyId: data.config.razorpayKeyId || '',
          testKeyId: data.config.testKeyId || prev.testKeyId,
          liveKeyId: data.config.liveKeyId || prev.liveKeyId,
          isEnabled: data.config.isEnabled ?? true,
          testMode: data.config.testMode ?? true,
          businessName: data.config.businessName || "Puffs 'n' Rolls Nashik",
        }));
      }
    } catch (e) {
      console.error('Failed to fetch payment config', e);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [mRes, pRes] = await Promise.all([
          fetch('/api/marketing'),
          fetch('/api/payments/config'),
        ]);
        const mData = await mRes.json();
        const pData = await pRes.json();

        if (mounted && mData.success) {
          if (mData.tags) setTags((prev) => ({ ...prev, ...mData.tags }));
          if (mData.analytics) setAnalytics(mData.analytics);
        }

        if (mounted && pData.success && pData.config) {
          setPaymentConfig((prev) => ({
            ...prev,
            razorpayKeyId: pData.config.razorpayKeyId || '',
            testKeyId: pData.config.testKeyId || prev.testKeyId,
            liveKeyId: pData.config.liveKeyId || prev.liveKeyId,
            isEnabled: pData.config.isEnabled ?? true,
            testMode: pData.config.testMode ?? true,
            businessName: pData.config.businessName || "Puffs 'n' Rolls Nashik",
          }));
        }
      } catch (err) {
        console.error('Failed loading marketing/payment config', err);
      }
    };
    load();
    return () => {
      mounted = false;
    };
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

  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPayment(true);
    setStatusMessage('');
    try {
      const res = await fetch('/api/payments/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentConfig),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage('✓ Payment gateway configuration saved successfully!');
        fetchPaymentConfig();
        setTimeout(() => setStatusMessage(''), 4000);
      } else {
        setStatusMessage(data.error || 'Failed to update payment settings');
      }
    } catch (err) {
      console.error('Failed to save payment config', err);
    } finally {
      setIsSavingPayment(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-stone-100 text-stone-900 border border-stone-200">
              <SlidersHorizontal className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight">
              Marketing &amp; Growth Engine
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Configure Meta &amp; Google ad tracking pixels, manage Razorpay payment gateway credentials, and inspect order attribution
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-stone-200 shadow-2xs">
          <button
            onClick={() => setActiveTab('tags')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'tags'
                ? 'bg-[#1C1917] text-white font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Tracking Pixels &amp; Tags</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-[#1C1917] text-white font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment Gateway</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-[#1C1917] text-white font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Attribution &amp; ROAS</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-medium text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* TAB 1: Tracking Tags & Pixels */}
      {activeTab === 'tags' && (
        <form onSubmit={handleSaveTags} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Meta (Facebook & Instagram) */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600" />
                  <h3 className="text-sm font-serif font-bold text-stone-900">Meta (Facebook &amp; Instagram)</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
                  CAPI Active
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-stone-700 block font-semibold mb-1">
                    Global Meta Pixel ID
                  </label>
                  <input
                    type="text"
                    value={tags.globalMetaPixelId}
                    onChange={(e) => setTags({ ...tags, globalMetaPixelId: e.target.value })}
                    placeholder="e.g. 999888777666555"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs font-mono text-stone-900 focus:outline-none focus:border-stone-500"
                  />
                  <span className="text-[10px] text-stone-500 mt-1 block">
                    Fires standard PageView, ViewContent, AddToCart, InitiateCheckout &amp; Purchase events.
                  </span>
                </div>

                <div>
                  <label className="text-xs text-stone-700 block font-semibold mb-1">
                    Server-Side Conversions API (CAPI) Access Token
                  </label>
                  <input
                    type="password"
                    value={tags.metaCapiAccessToken}
                    onChange={(e) => setTags({ ...tags, metaCapiAccessToken: e.target.value })}
                    placeholder="EAABw..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs font-mono text-stone-900 focus:outline-none focus:border-stone-500"
                  />
                  <span className="text-[10px] text-stone-500 mt-1 block">
                    Bypasses ad blockers by firing server-to-server purchases via Next.js backend.
                  </span>
                </div>
              </div>
            </div>

            {/* Google Ads & GTM */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <h3 className="text-sm font-serif font-bold text-stone-900">Google Ads &amp; GTM</h3>
                </div>
                <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-semibold">
                  Dual Tagging
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-stone-700 block font-semibold mb-1">
                    Google Ads Conversion ID
                  </label>
                  <input
                    type="text"
                    value={tags.globalGoogleAdsId}
                    onChange={(e) => setTags({ ...tags, globalGoogleAdsId: e.target.value })}
                    placeholder="AW-987654300"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs font-mono text-stone-900 focus:outline-none focus:border-stone-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-stone-700 block font-semibold mb-1">
                    Google Tag Manager Container ID
                  </label>
                  <input
                    type="text"
                    value={tags.globalGtmId}
                    onChange={(e) => setTags({ ...tags, globalGtmId: e.target.value })}
                    placeholder="GTM-PNR2026"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs font-mono text-stone-900 focus:outline-none focus:border-stone-500"
                  />
                </div>
              </div>
            </div>

            {/* TikTok & Snapchat */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500" />
                <h3 className="text-sm font-serif font-bold text-stone-900">TikTok &amp; Snapchat Ad Pixels</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-stone-700 block font-semibold mb-1">
                    TikTok Pixel ID
                  </label>
                  <input
                    type="text"
                    value={tags.tiktokPixelId}
                    onChange={(e) => setTags({ ...tags, tiktokPixelId: e.target.value })}
                    placeholder="e.g. C1234567890ABCD"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs font-mono text-stone-900 focus:outline-none focus:border-stone-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-stone-700 block font-semibold mb-1">
                    Snapchat Pixel ID
                  </label>
                  <input
                    type="text"
                    value={tags.snapchatPixelId}
                    onChange={(e) => setTags({ ...tags, snapchatPixelId: e.target.value })}
                    placeholder="e.g. 1a2b3c4d-5e6f-7g8h"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs font-mono text-stone-900 focus:outline-none focus:border-stone-500"
                  />
                </div>
              </div>
            </div>

            {/* Custom Scripts */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-600" />
                <h3 className="text-sm font-serif font-bold text-stone-900">Custom Header / Body Scripts</h3>
              </div>

              <div>
                <label className="text-xs text-stone-700 block font-semibold mb-1">
                  Custom Analytics &amp; Heatmap Tags (Clarity, Hotjar, Twitter)
                </label>
                <textarea
                  rows={4}
                  value={tags.customHeaderScript}
                  onChange={(e) => setTags({ ...tags, customHeaderScript: e.target.value })}
                  placeholder="<!-- Paste your custom tracking script here -->"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs font-mono text-stone-800 focus:outline-none focus:border-stone-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-full bg-[#1C1917] hover:bg-stone-800 text-white font-medium text-xs transition flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Tags...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save All Tracking Codes</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Attribution & ROAS Dashboard */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          {/* Funnel High Level Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <span className="text-xs text-stone-400 block font-medium">Campaign GMV</span>
              <span className="text-2xl font-serif font-bold text-stone-900 mt-1 block font-mono">
                ₹{analytics.reduce((acc, c) => acc + c.grossRevenue, 0).toLocaleString()}
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <span className="text-xs text-stone-400 block font-medium">Orders Generated</span>
              <span className="text-2xl font-serif font-bold text-emerald-800 mt-1 block font-mono">
                {analytics.reduce((acc, c) => acc + c.ordersPlaced, 0)}
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <span className="text-xs text-stone-400 block font-medium">Total Ad Clicks</span>
              <span className="text-2xl font-serif font-bold text-stone-900 mt-1 block font-mono">
                {analytics.reduce((acc, c) => acc + c.clicks, 0).toLocaleString()}
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <span className="text-xs text-stone-400 block font-medium">Blended ROAS</span>
              <span className="text-2xl font-serif font-bold text-stone-900 mt-1 block font-mono">
                4.8x
              </span>
            </div>
          </div>

          {/* Campaign Attribution Table */}
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-sm font-serif font-bold text-stone-900">Campaign Funnel &amp; Tag Attribution</h3>
              <button
                onClick={fetchMarketingData}
                className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Metrics</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] text-stone-500 uppercase font-mono text-[10px] border-b border-stone-100">
                  <tr>
                    <th className="p-3.5">Campaign / Landing Page</th>
                    <th className="p-3.5">Outlet</th>
                    <th className="p-3.5 text-right">Impressions</th>
                    <th className="p-3.5 text-right">Clicks</th>
                    <th className="p-3.5 text-right">CTR</th>
                    <th className="p-3.5 text-right">Orders</th>
                    <th className="p-3.5 text-right">Conv. Rate</th>
                    <th className="p-3.5 text-right">Revenue</th>
                    <th className="p-3.5">Tracking Pixel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {analytics.map((camp) => (
                    <tr key={camp.campaignSlug} className="hover:bg-stone-50/50">
                      <td className="p-3.5 font-medium text-stone-900">
                        <div>
                          <span className="block font-semibold">{camp.title}</span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            /{camp.outletSlug}/{camp.campaignSlug}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-medium">
                          {camp.outletSlug}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono text-stone-600">
                        {camp.impressions.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono text-stone-600">
                        {camp.clicks.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono text-emerald-700 font-medium">
                        {camp.ctr}%
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-stone-900">
                        {camp.ordersPlaced}
                      </td>
                      <td className="p-3.5 text-right font-mono text-stone-900">
                        {camp.conversionRate}%
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-stone-900">
                        ₹{camp.grossRevenue.toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono text-[10px] text-stone-600 bg-stone-50 px-2 py-1 rounded border border-stone-200">
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

      {/* TAB 4: RAZORPAY PAYMENT GATEWAY */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Gateway Status Banner */}
          <div className="p-6 bg-white rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#1C1917] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CreditCard className="w-6 h-6 text-stone-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900">
                      Enterprise Online Payment Gateway
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        paymentConfig.isEnabled
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-stone-100 text-stone-600 border border-stone-200'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      {paymentConfig.testMode ? 'Sandbox / Test Mode' : 'Live Production'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
                    Processes Indian digital payments including UPI (Google Pay, PhonePe, Paytm, BHIM),
                    Mastercard, Visa, RuPay, NetBanking, and mobile wallets with HMAC SHA256 cryptographic verification.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://dashboard.razorpay.com"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-xl transition flex items-center gap-1.5"
                >
                  <span>Merchant Portal</span>
                  <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
                </a>
              </div>
            </div>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSavePaymentConfig} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Environment Toggle Header */}
              <div className="p-6 bg-white rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-stone-800" />
                    <h3 className="text-sm font-serif font-bold text-stone-900">
                      Gateway Credentials &amp; Environment
                    </h3>
                  </div>

                  {/* Mode Pills */}
                  <div className="flex items-center p-1 rounded-full bg-stone-100 border border-stone-200">
                    <button
                      type="button"
                      onClick={() => setPaymentConfig({ ...paymentConfig, testMode: true })}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                        paymentConfig.testMode
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Sandbox Test Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentConfig({ ...paymentConfig, testMode: false })}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                        !paymentConfig.testMode
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Live Production Mode
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-stone-200/80 flex items-center justify-between text-xs">
                  <span className="text-stone-600">Currently Active in Storefront Checkout:</span>
                  <span className="font-mono font-bold text-stone-900">
                    {paymentConfig.testMode
                      ? paymentConfig.testKeyId || paymentConfig.razorpayKeyId || 'rzp_test_pnr_demo'
                      : paymentConfig.liveKeyId || '⚠️ No Live Key Configured (Fallback to Test)'}
                  </span>
                </div>
              </div>

              {/* Test Mode Credentials Card */}
              <div className={`p-6 bg-white rounded-2xl border shadow-2xs space-y-4 transition ${
                paymentConfig.testMode ? 'border-amber-300 ring-2 ring-amber-50' : 'border-stone-200/80 opacity-80'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                      Test / Sandbox
                    </span>
                    <h4 className="text-xs font-bold text-stone-900">Razorpay Test Credentials</h4>
                  </div>
                  {paymentConfig.testMode && (
                    <span className="text-[11px] font-semibold text-amber-700">● Active</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                      Test Key ID (rzp_test_...)
                    </label>
                    <input
                      type="text"
                      value={paymentConfig.testKeyId}
                      onChange={(e) =>
                        setPaymentConfig({ ...paymentConfig, testKeyId: e.target.value })
                      }
                      placeholder="rzp_test_..."
                      className="w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                      Test Key Secret
                    </label>
                    <input
                      type="password"
                      value={paymentConfig.testKeySecret}
                      onChange={(e) =>
                        setPaymentConfig({ ...paymentConfig, testKeySecret: e.target.value })
                      }
                      placeholder="Enter test secret or leave blank"
                      className="w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Test Webhook Secret
                  </label>
                  <input
                    type="password"
                    value={paymentConfig.testWebhookSecret}
                    onChange={(e) =>
                      setPaymentConfig({ ...paymentConfig, testWebhookSecret: e.target.value })
                    }
                    placeholder="Enter test webhook secret"
                    className="w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              {/* Live Mode Credentials Card */}
              <div className={`p-6 bg-white rounded-2xl border shadow-2xs space-y-4 transition ${
                !paymentConfig.testMode ? 'border-emerald-400 ring-2 ring-emerald-50' : 'border-stone-200/80 opacity-80'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      Live Production
                    </span>
                    <h4 className="text-xs font-bold text-stone-900">Razorpay Live Production Credentials</h4>
                  </div>
                  {!paymentConfig.testMode && (
                    <span className="text-[11px] font-semibold text-emerald-700">● Active</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                      Live Key ID (rzp_live_...)
                    </label>
                    <input
                      type="text"
                      value={paymentConfig.liveKeyId}
                      onChange={(e) =>
                        setPaymentConfig({ ...paymentConfig, liveKeyId: e.target.value })
                      }
                      placeholder="rzp_live_..."
                      className="w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                      Live Key Secret
                    </label>
                    <input
                      type="password"
                      value={paymentConfig.liveKeySecret}
                      onChange={(e) =>
                        setPaymentConfig({ ...paymentConfig, liveKeySecret: e.target.value })
                      }
                      placeholder="Enter live production secret"
                      className="w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Live Webhook Secret
                  </label>
                  <input
                    type="password"
                    value={paymentConfig.liveWebhookSecret}
                    onChange={(e) =>
                      setPaymentConfig({ ...paymentConfig, liveWebhookSecret: e.target.value })
                    }
                    placeholder="Enter live webhook secret"
                    className="w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              {/* General & Brand Settings */}
              <div className="p-6 bg-white rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                  <CreditCard className="w-4 h-4 text-stone-800" />
                  <h3 className="text-sm font-serif font-bold text-stone-900">
                    Checkout Display &amp; Branding
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Business Brand Name
                  </label>
                  <input
                    type="text"
                    value={paymentConfig.businessName}
                    onChange={(e) =>
                      setPaymentConfig({ ...paymentConfig, businessName: e.target.value })
                    }
                    placeholder="Puffs 'n' Rolls Nashik"
                    className="w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    Displayed at the top of the Razorpay checkout modal for customers.
                  </p>
                </div>
              </div>

              {/* Webhooks Config */}
              <div className="p-6 bg-white rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                  <ShieldCheck className="w-4 h-4 text-stone-800" />
                  <div>
                    <h3 className="text-sm font-serif font-bold text-stone-900">
                      Webhook Auto-Reconciliation &amp; Fleet Endpoints
                    </h3>
                    <p className="text-[11px] text-stone-400">
                      Production Railway deployment endpoints hosted on shop.puffsnrolls.com
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                      Razorpay Webhook Endpoint (Paste into Razorpay Dashboard)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value="https://shop.puffsnrolls.com/api/payments/razorpay/webhook"
                        className="flex-1 px-3.5 py-2.5 bg-stone-100/70 border border-stone-200 rounded-xl text-xs font-mono text-stone-700 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            'https://shop.puffsnrolls.com/api/payments/razorpay/webhook'
                          );
                          setCopiedWebhookUrl(true);
                          setTimeout(() => setCopiedWebhookUrl(false), 2000);
                        }}
                        className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {copiedWebhookUrl ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-stone-500" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                      Mangwale Logistics Webhook Endpoint (Paste into Mangwale Partner Portal)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value="https://shop.puffsnrolls.com/api/webhooks/mangwale"
                        className="flex-1 px-3.5 py-2.5 bg-stone-100/70 border border-stone-200 rounded-xl text-xs font-mono text-stone-700 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            'https://shop.puffsnrolls.com/api/webhooks/mangwale'
                          );
                          setCopiedMangwaleUrl(true);
                          setTimeout(() => setCopiedMangwaleUrl(false), 2000);
                        }}
                        className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {copiedMangwaleUrl ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-stone-500" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                      Payment Webhook Secret
                    </label>
                    <input
                      type="password"
                      value={paymentConfig.razorpayWebhookSecret}
                      onChange={(e) =>
                        setPaymentConfig({
                          ...paymentConfig,
                          razorpayWebhookSecret: e.target.value,
                        })
                      }
                      placeholder="Webhook secret string configured in payment dashboard"
                      className="w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                    <p className="text-[11px] text-stone-400 mt-1">
                      Verifies incoming webhook transaction signatures.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Side Column: Controls & Actions */}
            <div className="space-y-6">
              <div className="p-6 bg-white rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
                <h3 className="text-sm font-serif font-bold text-stone-900 pb-2 border-b border-stone-100">
                  Gateway Controls
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer">
                    <div>
                      <p className="text-xs font-bold text-stone-900">Enable Online Payments</p>
                      <p className="text-[11px] text-stone-500">
                        Allow customers to pay online at checkout
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={paymentConfig.isEnabled}
                      onChange={(e) =>
                        setPaymentConfig({ ...paymentConfig, isEnabled: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-stone-900 focus:ring-stone-900"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer">
                    <div>
                      <p className="text-xs font-bold text-stone-900">Test / Sandbox Mode</p>
                      <p className="text-[11px] text-stone-500">
                        Simulate transactions with test cards &amp; UPI
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={paymentConfig.testMode}
                      onChange={(e) =>
                        setPaymentConfig({ ...paymentConfig, testMode: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-stone-900 focus:ring-stone-900"
                    />
                  </label>
                </div>

                <div className="pt-3 border-t border-stone-100">
                  <button
                    type="submit"
                    disabled={isSavingPayment}
                    className="w-full py-3 bg-[#1C1917] hover:bg-stone-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {isSavingPayment ? (
                      <span>Saving Gateway Settings...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save Payment Settings</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Security Guarantee Box */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
                <div className="flex items-center gap-1.5 text-stone-800 font-bold text-xs">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Compliance &amp; PCI-DSS</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  All payment transactions occur through PCI-DSS Level 1 compliant bank-grade encrypted infrastructure.
                  No card details or CVVs are ever stored on Puffs &apos;n&apos; Rolls bakery servers.
                </p>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
