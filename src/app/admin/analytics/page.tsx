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
            Real-time gross merchandise value, outlet order breakdown, hourly trends, and delivery performance
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

      {/* Network Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-xs text-stone-400 block font-medium">Total Network GMV</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-serif font-bold text-stone-900">
              ₹{summary.totalGMV.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-xs text-stone-400 block font-medium">Total Orders Placed</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-serif font-bold text-stone-900">
              {summary.totalOrders}
            </span>
            <span className="text-[10px] text-stone-500 font-mono">
              ({summary.completedOrders} delivered)
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-xs text-stone-400 block font-medium">Average Order Value</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-serif font-bold text-stone-900">
              ₹{summary.avgOrderValue}
            </span>
          </div>
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
                    <span className="text-[10px] text-stone-400 block">Orders</span>
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
