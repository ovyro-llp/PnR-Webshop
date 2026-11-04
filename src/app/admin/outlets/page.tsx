'use client';

import React, { useState, useEffect } from 'react';
import { Outlet, MangwaleOutletConfig } from '@/types';
import {
  Store,
  Plus,
  MapPin,
  Phone,
  Clock,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Power,
  X,
  Compass,
  DollarSign,
  ShoppingBag,
  Truck,
  Key,
  Eye,
  EyeOff,
  Zap,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

export default function AdminOutletsPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);

  // Form Fields (Not pre-filled)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    tagline: '',
    phone: '',
    googleMapsUrl: '',
    address: '',
    area: '',
    city: '',
    pincode: '',
    openingHours: '',
    minOrderAmount: '',
    deliveryTimeEstimate: '',
  });

  // Mangwale Per-Outlet Configuration Fields
  const [mangwaleData, setMangwaleData] = useState<MangwaleOutletConfig>({
    apiKey: '',
    apiSecret: '',
    merchantId: '',
    environment: 'live',
    isEnabled: true,
    webhookSecret: '',
  });
  const [showSecret, setShowSecret] = useState(false);
  const [testResult, setTestResult] = useState<{
    testing: boolean;
    success?: boolean;
    message: string;
    latencyMs?: number;
  }>({
    testing: false,
    message: '',
  });

  const fetchOutlets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/outlets');
      const data = await res.json();
      if (data.success) {
        setOutlets(data.outlets);
      }
    } catch (err) {
      console.error('Failed to fetch outlets', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOutlets();
  }, []);

  const handleOpenAddModal = () => {
    setEditingOutlet(null);
    setFormData({
      name: '',
      slug: '',
      tagline: '',
      phone: '',
      googleMapsUrl: '',
      address: '',
      area: '',
      city: '',
      pincode: '',
      openingHours: '',
      minOrderAmount: '',
      deliveryTimeEstimate: '',
    });
    setMangwaleData({
      apiKey: '',
      apiSecret: '',
      merchantId: '',
      environment: 'live',
      isEnabled: true,
      webhookSecret: '',
    });
    setTestResult({ testing: false, message: '' });
    setShowSecret(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (outlet: Outlet) => {
    setEditingOutlet(outlet);
    setFormData({
      name: outlet.name,
      slug: outlet.slug,
      tagline: outlet.tagline,
      phone: outlet.phone,
      googleMapsUrl:
        outlet.googleMapsUrl ||
        `https://maps.google.com/?q=${encodeURIComponent(outlet.name)}`,
      address: outlet.address,
      area: outlet.area,
      city: outlet.city,
      pincode: outlet.pincode,
      openingHours: outlet.openingHours,
      minOrderAmount: String(outlet.minOrderAmount),
      deliveryTimeEstimate: outlet.deliveryTimeEstimate,
    });

    const existingConfig: MangwaleOutletConfig = outlet.mangwaleConfig || {
      apiKey: '',
      apiSecret: '',
      merchantId: `MNG-PNR-${outlet.slug.toUpperCase()}`,
      environment: 'live',
      isEnabled: true,
      webhookSecret: '',
    };

    setMangwaleData(existingConfig);
    setTestResult({ testing: false, message: '' });
    setShowSecret(false);
    setIsModalOpen(true);
  };

  const handleTestMangwale = async () => {
    if (!mangwaleData.apiKey) {
      setTestResult({
        testing: false,
        success: false,
        message: 'Please enter a Mangwale API Key first',
      });
      return;
    }

    setTestResult({ testing: true, message: 'Pinging Mangwale fleet gateway...' });

    try {
      const res = await fetch('/api/outlets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TEST_MANGWALE_CONNECTION',
          idOrSlug: editingOutlet?.slug,
          outletName: formData.name || 'Outlet',
          mangwaleConfig: mangwaleData,
        }),
      });

      const data = await res.json();
      setTestResult({
        testing: false,
        success: data.success,
        message: data.message || (data.success ? 'Connected successfully' : 'Connection failed'),
        latencyMs: data.latencyMs,
      });
    } catch (err) {
      setTestResult({
        testing: false,
        success: false,
        message: 'Network error communicating with Mangwale gateway',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const slug =
      formData.slug ||
      formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    try {
      if (editingOutlet) {
        // UPDATE existing outlet
        const res = await fetch('/api/outlets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'UPDATE',
            idOrSlug: editingOutlet.slug,
            updates: {
              ...formData,
              minOrderAmount: Number(formData.minOrderAmount) || 149,
              mangwaleConfig: mangwaleData,
            },
          }),
        });

        const data = await res.json();
        if (data.success) {
          setStatusMessage(`✓ Outlet "${formData.name}" & Mangwale API updated!`);
          setIsModalOpen(false);
          fetchOutlets();
          setTimeout(() => setStatusMessage(''), 3500);
        } else {
          alert(data.error || 'Failed to update outlet');
        }
      } else {
        // CREATE new outlet
        const res = await fetch('/api/outlets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'CREATE',
            outletData: {
              ...formData,
              slug,
              minOrderAmount: Number(formData.minOrderAmount) || 149,
              mangwaleConfig: mangwaleData,
            },
          }),
        });

        const data = await res.json();
        if (data.success) {
          setStatusMessage(
            `✓ New outlet "${formData.name}" created with live inventory & Mangwale fleet!`
          );
          setIsModalOpen(false);
          fetchOutlets();
          setTimeout(() => setStatusMessage(''), 3500);
        } else {
          alert(data.error || 'Failed to create outlet');
        }
      }
    } catch (err) {
      console.error('Save outlet error', err);
    }
  };

  const handleDelete = async (outlet: Outlet) => {
    if (
      !confirm(
        `Are you sure you want to permanently remove "${outlet.name}" from P&R?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch('/api/outlets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE',
          idOrSlug: outlet.slug,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOutlets((prev) => prev.filter((o) => o.slug !== outlet.slug));
        setStatusMessage(`✓ Outlet "${outlet.name}" deleted`);
        setTimeout(() => setStatusMessage(''), 3000);
      } else {
        alert(data.error || 'Failed to delete outlet');
      }
    } catch (err) {
      console.error('Delete outlet error', err);
    }
  };

  const handleToggleOpen = async (outlet: Outlet) => {
    const nextState = !outlet.isOpen;
    try {
      const res = await fetch('/api/outlets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE',
          idOrSlug: outlet.slug,
          updates: { isOpen: nextState },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOutlets((prev) =>
          prev.map((o) => (o.slug === outlet.slug ? { ...o, isOpen: nextState } : o))
        );
        setStatusMessage(
          `✓ ${outlet.name} is now ${nextState ? 'Accepting Orders' : 'Paused'}`
        );
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      console.error('Toggle open error', err);
    }
  };

  const filteredOutlets = outlets.filter(
    (o) =>
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.phone.includes(searchQuery)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-stone-100 text-stone-900 border border-stone-200">
              <Store className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight">
              Bakery Outlets &amp; Logistics Directory
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Manage bakery locations, dedicated telephone dispatch lines, and outlet-specific Mangwale API keys
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-full bg-[#1C1917] hover:bg-stone-800 text-white font-medium text-xs transition flex items-center justify-center gap-2 shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Outlet Location</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-medium text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search outlets by name, area, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-stone-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 shadow-2xs"
        />
      </div>

      {/* Outlets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {filteredOutlets.map((outlet) => {
          const cfg = outlet.mangwaleConfig;
          const isMangwaleActive = cfg && cfg.isEnabled && !!cfg.apiKey;

          return (
            <div
              key={outlet.id}
              className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-stone-400 transition shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
            >
              <div className="space-y-3.5">
                {/* Outlet Top Row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-stone-400 block">
                      {outlet.city} Bakery Branch
                    </span>
                    <h3 className="font-serif font-bold text-lg text-stone-900 mt-0.5">
                      {outlet.name.replace("Puffs 'n' Rolls - ", '')}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleToggleOpen(outlet)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider transition shrink-0 flex items-center gap-1 cursor-pointer ${
                      outlet.isOpen
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                    title="Click to toggle status"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        outlet.isOpen ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    />
                    <span>{outlet.isOpen ? 'ONLINE' : 'PAUSED'}</span>
                  </button>
                </div>

                <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                  {outlet.tagline}
                </p>

                {/* Outlet Details */}
                <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-stone-100 space-y-2 text-xs text-stone-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                    <span className="leading-snug text-[11px] text-stone-700">
                      {outlet.address}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 text-[11px]">
                    <div className="flex items-center gap-1.5 text-stone-700">
                      <Phone className="w-3 h-3 text-stone-400" />
                      <a href={`tel:${outlet.phone}`} className="hover:underline font-mono">
                        {outlet.phone}
                      </a>
                    </div>

                    {outlet.googleMapsUrl && (
                      <a
                        href={outlet.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-stone-900 hover:text-amber-700 font-medium transition"
                      >
                        <Compass className="w-3 h-3 text-amber-600" />
                        <span>Google Maps</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>{outlet.openingHours}</span>
                    </div>
                    <span>Min: ₹{outlet.minOrderAmount}</span>
                  </div>
                </div>

                {/* Mangwale Dedicated Outlet API Status Pill */}
                <div className="p-2.5 bg-stone-50/80 rounded-2xl border border-stone-200/80 flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2 truncate">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isMangwaleActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-stone-800">Mangwale API</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-medium uppercase ${
                            isMangwaleActive
                              ? cfg?.environment === 'live'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-sky-100 text-sky-800'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {isMangwaleActive
                            ? cfg?.environment === 'live'
                              ? 'Live'
                              : 'Sandbox'
                            : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 font-mono truncate">
                        {cfg?.apiKey ? `${cfg.apiKey.slice(0, 14)}...` : 'Not configured'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEditModal(outlet)}
                    className="text-[10px] font-semibold text-stone-700 hover:text-stone-950 px-2 py-1 rounded-lg hover:bg-stone-200/60 transition shrink-0 cursor-pointer"
                  >
                    Configure
                  </button>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <a
                  href={`/${outlet.slug}`}
                  target="_blank"
                  className="text-[11px] font-medium text-stone-700 hover:text-stone-950 flex items-center gap-1"
                >
                  <span>View Menu</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(outlet)}
                    className="px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDelete(outlet)}
                    className="p-1.5 rounded-full text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Delete Outlet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Outlet Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-xl p-6 sm:p-7 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-serif font-bold text-stone-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-stone-700" />
                <span>
                  {editingOutlet ? `Edit ${editingOutlet.name}` : 'Add New Outlet Location'}
                </span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-stone-700 block font-semibold mb-1">
                  Outlet Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Puffs 'n' Rolls - Gangapur Road"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none focus:border-stone-500"
                />
              </div>

              {!editingOutlet && (
                <div>
                  <label className="text-stone-700 block font-semibold mb-1">
                    URL Slug * (e.g. /gangapur-road)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="gangapur-road"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 font-mono text-stone-900 focus:outline-none focus:border-stone-500"
                  />
                </div>
              )}

              <div>
                <label className="text-stone-700 block font-semibold mb-1">
                  Tagline / Header Description
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Celebration cakes & fresh bakery puffs"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-700 block font-semibold mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-stone-400" />
                    <span>Dedicated Phone Number *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 94236 39911"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 font-mono text-stone-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-stone-700 block font-semibold mb-1 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-amber-600" />
                    <span>Google Maps Link</span>
                  </label>
                  <input
                    type="url"
                    value={formData.googleMapsUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, googleMapsUrl: e.target.value })
                    }
                    placeholder="https://maps.google.com/?q=..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-stone-700 block font-semibold mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-stone-400" />
                  <span>Physical Address</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Shop No. 12, Near College Road..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-stone-700 block font-semibold mb-1">Area</label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="Gangapur Road"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-stone-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-stone-700 block font-semibold mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-stone-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-stone-700 block font-semibold mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-stone-700 block font-semibold mb-1">Hours</label>
                  <input
                    type="text"
                    value={formData.openingHours}
                    onChange={(e) =>
                      setFormData({ ...formData, openingHours: e.target.value })
                    }
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-stone-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-stone-700 block font-semibold mb-1">
                    Min Order (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, minOrderAmount: e.target.value })
                    }
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-stone-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-stone-700 block font-semibold mb-1">
                    Delivery Time
                  </label>
                  <input
                    type="text"
                    value={formData.deliveryTimeEstimate}
                    onChange={(e) =>
                      setFormData({ ...formData, deliveryTimeEstimate: e.target.value })
                    }
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* =========================================================================
                  MANGWALE LOGISTICS PER-OUTLET CREDENTIALS SECTION
                 ========================================================================= */}
              <div className="mt-5 pt-4 border-t border-stone-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <Truck className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-semibold text-stone-900 text-xs">
                        Mangwale Logistics Integration
                      </h4>
                      <p className="text-[10px] text-stone-500">
                        Outlet-specific API key &amp; secret for direct Nashik parcel dispatch
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[10px] font-medium text-stone-600">
                      {mangwaleData.isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <input
                      type="checkbox"
                      checked={mangwaleData.isEnabled}
                      onChange={(e) =>
                        setMangwaleData({ ...mangwaleData, isEnabled: e.target.checked })
                      }
                      className="w-4 h-4 accent-stone-900 rounded cursor-pointer"
                    />
                  </label>
                </div>

                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-stone-700 block font-semibold mb-1">
                        Environment
                      </label>
                      <select
                        value={mangwaleData.environment}
                        onChange={(e) =>
                          setMangwaleData({
                            ...mangwaleData,
                            environment: e.target.value as 'live' | 'sandbox' | 'test',
                          })
                        }
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
                      >
                        <option value="test">Test (Sandbox / mw_test_)</option>
                        <option value="live">Live (Production Fleet / mw_live_)</option>
                        <option value="sandbox">Sandbox (Staging)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-stone-700 block font-semibold mb-1">
                        Merchant / Store ID
                      </label>
                      <input
                        type="text"
                        value={mangwaleData.merchantId || ''}
                        onChange={(e) =>
                          setMangwaleData({
                            ...mangwaleData,
                            merchantId: e.target.value,
                          })
                        }
                        placeholder="e.g. MNG-MKT-CR-01"
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 font-mono text-stone-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-stone-700 block font-semibold mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Key className="w-3 h-3 text-stone-400" />
                        <span>Mangwale API Key</span>
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        Prefix: mw_live_ or mw_test_
                      </span>
                    </label>
                    <input
                      type="text"
                      value={mangwaleData.apiKey}
                      onChange={(e) =>
                        setMangwaleData({ ...mangwaleData, apiKey: e.target.value })
                      }
                      placeholder="mw_live_outlet_..."
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 font-mono text-stone-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-stone-700 block font-semibold mb-1 flex items-center justify-between">
                      <span>Mangwale API Secret</span>
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="text-[10px] text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                      >
                        {showSecret ? (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Hide</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Reveal</span>
                          </>
                        )}
                      </button>
                    </label>
                    <input
                      type={showSecret ? 'text' : 'password'}
                      value={mangwaleData.apiSecret}
                      onChange={(e) =>
                        setMangwaleData({ ...mangwaleData, apiSecret: e.target.value })
                      }
                      placeholder="sk_live_secret_..."
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 font-mono text-stone-900 focus:outline-none"
                    />
                  </div>

                  {/* Ping / Test Connection Button */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-stone-200/60">
                    <button
                      type="button"
                      disabled={testResult.testing}
                      onClick={handleTestMangwale}
                      className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-800 text-[11px] font-semibold transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {testResult.testing ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin text-stone-500" />
                          <span>Pinging Gateway...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3 h-3 text-amber-600" />
                          <span>Test Mangwale Connection</span>
                        </>
                      )}
                    </button>

                    {testResult.message && (
                      <div
                        className={`text-[10px] font-medium flex items-center gap-1 px-2.5 py-1 rounded-lg ${
                          testResult.success
                            ? 'bg-emerald-100/70 text-emerald-900'
                            : 'bg-rose-100/70 text-rose-900'
                        }`}
                      >
                        {testResult.success ? (
                          <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-700" />
                        ) : (
                          <ShieldAlert className="w-3 h-3 shrink-0 text-rose-700" />
                        )}
                        <span className="truncate">{testResult.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#1C1917] hover:bg-stone-800 text-white font-medium cursor-pointer"
                >
                  {editingOutlet ? 'Save Changes' : 'Create Outlet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
