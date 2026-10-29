import { notFound } from 'next/navigation';
import { orderStore } from '@/lib/store/order-store';
import { Navbar } from '@/components/layout/Navbar';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  ChefHat,
  PackageCheck,
  ArrowLeft,
  Truck,
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
      label: 'Express Dispatch',
      desc: order.mangwale?.riderName ? `Rider: ${order.mangwale.riderName}` : 'Assigning rider',
      icon: Truck,
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
    <div className="min-h-screen flex flex-col bg-[#FDFCFB]">
      <Navbar currentOutletSlug={outletSlug} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 flex-1 w-full">
        {/* Order Confirmed Box */}
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

        {/* Live Delivery Status Box (Zero partner mention) */}
        <div className="bg-[#FAF8F5] border border-stone-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1C1917] text-white flex items-center justify-center">
                <Truck className="w-5 h-5 text-stone-200" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-400">
                  Express Delivery Tracking
                </span>
                <h3 className="text-base font-serif font-bold text-stone-900">
                  {order.orderStatus.replace(/_/g, ' ')}
                </h3>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-200/80 text-stone-800 self-start sm:self-center">
              ETA: ~{order.mangwale?.estimatedDeliveryMinutes || 25} Mins
            </span>
          </div>

          {/* Stepper Timeline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {steps.map((st, i) => {
              const Icon = st.icon;
              return (
                <div
                  key={i}
                  className={`p-3.5 rounded-2xl border transition ${
                    st.completed
                      ? 'bg-white border-stone-300 text-stone-900 shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-stone-400'
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-1.5 ${st.completed ? 'text-stone-900' : 'text-stone-400'}`} />
                  <p className="text-xs font-bold leading-none">{st.label}</p>
                  <p className="text-[10px] text-stone-500 mt-1 line-clamp-1">{st.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Delivery Executive Info */}
          {order.mangwale?.riderName && (
            <div className="p-4 bg-white rounded-2xl border border-stone-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
                  Delivery Executive
                </span>
                <p className="font-bold text-stone-900">{order.mangwale.riderName}</p>
                {order.mangwale.riderVehicleNo && (
                  <p className="text-[10px] text-stone-500 font-mono">{order.mangwale.riderVehicleNo}</p>
                )}
              </div>
              {order.mangwale.riderPhone && (
                <a
                  href={`tel:${order.mangwale.riderPhone}`}
                  className="px-3 py-1.5 rounded-full border border-stone-300 text-stone-700 hover:text-stone-900 font-semibold flex items-center gap-1.5 transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Executive</span>
                </a>
              )}
            </div>
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
    </div>
  );
}
