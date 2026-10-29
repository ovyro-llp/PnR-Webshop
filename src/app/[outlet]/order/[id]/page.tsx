import { notFound } from 'next/navigation';
import { orderStore } from '@/lib/store/order-store';
import { Navbar } from '@/components/layout/Navbar';
import Link from 'next/link';
import {
  CheckCircle2,
  Bike,
  Clock,
  Phone,
  MapPin,
  ExternalLink,
  ChefHat,
  PackageCheck,
  ArrowLeft,
} from 'lucide-react';

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ outlet: string; id: string }>;
}) {
  const { outlet: outletSlug, id } = await params;
  const outlet = orderStore.getOutletBySlug(outletSlug);
  const order = orderStore.getOrderById(id);

  if (!order) {
    notFound();
  }

  const steps = [
    { label: 'Order Received', desc: 'Sent to bakery kitchen', icon: ChefHat, completed: true },
    {
      label: 'Baking Fresh',
      desc: 'In the oven',
      icon: Clock,
      completed: ['PREPARING', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(
        order.orderStatus
      ),
    },
    {
      label: 'Mangwale Dispatch',
      desc: order.mangwale?.riderName ? `Rider: ${order.mangwale.riderName}` : 'Assigning rider',
      icon: Bike,
      completed: ['DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus),
    },
    {
      label: 'Delivered',
      desc: 'At your doorstep',
      icon: PackageCheck,
      completed: order.orderStatus === 'DELIVERED',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar currentOutletSlug={outletSlug} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 flex-1">
        {/* Success Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm text-center space-y-3">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
            Order Confirmed • {order.orderNumber}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
            Thank You, {order.customer.name}!
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm max-w-lg mx-auto">
            Your fresh bakery order has been placed with <strong>{outlet?.name || 'Puffs and Rolls'}</strong> and dispatched to Mangwale Nashik Logistics.
          </p>
        </div>

        {/* Live Mangwale Rider Tracking Box */}
        <div className="bg-gradient-to-br from-amber-900 via-stone-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-800/40 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Bike className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  Mangwale Delivery Task
                </span>
                <h3 className="text-lg font-bold text-white font-mono">
                  {order.mangwale?.taskId || 'MNG-NSK-PROCESSING'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {order.orderStatus.replace(/_/g, ' ')}
              </span>
              {order.mangwale?.trackingUrl && (
                <a
                  href={order.mangwale.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
                >
                  <span>Live Map</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Rider Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white/10 rounded-2xl p-4 space-y-1">
              <span className="text-stone-400 text-[11px]">Assigned Rider</span>
              <p className="font-bold text-white text-sm">
                {order.mangwale?.riderName || 'Assigning nearest rider...'}
              </p>
              {order.mangwale?.riderVehicleNo && (
                <p className="text-amber-300 font-mono text-[11px]">
                  {order.mangwale.riderVehicleNo}
                </p>
              )}
            </div>

            <div className="bg-white/10 rounded-2xl p-4 space-y-1">
              <span className="text-stone-400 text-[11px]">Rider Contact</span>
              <p className="font-bold text-white text-sm flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                {order.mangwale?.riderPhone || '+91 98220 00000'}
              </p>
              <p className="text-stone-400 text-[10px]">Nashik Delivery Fleet</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-4 space-y-1">
              <span className="text-stone-400 text-[11px]">Estimated Arrival</span>
              <p className="font-bold text-emerald-400 text-base flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                ~{order.mangwale?.estimatedDeliveryMinutes || 25} Mins
              </p>
              <p className="text-stone-400 text-[10px]">Hot &amp; crispy straight from oven</p>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {steps.map((st, i) => {
                const Icon = st.icon;
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-2xl border transition ${
                      st.completed
                        ? 'bg-amber-500/20 border-amber-400/50 text-white'
                        : 'bg-white/5 border-white/10 text-stone-500'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${st.completed ? 'text-amber-400' : 'text-stone-500'}`} />
                    <p className="text-xs font-bold leading-none">{st.label}</p>
                    <p className="text-[10px] opacity-75 mt-0.5 line-clamp-1">{st.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Details & Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Items */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 space-y-4">
            <h3 className="font-bold text-stone-900 text-sm">Order Summary</h3>
            <div className="divide-y divide-stone-100 space-y-2">
              {order.items.map((it, idx) => (
                <div key={idx} className="pt-2 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-semibold text-stone-800">
                      {it.quantity}x {it.name}
                    </p>
                    <p className="text-stone-400 text-[10px]">₹{it.price} each</p>
                  </div>
                  <span className="font-bold text-stone-900">₹{it.total}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-stone-200 space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Campaign Offer Discount</span>
                  <span>-₹{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Mangwale Delivery Fee</span>
                <span>{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</span>
              </div>
              <div className="flex justify-between text-stone-900 font-black text-sm pt-2 border-t border-stone-200">
                <span>Amount Paid ({order.paymentMethod})</span>
                <span className="text-amber-700">₹{order.total}</span>
              </div>
            </div>
          </div>

          {/* Customer & Outlet Delivery Info */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-bold text-stone-900 text-sm">Delivery Information</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2 text-stone-700">
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-stone-900">{order.customer.name}</p>
                    <p className="text-stone-600">{order.customer.address}</p>
                    <p className="text-stone-500 font-medium">
                      {order.customer.area}, Nashik - {order.customer.pincode}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-stone-700 pt-2 border-t border-stone-100">
                  <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>WhatsApp: {order.customer.phone}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200">
              <Link
                href={`/${outletSlug}`}
                className="w-full py-2.5 rounded-xl border border-stone-300 hover:border-amber-600 text-stone-700 hover:text-amber-800 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to {outlet?.name.replace('Puffs and Rolls - ', '')} Store</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
