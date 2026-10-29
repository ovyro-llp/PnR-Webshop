'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { OUTLETS, CAMPAIGNS } from '@/lib/data/mock-data';
import { Order, Campaign, Outlet } from '@/types';
import {
  ShoppingBag,
  Store,
  DollarSign,
  Truck,
  Filter,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Clock,
  Phone,
  MapPin,
  Send,
  Eye,
} from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'dispatch'>('orders');
  const [outlets, setOutlets] = useState<Outlet[]>(OUTLETS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOutletFilter, setSelectedOutletFilter] = useState<string>('all');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [selectedOutletFilter]);

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
        setStatusMessage(`✓ Delivery fleet status updated: ${eventStatus.replace(/_/g, ' ')}`);
        fetchOrders();
        setTimeout(() => setStatusMessage(''), 3500);
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

  const getStatusBadge = (status: Order['orderStatus']) => {
    switch (status) {
      case 'RECEIVED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">Received</span>;
      case 'PREPARING':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">Baking Fresh</span>;
      case 'DISPATCHED':
      case 'OUT_FOR_DELIVERY':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200">Out for Delivery</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">Delivered</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-stone-100 text-stone-700">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-stone-100 text-stone-900 border border-stone-200">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight">
              Live Orders &amp; Dispatch Fleet
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Real-time customer bakery orders, FOCO settlements, and white-labeled delivery tracking
          </p>
        </div>

        {/* Outlet Filter & Refresh */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-stone-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={selectedOutletFilter}
              onChange={(e) => setSelectedOutletFilter(e.target.value)}
              className="bg-transparent text-stone-800 font-medium focus:outline-none"
            >
              <option value="all">All Outlets (HQ View)</option>
              {outlets.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.name.replace("Puffs 'n' Rolls - ", '')}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchOrders}
            className="p-2 bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 rounded-full transition shadow-2xs"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Metric Cards - Minimalist Cream & Stone */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-1">
          <span className="text-xs text-stone-400 block font-medium">Total Orders</span>
          <span className="text-2xl font-serif font-bold text-stone-900 block mt-1">
            {filteredOrders.length}
          </span>
          <span className="text-[11px] text-stone-500">Across Nashik outlets</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-1">
          <span className="text-xs text-stone-400 block font-medium">Gross Revenue</span>
          <span className="text-2xl font-serif font-bold text-stone-900 block mt-1">
            ₹{totalRevenue.toLocaleString()}
          </span>
          <span className="text-[11px] text-emerald-700 font-medium">FOCO Settlements</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-1">
          <span className="text-xs text-stone-400 block font-medium">Active Outlets</span>
          <span className="text-2xl font-serif font-bold text-stone-900 block mt-1">
            {outlets.length} Outlets
          </span>
          <span className="text-[11px] text-stone-500">College Rd, Nashik Rd, Indira Nagar</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-1">
          <span className="text-xs text-stone-400 block font-medium">Fleet In Transit</span>
          <span className="text-2xl font-serif font-bold text-stone-900 block mt-1">
            {filteredOrders.filter((o) => o.mangwale?.taskId && o.orderStatus !== 'DELIVERED').length} Active
          </span>
          <span className="text-[11px] text-stone-500">Express Fleet Turnaround</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-xs font-semibold transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Customer Orders ({filteredOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('dispatch')}
          className={`pb-3 text-xs font-semibold transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'dispatch'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Delivery Fleet Simulator</span>
        </button>
      </div>

      {/* Orders List */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-2">
              <ShoppingBag className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-sm font-serif font-semibold text-stone-700">No orders placed yet</p>
              <p className="text-xs text-stone-400">Incoming orders will appear here automatically.</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const outlet = outlets.find((o) => o.slug === order.outletSlug);

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 space-y-4 hover:border-stone-400 transition shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-serif font-bold text-base text-stone-900">
                        {order.orderNumber}
                      </span>
                      {getStatusBadge(order.orderStatus)}
                      <span className="text-[11px] text-stone-400 font-mono">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900 font-mono">
                        ₹{order.total} ({order.paymentMethod})
                      </span>
                      <Link
                        href={`/${order.outletSlug}/order/${order.id}`}
                        target="_blank"
                        className="px-3 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium flex items-center gap-1 transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Track</span>
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Customer */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-stone-400 block">
                        Customer &amp; Destination
                      </span>
                      <p className="font-semibold text-stone-900">{order.customer.name}</p>
                      <p className="text-stone-600 font-mono text-[11px]">{order.customer.phone}</p>
                      <p className="text-stone-500 text-[11px] leading-relaxed line-clamp-2">
                        {order.customer.address}, {order.customer.area}
                      </p>
                    </div>

                    {/* Items */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-stone-400 block">
                        Items Ordered
                      </span>
                      <div className="space-y-1">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-stone-700">
                            <span>
                              {it.quantity}x {it.name}
                            </span>
                            <span className="font-mono text-stone-900">₹{it.total}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Outlet & Logistics */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-stone-400 block">
                        Bakery Fulfillment
                      </span>
                      <p className="font-semibold text-stone-900">
                        {outlet?.name.replace("Puffs 'n' Rolls - ", '')}
                      </p>
                      <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-stone-100 space-y-1 text-[11px]">
                        <div className="flex justify-between text-stone-600">
                          <span>Fleet Status:</span>
                          <span className="font-semibold text-stone-900">
                            {order.mangwale?.status || 'PENDING'}
                          </span>
                        </div>
                        {order.mangwale?.riderName && (
                          <div className="flex justify-between text-stone-600">
                            <span>Rider:</span>
                            <span className="text-stone-900">{order.mangwale.riderName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Delivery Fleet Simulator */}
      {activeTab === 'dispatch' && (
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 space-y-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div>
            <h2 className="text-base font-serif font-bold text-stone-900">
              White-Label Delivery Fleet Webhook Simulator
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Simulate real-time logistics events (rider assignment, pickup, out-for-delivery, and completed delivery) to test live customer tracking.
            </p>
          </div>

          <div className="divide-y divide-stone-100">
            {filteredOrders.map((order) => {
              const taskId = order.mangwale?.taskId || `task-${order.id}`;

              return (
                <div key={order.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-stone-900 text-sm">
                        {order.orderNumber}
                      </span>
                      <span className="text-xs font-medium text-stone-600">
                        ({order.customer.name})
                      </span>
                      {getStatusBadge(order.orderStatus)}
                    </div>
                    <span className="text-[11px] text-stone-400 font-mono mt-0.5 block">
                      Task ID: {taskId}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => handleSimulateStatus(taskId, 'RIDER_ASSIGNED')}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-medium rounded-full transition"
                    >
                      Assign Rider
                    </button>
                    <button
                      onClick={() => handleSimulateStatus(taskId, 'PICKED')}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-medium rounded-full transition"
                    >
                      Picked Up
                    </button>
                    <button
                      onClick={() => handleSimulateStatus(taskId, 'OUT_FOR_DELIVERY')}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[11px] font-medium rounded-full transition"
                    >
                      Out for Delivery
                    </button>
                    <button
                      onClick={() => handleSimulateStatus(taskId, 'DELIVERED')}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-medium rounded-full transition"
                    >
                      Delivered
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
