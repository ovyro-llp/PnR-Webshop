'use client';

import React, { useState, useEffect } from 'react';
import { OutletAnalytics, CampaignAnalytics } from '@/types';
import { OUTLETS } from '@/lib/data/mock-data';
import {
  BarChart3,
  TrendingUp,
  Store,
  DollarSign,
  ShoppingBag,
  Clock,
  Sparkles,
  ArrowUpRight,
  Flame,
  Award,
  Truck,
  RefreshCw,
} from 'lucide-react';

export default function AnalyticsDashboardPage() {
  const [analyticsData, setAnalyticsData] = useState<{
    summary?: {
      totalGMV: number;
      totalOrders: number;
      avgOrderValue: number;
      completedOrders: number;
    };
    outlets?: OutletAnalytics[];
    campaigns?: CampaignAnalytics[];
  }>({});
  const [selectedOutlet, setSelectedOutlet] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
    fetchAnalytics();
  }, [selectedOutlet]);

  const summary = analyticsData.summary || {
    totalGMV: 42850,
    totalOrders: 112,
    avgOrderValue: 382,
    completedOrders: 104,
  };

  const outlets = analyticsData.outlets || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              FOCO Franchise Analytics &amp; Revenue Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time sales, outlet P&amp;L breakdown, hourly peak surges, and delivery efficiency
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Outlet filter pills */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedOutlet('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                selectedOutlet === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Outlets
            </button>
            {OUTLETS.map((o) => (
              <button
                key={o.slug}
                onClick={() => setSelectedOutlet(o.slug)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                  selectedOutlet === o.slug
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {o.name.replace("Puffs 'n' Rolls - ", '')}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalytics}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-xl transition"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Network Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block font-medium">Total Network GMV</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-white font-mono">
              ₹{summary.totalGMV.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +14.2%
            </span>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block font-medium">Total Orders Placed</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-400 font-mono">
              {summary.totalOrders}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({summary.completedOrders} delivered)
            </span>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block font-medium">Average Order Value</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-amber-400 font-mono">
              ₹{summary.avgOrderValue}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +8.5%
            </span>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block font-medium">Fulfillment Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-blue-400 font-mono">
              98.4%
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">
              Fast Dispatch
            </span>
          </div>
        </div>
      </div>

      {/* Per-Outlet Comparative Performance */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Store className="w-4 h-4 text-amber-400" />
          <span>FOCO Outlet Franchise Breakdown</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {outlets.map((outlet) => (
            <div
              key={outlet.outletSlug}
              className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {outlet.outletName.replace("Puffs 'n' Rolls - ", '')}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Nashik FOCO Branch
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Gross Revenue</span>
                    <span className="text-base font-bold text-amber-400 font-mono">
                      ₹{outlet.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Orders</span>
                    <span className="text-base font-bold text-white font-mono">
                      {outlet.totalOrders}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">AOV</span>
                    <span className="text-xs font-bold text-slate-300 font-mono">
                      ₹{outlet.averageOrderValue}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Active Deliveries</span>
                    <span className="text-xs font-bold text-blue-400 font-mono">
                      {outlet.activeDeliveryCount} in transit
                    </span>
                  </div>
                </div>
              </div>

              {/* Outlet Top Sellers */}
              <div className="pt-3 border-t border-slate-800/80">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-2">
                  Top Selling Items
                </span>
                <div className="space-y-1.5">
                  {outlet.topSellingItems.map((item, idx) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-xs text-slate-300"
                    >
                      <span className="truncate max-w-[170px] text-slate-300">
                        {idx + 1}. {item.name}
                      </span>
                      <span className="font-mono text-[11px] text-amber-400">
                        {item.quantity} sold
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hourly Surge & Fleet Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Hourly Rush Distribution */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Hourly Order Distribution (Rush Hours)</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Live Today</span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { time: '11:00 AM - 1:00 PM (Brunch Pastries)', pct: 45, orders: '18 orders', rev: '₹4,890' },
              { time: '1:00 PM - 3:00 PM (Lunch Rolls)', pct: 60, orders: '24 orders', rev: '₹6,420' },
              { time: '4:00 PM - 6:00 PM (Evening Puff Rush)', pct: 95, orders: '42 orders', rev: '₹12,850' },
              { time: '7:00 PM - 9:30 PM (Dinner & Cakes)', pct: 80, orders: '32 orders', rev: '₹18,690' },
            ].map((slot) => (
              <div key={slot.time} className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">{slot.time}</span>
                  <span className="font-mono text-amber-400 font-bold">{slot.rev} ({slot.orders})</span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${slot.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* White-labeled Logistics & Kitchen Fleet Turnaround */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Express Doorstep Delivery Fleet Metrics</span>
              </h3>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                Fleet Automated
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Avg. Kitchen Prep Time</span>
                <span className="text-xl font-bold text-white font-mono mt-1 block">
                  12.4 mins
                </span>
                <span className="text-[10px] text-emerald-400 mt-0.5 block">
                  Well within 18m SLA
                </span>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Avg. Rider Transit Time</span>
                <span className="text-xl font-bold text-white font-mono mt-1 block">
                  18.2 mins
                </span>
                <span className="text-[10px] text-emerald-400 mt-0.5 block">
                  Across Nashik radius
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80 mt-3 text-xs space-y-1">
              <span className="font-bold text-slate-200 block">White-Label Logistics Guarantee:</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                All order dispatch webhooks route to fleet logistics automatically. Customer tracking links display pure Puffs &apos;n&apos; Rolls branding with real-time rider status, vehicle numbers, and estimated delivery minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
