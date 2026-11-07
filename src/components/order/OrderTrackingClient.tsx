'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Order, Outlet } from '@/types';
import {
  CheckCircle2,
  Clock,
  Phone,
  ChefHat,
  PackageCheck,
  ArrowLeft,
  Truck,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  MapPin,
} from 'lucide-react';

interface OrderTrackingClientProps {
  initialOrder: Order;
  outlet?: Outlet;
  outletSlug: string;
}

export function OrderTrackingClient({
  initialOrder,
  outlet,
  outletSlug,
}: OrderTrackingClientProps) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [copiedLink, setCopiedLink] = useState(false);

  const cleanCustomerPhone = order.customer?.phone
    ? order.customer.phone.replace(/[^0-9]/g, '').slice(-10)
    : '';

  const trackingUrl =
    order.mangwale?.trackingUrl ||
    (order.mangwale?.taskId && cleanCustomerPhone
      ? `https://track.mangwale.com/track/${encodeURIComponent(order.mangwale.taskId)}/${cleanCustomerPhone}`
      : null);

  const copyTrackingLink = async () => {
    if (!trackingUrl) return;
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.warn('Failed to copy tracking link', err);
    }
  };

  const pollOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${initialOrder.id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.warn('Live order polling error:', e);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await pollOrder();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    // If order is completed or cancelled, do not poll continuously
    if (order.orderStatus === 'DELIVERED' || order.orderStatus === 'CANCELLED') {
      return;
    }

    const interval = setInterval(() => {
      pollOrder();
    }, 4000);

    return () => clearInterval(interval);
  }, [initialOrder.id, order.orderStatus]);

  const isAwaitingPayment =
    order.orderStatus === 'AWAITING_PAYMENT' || order.paymentStatus === 'PENDING';

  const steps = [
    {
      label: 'Order Received',
      desc: isAwaitingPayment ? 'Awaiting payment confirmation' : 'Sent to bakery kitchen',
      icon: ChefHat,
      completed: !isAwaitingPayment,
      active: !isAwaitingPayment && order.orderStatus === 'RECEIVED',
    },
    {
      label: 'Baking Fresh',
      desc: 'In the bakery oven',
      icon: Clock,
      completed: ['PREPARING', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(
        order.orderStatus
      ),
      active: order.orderStatus === 'PREPARING',
    },
    {
      label: 'Express Dispatch',
      desc: order.mangwale?.riderName
        ? `Rider: ${order.mangwale.riderName}`
        : order.mangwale?.taskId
        ? 'Dispatched to Mangwale'
        : 'Awaiting dispatch',
      icon: Truck,
      completed: ['DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus),
      active: ['DISPATCHED', 'OUT_FOR_DELIVERY'].includes(order.orderStatus),
    },
    {
      label: 'Delivered',
      desc: 'At your doorstep',
      icon: PackageCheck,
      completed: order.orderStatus === 'DELIVERED',
      active: order.orderStatus === 'DELIVERED',
    },
  ];

  const getStatusDisplay = (status: Order['orderStatus']) => {
    if (isAwaitingPayment) return 'Awaiting Payment Confirmation';
    switch (status) {
      case 'RECEIVED':
        return 'Order Received by Kitchen';
      case 'PREPARING':
        return 'Baking Fresh in Oven';
      case 'DISPATCHED':
        return 'Ready & Handed to Delivery Fleet';
      case 'OUT_FOR_DELIVERY':
        return 'Out for Delivery';
      case 'DELIVERED':
        return 'Delivered at Doorstep';
      case 'CANCELLED':
        return 'Order Cancelled';
      default:
        return status.replace(/_/g, ' ');
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 flex-1 w-full">
      {/* Order Status Box */}
      {isAwaitingPayment ? (
        <div className="bg-amber-50/80 rounded-3xl p-6 sm:p-10 border border-amber-200/80 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 bg-amber-100 text-amber-900 rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6 text-amber-700" />
          </div>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-amber-800">
            Payment Incomplete • {order.orderNumber}
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
            Awaiting Payment Confirmation
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            Payment for this order has not been completed. If you closed or cancelled the payment window, please return to the bakery menu to complete your order.
          </p>
          <div className="pt-2">
            <Link
              href={`/${outletSlug}`}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1C1917] hover:bg-stone-800 text-white rounded-full text-xs font-semibold shadow-xs transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Bakery Menu</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/80 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 bg-stone-100 text-stone-900 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-400">
            Order Confirmed • {order.orderNumber}
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
            Thank You, {order.customer.name}
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            Your fresh bakery order has been placed with <strong>{outlet?.name || "Puffs 'n' Rolls"}</strong>. Our ovens are hot and preparing your items.
          </p>
        </div>
      )}

      {/* Live Delivery Status Box */}
      <div className="bg-[#FAF8F5] border border-stone-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1C1917] text-white flex items-center justify-center">
              <Truck className="w-5 h-5 text-stone-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-400">
                  Live Fulfillment Tracker
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <h3 className="text-base font-serif font-bold text-stone-900">
                {getStatusDisplay(order.orderStatus)}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-200/80 text-stone-800">
              ETA: ~{order.mangwale?.estimatedDeliveryMinutes || (order.orderStatus === 'DELIVERED' ? 0 : 25)} Mins
            </span>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title="Refresh tracking status"
              className="p-1.5 rounded-full bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stepper Timeline */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {steps.map((st, i) => {
            const Icon = st.icon;
            return (
              <div
                key={i}
                className={`p-3.5 rounded-2xl border transition ${
                  st.active
                    ? 'bg-white border-amber-400 text-stone-900 shadow-xs ring-2 ring-amber-100'
                    : st.completed
                    ? 'bg-white border-stone-300 text-stone-900 shadow-xs'
                    : 'bg-stone-50 border-stone-200 text-stone-400'
                }`}
              >
                <Icon
                  className={`w-4 h-4 mb-1.5 ${
                    st.active
                      ? 'text-amber-600'
                      : st.completed
                      ? 'text-stone-900'
                      : 'text-stone-400'
                  }`}
                />
                <p className="text-xs font-bold leading-none">{st.label}</p>
                <p className="text-[10px] text-stone-500 mt-1 line-clamp-1">{st.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Prominent Mangwale Live Map Tracking Section */}
        {trackingUrl ? (
          <div className="bg-stone-900 text-white rounded-3xl p-5 sm:p-7 space-y-4 shadow-sm border border-stone-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400">
                      Live GPS Tracking
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <h4 className="text-base sm:text-lg font-serif font-bold text-white">
                    Track Your Delivery on Mangwale Map
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer shrink-0"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Open Live Map</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Real-time driver location and delivery ETA powered by <strong>Mangwale Express Logistics</strong>.
            </p>

            <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 font-mono text-[11px] text-stone-400 truncate">
                <span className="shrink-0 text-stone-500">Live URL:</span>
                <span className="text-stone-300 truncate font-sans text-xs">{trackingUrl}</span>
              </div>
              <button
                onClick={copyTrackingLink}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer self-start sm:self-auto border border-stone-700"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>

            {/* Rider & Task Details */}
            <div className="pt-3 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                {order.mangwale?.taskId && (
                  <p className="text-[11px] font-mono text-stone-400">
                    Task ID: <strong className="text-white">{order.mangwale.taskId}</strong>
                  </p>
                )}
                {order.mangwale?.riderName ? (
                  <p className="text-xs text-stone-300">
                    Driver: <strong className="text-white">{order.mangwale.riderName}</strong>
                    {order.mangwale.riderVehicleNo && (
                      <span className="ml-1.5 text-stone-400 font-mono">({order.mangwale.riderVehicleNo})</span>
                    )}
                  </p>
                ) : (
                  <p className="text-[11px] text-stone-400">
                    Awaiting driver assignment from Mangwale
                  </p>
                )}
              </div>

              {order.mangwale?.riderPhone && (
                <a
                  href={`tel:${order.mangwale.riderPhone}`}
                  className="px-3 py-1.5 rounded-full border border-stone-700 bg-stone-800 hover:bg-stone-700 text-white font-semibold flex items-center gap-1.5 transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Executive</span>
                </a>
              )}
            </div>
          </div>
        ) : (
          order.mangwale && (
            <div className="p-4 bg-white rounded-2xl border border-stone-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
                  Logistics Partner
                </span>
                <p className="font-bold text-stone-900">
                  Mangwale Express Delivery
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Preparing order for dispatch to Mangwale
                </p>
              </div>
            </div>
          )
        )}
      </div>

      {/* Order Bill Summary */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 space-y-4 shadow-xs">
        <h3 className="font-serif font-bold text-stone-900 text-base">Order Details</h3>
        <div className="divide-y divide-stone-100">
          {order.items.map((it, idx) => (
            <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
              <div>
                <p className="font-medium text-stone-800">
                  {it.quantity}x {it.name}
                </p>
                <p className="text-stone-400 text-[10px]">₹{it.price} each</p>
              </div>
              <span className="font-bold text-stone-900">₹{it.total}</span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-stone-200 space-y-1.5 text-xs text-stone-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{order.subtotal}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Promo Discount</span>
              <span>-₹{order.discount}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</span>
          </div>
          <div className="flex justify-between text-stone-900 font-bold text-sm pt-2 border-t border-stone-200">
            <span>Total Amount ({order.paymentMethod})</span>
            <span>₹{order.total}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <span>Delivering to: {order.customer.name}, {order.customer.area}</span>
          <Link
            href={`/${outletSlug}`}
            className="text-stone-900 font-semibold hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to Store</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
