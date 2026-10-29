'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { OUTLETS, CAMPAIGNS } from '@/lib/data/mock-data';
import { Order, Campaign, Outlet } from '@/types';
import {
  SlidersHorizontal,
  Store,
  Tag,
  ShoppingBag,
  Bike,
  Activity,
  Save,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Send,
} from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'pixels' | 'orders' | 'mangwale'>('pixels');
  const [outlets, setOutlets] = useState<Outlet[]>(OUTLETS);
  const [campaigns, setCampaigns] = useState<Campaign[]>(CAMPAIGNS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOutletFilter, setSelectedOutletFilter] = useState<string>('all');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Edit states for tracking
  const [editCampaignId, setEditCampaignId] = useState<string | null>(null);
  const [editPixelId, setEditPixelId] = useState<string>('');
  const [editGoogleAdsId, setEditGoogleAdsId] = useState<string>('');

  const fetchOrders = async () => {
    try {
      const url =
        selectedOutletFilter === 'all'
          ? '/api/orders/list'
          : `/api/orders/list?outlet=${selectedOutletFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error('Failed to fetch orders', e);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, [selectedOutletFilter]);

  const handleSavePixel = async (campId: string) => {
    setIsSaving(true);
    setStatusMessage('');
    try {
      const res = await fetch('/api/campaigns/update-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campId,
          metaPixelId: editPixelId,
          googleAdsId: editGoogleAdsId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCampaigns((prev) =>
          prev.map((c) =>
            c.id === campId
              ? { ...c, metaPixelId: editPixelId, googleAdsId: editGoogleAdsId }
              : c
          )
        );
        setStatusMessage('✓ Meta Pixel and Google Ads tracking updated dynamically!');
        setEditCampaignId(null);
      }
    } catch (e) {
      setStatusMessage('Error updating tracking configuration');
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // Mangwale Webhook Simulator
  const handleSimulateMangwaleStatus = async (
    taskId: string,
    eventStatus: 'RIDER_ASSIGNED' | 'PICKED' | 'OUT_FOR_DELIVERY' | 'DELIVERED'
  ) => {
    try {
      const res = await fetch('/api/webhooks/mangwale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          event: eventStatus,
          rider: {
            name: 'Sachin Patil',
            phone: '+91 99221 10099',
            vehicleNo: 'MH 15 EZ 4412',
          },
          estimatedMinutes: eventStatus === 'DELIVERED' ? 0 : 12,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage(`✓ Mangwale delivery updated: ${eventStatus}`);
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredOrders =
    selectedOutletFilter === 'all'
      ? orders
      : orders.filter((o) => o.outletSlug === selectedOutletFilter);

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans">
      {/* Top Admin Header */}
      <header className="bg-stone-900 text-white border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center font-black text-sm">
              P&amp;R
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                <span>Multi-Outlet &amp; Marketing Operations Hub</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                  FOCO Admin
                </span>
              </h1>
              <p className="text-[11px] text-stone-400">
                Performance Ads • Dynamic Pixels • Mangwale Nashik Logistics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1.5 rounded-lg transition"
            >
              ← Back to Storefront
            </Link>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1 w-full">
        {statusMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
              <span>Total Orders</span>
              <ShoppingBag className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-stone-900">{filteredOrders.length}</p>
            <p className="text-[11px] text-stone-400">Across active outlets</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
              <span>Gross Sales</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-stone-900">₹{totalRevenue.toLocaleString()}</p>
            <p className="text-[11px] text-emerald-600 font-medium">100% Direct Outlet Settlement</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
              <span>Active Outlets</span>
              <Store className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-stone-900">3 Outlets</p>
            <p className="text-[11px] text-stone-400">College Rd, Nashik Rd, Indira Nagar</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
              <span>Mangwale Dispatches</span>
              <Bike className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black text-stone-900">
              {filteredOrders.filter((o) => o.mangwale?.taskId).length} Active
            </p>
            <p className="text-[11px] text-stone-400">Nashik Hyperlocal Fleet</p>
          </div>
        </div>

        {/* Tab Switcher & Outlet Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-2.5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('pixels')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'pixels'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Dynamic Meta Pixels &amp; Ads</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Orders &amp; Outlets ({filteredOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('mangwale')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'mangwale'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Mangwale Logistics Simulator</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={selectedOutletFilter}
              onChange={(e) => setSelectedOutletFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-medium text-stone-800 focus:outline-none"
            >
              <option value="all">All 3 Outlets (Brand View)</option>
              {outlets.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.name.replace('Puffs and Rolls - ', '')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TAB 1: DYNAMIC META PIXELS & ADS CONFIGURATION */}
        {activeTab === 'pixels' && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-lg font-black text-stone-900">
                Dynamic Performance Marketing &amp; Meta Pixel Router
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Each campaign landing page dynamically injects its configured Meta Pixel ID and Google Ads conversion tag. You can attach or update Pixel IDs dynamically here.
              </p>
            </div>

            <div className="divide-y divide-stone-100">
              {campaigns.map((camp) => {
                const targetOutlet = outlets.find((o) => o.slug === camp.outletSlug);
                const isEditing = editCampaignId === camp.id;

                return (
                  <div key={camp.id} className="py-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            {camp.badge}
                          </span>
                          <span className="text-xs font-semibold text-stone-500">
                            Outlet: <strong>{targetOutlet?.name.replace('Puffs and Rolls - ', '')}</strong>
                          </span>
                        </div>
                        <h3 className="font-extrabold text-stone-900 text-base mt-1">
                          {camp.title}
                        </h3>
                        <p className="text-xs text-stone-500 font-mono mt-0.5">
                          Destination URL: /{camp.outletSlug}/{camp.slug}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/${camp.outletSlug}/${camp.slug}`}
                          target="_blank"
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <span>Open Landing Page</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        {!isEditing && (
                          <button
                            onClick={() => {
                              setEditCampaignId(camp.id);
                              setEditPixelId(camp.metaPixelId || '');
                              setEditGoogleAdsId(camp.googleAdsId || '');
                            }}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <SlidersHorizontal className="w-3 h-3" />
                            <span>Edit Tags</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tag Editor Form */}
                    {isEditing ? (
                      <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-stone-700 mb-1">
                              Meta Pixel ID (Facebook / Instagram)
                            </label>
                            <input
                              type="text"
                              value={editPixelId}
                              onChange={(e) => setEditPixelId(e.target.value)}
                              placeholder="e.g. 112233445566778"
                              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-stone-700 mb-1">
                              Google Ads Conversion Tag
                            </label>
                            <input
                              type="text"
                              value={editGoogleAdsId}
                              onChange={(e) => setEditGoogleAdsId(e.target.value)}
                              placeholder="e.g. AW-987654321/CR_PURCHASE"
                              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleSavePixel(camp.id)}
                            disabled={isSaving}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition disabled:opacity-60"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{isSaving ? 'Saving...' : 'Apply Live Tracking'}</span>
                          </button>
                          <button
                            onClick={() => setEditCampaignId(null)}
                            className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-semibold rounded-lg transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Active Meta Pixel:</span>
                          <span className="font-mono text-emerald-700 font-bold">
                            {camp.metaPixelId || 'Default Brand Pixel'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Google Ads Conversion ID:</span>
                          <span className="font-mono text-sky-700 font-bold">
                            {camp.googleAdsId || 'None'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: LIVE ORDERS TABLE */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-stone-900">Live Orders &amp; Dispatches</h2>
                <p className="text-xs text-stone-500">
                  Showing orders for {selectedOutletFilter === 'all' ? 'all outlets' : selectedOutletFilter}
                </p>
              </div>
              <button
                onClick={fetchOrders}
                className="p-2 hover:bg-stone-100 rounded-lg text-stone-600 text-xs font-medium flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-3">Order ID</th>
                    <th className="py-3 px-3">Outlet</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Items</th>
                    <th className="py-3 px-3">Total</th>
                    <th className="py-3 px-3">Order Status</th>
                    <th className="py-3 px-3">Mangwale Dispatch</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-stone-50/80">
                      <td className="py-3.5 px-3 font-mono font-bold text-stone-900">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="capitalize font-medium text-amber-800">
                          {ord.outletSlug.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-semibold text-stone-900">{ord.customer.name}</p>
                        <p className="text-stone-400 text-[10px]">{ord.customer.phone}</p>
                      </td>
                      <td className="py-3.5 px-3 text-stone-600">
                        {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-stone-900">
                        ₹{ord.total}
                        <span className="block text-[10px] text-stone-400 font-normal">
                          {ord.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-mono text-emerald-700 font-semibold text-[11px]">
                          {ord.mangwale.taskId || 'Queued'}
                        </p>
                        <p className="text-[10px] text-stone-500">
                          {ord.mangwale.riderName ? `Rider: ${ord.mangwale.riderName}` : 'Assigning'}
                        </p>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <Link
                          href={`/${ord.outletSlug}/order/${ord.id}`}
                          target="_blank"
                          className="text-amber-700 hover:text-amber-900 font-bold hover:underline"
                        >
                          View Track
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MANGWALE LOGISTICS WEBHOOK SIMULATOR */}
        {activeTab === 'mangwale' && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-lg font-black text-stone-900">
                Mangwale Nashik Delivery API Integration Simulator
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Test Mangwale webhook callbacks to verify live state updates across customer order tracking screens and outlet owner panels.
              </p>
            </div>

            <div className="space-y-4">
              {filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-900">
                        {ord.orderNumber}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 font-mono text-stone-700">
                        Task: {ord.mangwale.taskId || 'Not Assigned'}
                      </span>
                      <span className="text-xs font-bold text-emerald-600">
                        Current: {ord.orderStatus}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">
                      Destination: {ord.customer.name} ({ord.customer.area}, Nashik) • ₹{ord.total}
                    </p>
                  </div>

                  {ord.mangwale.taskId ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() =>
                          handleSimulateMangwaleStatus(ord.mangwale.taskId!, 'RIDER_ASSIGNED')
                        }
                        className="px-2.5 py-1 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-lg text-xs font-semibold transition"
                      >
                        1. Assign Rider
                      </button>
                      <button
                        onClick={() =>
                          handleSimulateMangwaleStatus(ord.mangwale.taskId!, 'PICKED')
                        }
                        className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-semibold transition"
                      >
                        2. Picked Up
                      </button>
                      <button
                        onClick={() =>
                          handleSimulateMangwaleStatus(ord.mangwale.taskId!, 'OUT_FOR_DELIVERY')
                        }
                        className="px-2.5 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg text-xs font-semibold transition"
                      >
                        3. In Transit
                      </button>
                      <button
                        onClick={() =>
                          handleSimulateMangwaleStatus(ord.mangwale.taskId!, 'DELIVERED')
                        }
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                      >
                        4. Delivered
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-stone-400 italic">No Task ID</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
