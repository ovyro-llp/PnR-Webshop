'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { OutletAnalytics, CampaignAnalytics, Outlet } from '@/types';
import { OUTLETS } from '@/lib/data/mock-data';
import { OutletSelector } from '@/components/admin/OutletSelector';
import {
  BarChart3,
  TrendingUp,
  Store,
  DollarSign,
  ShoppingBag,
  Clock,
  Sparkles,
  ArrowUpRight,
  Truck,
  RefreshCw,
  UserX,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Phone,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export default function AnalyticsDashboardPage() {
  const { user } = useAuth();
  const adminUser = user && user.role === 'ADMIN' ? user : null;
  const isOutletManager = Boolean(
    adminUser?.outletAccess && !adminUser.outletAccess.includes('all')
  );

  const [analyticsData, setAnalyticsData] = useState<{
    summary?: {
      totalGMV: number;
      totalOrders: number;
      avgOrderValue: number;
      completedOrders: number;
      fulfillmentSlaRate: number | null;
    };
    funnel?: {
      totalAttempts: number;
      paidOrdersCount: number;
      abandonedCount: number;
      conversionRate: number;
      dropoffRate: number;
      abandonedRevenue: number;
    };
    abandonedCheckouts?: Array<{
      id: string;
      orderNumber: string;
      createdAt: string;
      outletSlug: string;
      customerName: string;
      customerPhone: string;
      cleanPhone: string;
      address: string;
      area: string;
      items: Array<{ name: string; quantity: number; total: number }>;
      total: number;
      whatsappUrl: string | null;
    }>;
    hourlyDistribution?: {
      time: string;
      orders: number;
      revenue: number;
      pct: number;
    }[];
    fleetMetrics?: {
      avgPrepMinutes: number | null;
      avgTransitMinutes: number | null;
      hasDeliveries: boolean;
    };
    outlets?: OutletAnalytics[];
    campaigns?: CampaignAnalytics[];
  }>({});
  const [outlets, setOutlets] = useState<Outlet[]>(OUTLETS);
  const [selectedOutlet, setSelectedOutlet] = useState<string>(
    adminUser?.outletAccess && !adminUser.outletAccess.includes('all') ? adminUser.outletAccess[0] : 'all'
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOutletManager && adminUser?.outletAccess?.[0]) {
      setSelectedOutlet(adminUser.outletAccess[0]);
    }
  }, [isOutletManager, adminUser]);

  const fetchOutlets = async () => {
    try {
      const res = await fetch('/api/outlets');
      const data = await res.json();
      if (data.success && data.outlets) {
        setOutlets(data.outlets);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/analytics?outlet=${selectedOutlet}`);
      const data = await res.json();
      if (data.success) {
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOutlets();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedOutlet]);

  const summary = analyticsData.summary || {
    totalGMV: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    completedOrders: 0,
    fulfillmentSlaRate: null,
  };

  const funnel = analyticsData.funnel || {
    totalAttempts: 0,
    paidOrdersCount: 0,
    abandonedCount: 0,
    conversionRate: 100,
    dropoffRate: 0,
    abandonedRevenue: 0,
  };

  const abandonedCheckouts = analyticsData.abandonedCheckouts || [];
  const outletList = analyticsData.outlets || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-stone-100 text-stone-900 border border-stone-200">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight">
              Store &amp; Outlet Analytics
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Real-time gross merchandise value, checkout conversions, cart abandonment recovery, and delivery turnaround
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Outlet selector dropdown or locked kitchen badge */}
          {isOutletManager ? (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-full text-xs font-semibold text-amber-900 shadow-2xs">
              <Store className="w-3.5 h-3.5 text-amber-700" />
              <span>{outlets.find((o) => o.slug === selectedOutlet)?.name.replace("Puffs 'n' Rolls - ", '') || 'Your Outlet'}</span>
            </div>
          ) : (
            <OutletSelector
              outlets={outlets}
              selectedOutlet={selectedOutlet}
              onSelectOutlet={(slug) => setSelectedOutlet(slug)}
              includeAll={true}
              allLabel="All Outlets (HQ)"
              label="Filter Scope:"
              size="sm"
            />
          )}

          <button
            onClick={fetchAnalytics}
            className="p-2 bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 rounded-full transition shadow-2xs cursor-pointer"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Confirmed Orders Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-xs text-stone-400 block font-medium">Captured Gross Revenue</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-serif font-bold text-stone-900">
              ₹{summary.totalGMV.toLocaleString()}
            </span>
          </div>
          <span className="text-[11px] text-emerald-700 font-medium">100% Verified Payments</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-xs text-stone-400 block font-medium">Paid Orders Placed</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-serif font-bold text-stone-900">
              {summary.totalOrders}
            </span>
            <span className="text-[10px] text-stone-500 font-mono">
              ({summary.completedOrders} delivered)
            </span>
          </div>
          <span className="text-[11px] text-stone-500">Excludes cancelled attempts</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-xs text-stone-400 block font-medium">Average Order Value</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-serif font-bold text-stone-900">
              ₹{summary.avgOrderValue}
            </span>
          </div>
          <span className="text-[11px] text-stone-500">Per settled transaction</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-xs text-stone-400 block font-medium">Fulfillment SLA Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-serif font-bold text-stone-900">
              {summary.totalOrders > 0 && summary.fulfillmentSlaRate !== null
                ? `${summary.fulfillmentSlaRate}%`
                : '—'}
            </span>
            <span className="text-[10px] text-stone-500 font-medium">
              {summary.totalOrders > 0 ? 'Live Deliveries' : 'No orders yet'}
            </span>
          </div>
          <span className="text-[11px] text-stone-500">On-time doorstep arrival</span>
        </div>
      </div>

      {/* =========================================================================
          CHECKOUT CONVERSION FUNNEL & CART ABANDONMENT INTELLIGENCE
         ========================================================================= */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-6 space-y-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-base font-serif font-bold text-stone-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-700" />
              <span>Checkout Conversion Funnel &amp; Cart Abandonment</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Customers who initiated checkout, completed payments vs. dropped off, and 1-click cart recovery
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/70 self-start sm:self-auto">
            {funnel.conversionRate}% Conversion Rate
          </span>
        </div>

        {/* Funnel 4-Card Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-stone-50/70 rounded-2xl border border-stone-200/80 space-y-1">
            <span className="text-[11px] text-stone-500 block font-medium">Total Checkout Attempts</span>
            <span className="text-2xl font-serif font-bold text-stone-900 block mt-1 font-mono">
              {funnel.totalAttempts}
            </span>
            <span className="text-[10px] text-stone-400">Initiated payment sessions</span>
          </div>

          <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-emerald-800 block font-medium">Paid &amp; Captured</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {funnel.conversionRate}%
              </span>
            </div>
            <span className="text-2xl font-serif font-bold text-emerald-950 block mt-1 font-mono">
              {funnel.paidOrdersCount}
            </span>
            <span className="text-[10px] text-emerald-700">Orders verified &amp; dispatched</span>
          </div>

          <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-200/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-amber-900 block font-medium">Abandoned / Cancelled</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                {funnel.dropoffRate}%
              </span>
            </div>
            <span className="text-2xl font-serif font-bold text-amber-950 block mt-1 font-mono">
              {funnel.abandonedCount}
            </span>
            <span className="text-[10px] text-amber-800">Exited or cancelled in gateway</span>
          </div>

          <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-200/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-indigo-900 block font-medium">Recoverable Revenue</span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <span className="text-2xl font-serif font-bold text-indigo-950 block mt-1 font-mono">
              ₹{funnel.abandonedRevenue.toLocaleString()}
            </span>
            <span className="text-[10px] text-indigo-700">Unrealized bakery basket value</span>
          </div>
        </div>

        {/* Abandoned Cart Recovery Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-serif font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <UserX className="w-3.5 h-3.5 text-stone-500" />
              <span>Incomplete Checkout Recovery ({abandonedCheckouts.length})</span>
            </h3>
            <span className="text-[11px] text-stone-400">
              Direct customer reach-out via WhatsApp
            </span>
          </div>

          {abandonedCheckouts.length === 0 ? (
            <div className="p-6 bg-stone-50/60 rounded-2xl border border-stone-200/60 text-center space-y-1.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <p className="text-xs font-serif font-semibold text-stone-800">
                Zero Abandoned Checkouts Recorded
              </p>
              <p className="text-[11px] text-stone-400 max-w-md mx-auto">
                All customers who initiated a checkout session completed their payment successfully. Any future uncompleted or cancelled payment attempts will appear here for 1-click WhatsApp recovery.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-stone-200">
              <table className="w-full text-left text-xs divide-y divide-stone-200">
                <thead className="bg-[#FAF8F5] text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Order # &amp; Time</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Outlet</th>
                    <th className="px-4 py-3">Items in Cart</th>
                    <th className="px-4 py-3 text-right">Value</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Recovery Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {abandonedCheckouts.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/60 transition">
                      <td className="px-4 py-3.5 font-mono text-[11px] text-stone-900">
                        <div className="font-bold">{item.orderNumber}</div>
                        <div className="text-[10px] text-stone-400 font-sans mt-0.5">
                          {new Date(item.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-stone-900">{item.customerName}</div>
                        <div className="text-[11px] font-mono text-stone-500 mt-0.5">
                          {item.customerPhone}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-stone-600 font-medium capitalize">
                        {item.outletSlug.replace(/-/g, ' ')}
                      </td>
                      <td className="px-4 py-3.5 text-stone-600 max-w-xs">
                        <div className="space-y-0.5 line-clamp-2">
                          {item.items.map((it, idx) => (
                            <span key={idx} className="inline-block mr-1.5 text-[11px]">
                              {it.quantity}x {it.name}
                              {idx < item.items.length - 1 ? ',' : ''}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-stone-900">
                        ₹{item.total}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                          Awaiting Payment
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {item.whatsappUrl ? (
                          <a
                            href={item.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition cursor-pointer"
                            title="Send pre-filled cart recovery message on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp Follow-Up</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-stone-400 italic">
                            No phone provided
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Per-Outlet Comparative Performance */}
      <div className="space-y-4">
        <h3 className="text-sm font-serif font-bold text-stone-900 flex items-center gap-2">
          <Store className="w-4 h-4 text-stone-700" />
          <span>Outlet Performance Breakdown</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {outletList.map((outlet) => (
            <div
              key={outlet.outletSlug}
              className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-serif font-bold text-stone-900">
                      {outlet.outletName.replace("Puffs 'n' Rolls - ", '')}
                    </h4>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {outlet.outletSlug.replace('-', ' ').toUpperCase()} Branch
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-mono border border-emerald-200 font-medium">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-stone-100">
                  <div>
                    <span className="text-[10px] text-stone-400 block">Gross Revenue</span>
                    <span className="text-base font-serif font-bold text-stone-900 font-mono">
                      ₹{outlet.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">Paid Orders</span>
                    <span className="text-base font-serif font-bold text-stone-900 font-mono">
                      {outlet.totalOrders}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">AOV</span>
                    <span className="text-xs font-semibold text-stone-700 font-mono">
                      ₹{outlet.averageOrderValue}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">Active Deliveries</span>
                    <span className="text-xs font-semibold text-stone-900 font-mono">
                      {outlet.activeDeliveryCount} in transit
                    </span>
                  </div>
                </div>
              </div>

              {/* Outlet Top Sellers */}
              <div className="pt-3 border-t border-stone-100">
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-stone-400 block mb-2">
                  Top Selling Items
                </span>
                <div className="space-y-1.5">
                  {outlet.topSellingItems && outlet.topSellingItems.length > 0 ? (
                    outlet.topSellingItems.map((item, idx) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between text-xs text-stone-700"
                      >
                        <span className="truncate max-w-[170px]">
                          {idx + 1}. {item.name}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-stone-900">
                          {item.quantity} sold
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-stone-400 py-1">No items sold yet</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hourly Surge & Fleet Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Hourly Rush Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-serif font-bold text-stone-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-stone-700" />
              <span>Hourly Order Distribution (Rush Hours)</span>
            </h3>
            <span className="text-[10px] text-stone-400 font-mono">Live Today</span>
          </div>

          <div className="space-y-3 pt-2">
            {(analyticsData.hourlyDistribution || []).map((slot) => (
              <div key={slot.time} className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-700 font-medium">{slot.time}</span>
                  <span className="font-mono text-stone-900 font-bold">
                    ₹{slot.revenue.toLocaleString()} ({slot.orders} orders)
                  </span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                  <div
                    className="h-full bg-[#1C1917] rounded-full transition-all duration-500"
                    style={{ width: `${slot.pct}%` }}
                  />
                </div>
              </div>
            ))}
            {summary.totalOrders === 0 && (
              <p className="text-xs text-stone-400 text-center py-3">
                No orders recorded yet today. Hourly rush distribution calculates live as orders are placed.
              </p>
            )}
          </div>
        </div>

        {/* White-labeled Logistics & Kitchen Fleet Turnaround */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-serif font-bold text-stone-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-stone-700" />
                <span>Express Doorstep Delivery Fleet Metrics</span>
              </h3>
              <span className="text-[10px] text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200 font-mono font-medium">
                {analyticsData.fleetMetrics?.hasDeliveries ? 'Fleet Active' : 'Awaiting Deliveries'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block">Avg. Kitchen Prep Time</span>
                <span className="text-xl font-serif font-bold text-stone-900 font-mono mt-1 block">
                  {analyticsData.fleetMetrics?.avgPrepMinutes !== null && analyticsData.fleetMetrics?.avgPrepMinutes !== undefined
                    ? `${analyticsData.fleetMetrics.avgPrepMinutes} mins`
                    : '—'}
                </span>
                <span className="text-[10px] text-stone-500 mt-0.5 block">
                  {analyticsData.fleetMetrics?.hasDeliveries ? 'Based on live orders' : 'Awaiting orders'}
                </span>
              </div>

              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block">Avg. Rider Transit Time</span>
                <span className="text-xl font-serif font-bold text-stone-900 font-mono mt-1 block">
                  {analyticsData.fleetMetrics?.avgTransitMinutes !== null && analyticsData.fleetMetrics?.avgTransitMinutes !== undefined
                    ? `${analyticsData.fleetMetrics.avgTransitMinutes} mins`
                    : '—'}
                </span>
                <span className="text-[10px] text-stone-500 mt-0.5 block">
                  {analyticsData.fleetMetrics?.hasDeliveries ? 'Across delivery radius' : 'Awaiting dispatch'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-stone-200 mt-3 text-xs space-y-1">
              <span className="font-serif font-bold text-stone-900 block">White-Label Logistics Guarantee:</span>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                All order dispatch webhooks route to fleet logistics automatically. Customer tracking links display pure Puffs &apos;n&apos; Rolls branding with real-time rider status, vehicle numbers, and estimated delivery minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
