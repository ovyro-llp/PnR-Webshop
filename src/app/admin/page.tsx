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
  Activity,
  Save,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Filter,
  DollarSign,
  Send,
  Truck,
  Plus,
} from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'dispatch' | 'pixels'>('orders');
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

  // Dispatch Webhook Simulator
  const handleSimulateStatus = async (
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
        setStatusMessage(`✓ Logistics status updated: ${eventStatus}`);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {statusMessage && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">{filteredOrders.length}</p>
          <p className="text-[11px] text-slate-500">Across active Nashik outlets</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Gross Sales</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">₹{totalRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-400 font-medium">FOCO Outlet Settlement</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Outlets</span>
            <Store className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white">3 Outlets</p>
          <p className="text-[11px] text-slate-500">College Rd, Nashik Rd, Indira Nagar</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Deliveries</span>
            <Truck className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-white">
            {filteredOrders.filter((o) => o.mangwale?.taskId).length} In Transit
          </p>
          <p className="text-[11px] text-slate-500">Automated Dispatch Fleet</p>
        </div>
      </div>

      {/* Tabs Bar & Outlet Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-2.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('pixels')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'pixels'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Dynamic Meta Pixels &amp; Ad Tags</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Orders &amp; Outlets ({filteredOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('dispatch')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'dispatch'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Delivery API Operations</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedOutletFilter}
            onChange={(e) => setSelectedOutletFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none"
          >
            <option value="all">All 3 Outlets (Brand HQ View)</option>
            {outlets.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.name.replace("Puffs 'n' Rolls - ", '')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB 1: DYNAMIC PIXELS */}
      {activeTab === 'pixels' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">
              Dynamic Performance Marketing &amp; Meta Pixel Router
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Every outlet campaign page automatically injects its configured Meta Pixel ID and Google Ads conversion tag. You can attach, replace, or test new pixel IDs dynamically here.
            </p>
          </div>

          <div className="divide-y divide-slate-800">
            {campaigns.map((camp) => {
              const targetOutlet = outlets.find((o) => o.slug === camp.outletSlug);
              const isEditing = editCampaignId === camp.id;

              return (
                <div key={camp.id} className="py-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                          {camp.badge}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          Outlet: <strong>{targetOutlet?.name.replace("Puffs 'n' Rolls - ", '')}</strong>
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-base mt-1">
                        {camp.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Target URL: /{camp.outletSlug}/{camp.slug}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/${camp.outletSlug}/${camp.slug}`}
                        target="_blank"
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <span>Open Ad Page</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      {!isEditing && (
                        <button
                          onClick={() => {
                            setEditCampaignId(camp.id);
                            setEditPixelId(camp.metaPixelId || '');
                            setEditGoogleAdsId(camp.googleAdsId || '');
                          }}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          <span>Attach / Edit Pixels</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">
                            Meta Pixel ID (Facebook / Instagram)
                          </label>
                          <input
                            type="text"
                            value={editPixelId}
                            onChange={(e) => setEditPixelId(e.target.value)}
                            placeholder="e.g. 112233445566778"
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">
                            Google Ads Conversion Tag
                          </label>
                          <input
                            type="text"
                            value={editGoogleAdsId}
                            onChange={(e) => setEditGoogleAdsId(e.target.value)}
                            placeholder="e.g. AW-987654321/CR_PURCHASE"
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleSavePixel(camp.id)}
                          disabled={isSaving}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition disabled:opacity-60"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isSaving ? 'Applying...' : 'Save & Publish Pixel'}</span>
                        </button>
                        <button
                          onClick={() => setEditCampaignId(null)}
                          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Active Meta Pixel:</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {camp.metaPixelId || 'Default Brand Pixel'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Google Ads Conversion ID:</span>
                        <span className="font-mono text-sky-400 font-bold">
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
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Live Orders &amp; Dispatches</h2>
              <p className="text-xs text-slate-400">
                Filtered for: {selectedOutletFilter === 'all' ? 'All Outlets' : selectedOutletFilter}
              </p>
            </div>
            <button
              onClick={fetchOrders}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white text-xs font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Outlet</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Items</th>
                  <th className="py-3 px-3">Total</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Dispatch Task</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/50">
                    <td className="py-3.5 px-3 font-mono font-bold text-white">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="capitalize font-medium text-amber-400">
                        {ord.outletSlug.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-semibold text-white">{ord.customer.name}</p>
                      <p className="text-slate-400 text-[10px]">{ord.customer.phone}</p>
                    </td>
                    <td className="py-3.5 px-3 text-slate-300">
                      {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-white">
                      ₹{ord.total}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {ord.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-amber-300 border border-slate-700">
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-mono text-emerald-400 font-semibold text-[11px]">
                        {ord.mangwale.taskId || 'Queued'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {ord.mangwale.riderName ? `Rider: ${ord.mangwale.riderName}` : 'Assigning'}
                      </p>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <Link
                        href={`/${ord.outletSlug}/order/${ord.id}`}
                        target="_blank"
                        className="text-amber-400 hover:text-amber-300 font-bold hover:underline"
                      >
                        Live Screen
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DISPATCH API TERMINAL */}
      {activeTab === 'dispatch' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">
              Logistics API Integration Terminal
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate or verify live rider status updates from the logistics network.
            </p>
          </div>

          <div className="space-y-4">
            {filteredOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">
                      {ord.orderNumber}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 font-mono text-slate-300">
                      Task: {ord.mangwale.taskId || 'Not Assigned'}
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      Status: {ord.orderStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Destination: {ord.customer.name} ({ord.customer.area}, Nashik) • ₹{ord.total}
                  </p>
                </div>

                {ord.mangwale.taskId ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() =>
                        handleSimulateStatus(ord.mangwale.taskId!, 'RIDER_ASSIGNED')
                      }
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                    >
                      1. Assign Rider
                    </button>
                    <button
                      onClick={() =>
                        handleSimulateStatus(ord.mangwale.taskId!, 'PICKED')
                      }
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                    >
                      2. Picked Up
                    </button>
                    <button
                      onClick={() =>
                        handleSimulateStatus(ord.mangwale.taskId!, 'OUT_FOR_DELIVERY')
                      }
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                    >
                      3. In Transit
                    </button>
                    <button
                      onClick={() =>
                        handleSimulateStatus(ord.mangwale.taskId!, 'DELIVERED')
                      }
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
                    >
                      4. Delivered
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 italic">No Task ID</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
