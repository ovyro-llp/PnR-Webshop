'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Order } from '@/types';
import { User, MapPin, Phone, LogOut, ShoppingBag, Clock, ArrowRight } from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const { user, isCustomer, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch('/api/orders/list')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOrders(data.orders);
        }
      })
      .catch(console.error);
  }, []);

  if (!user || !isCustomer) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <h2 className="text-xl font-serif font-bold text-stone-900">Sign in to view your account</h2>
          <p className="text-xs text-stone-500 max-w-sm">
            Please log in with your phone number to access your orders and saved addresses.
          </p>
          <Link
            href="/login"
            className="px-6 py-2.5 bg-[#1C1917] hover:bg-stone-800 text-white rounded-full text-xs font-semibold"
          >
            Go to Customer Login
          </Link>
        </div>
      </div>
    );
  }

  const customerUser = user as { name: string; phone: string; savedAddresses?: { id: string; label: string; address: string; area: string; pincode: string }[] };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 flex-1 w-full">
        {/* User Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800 font-serif font-bold text-xl">
              {customerUser.name.charAt(0)}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Puffs &apos;n&apos; Rolls Member
              </span>
              <h1 className="text-xl font-serif font-bold text-stone-900">
                {customerUser.name}
              </h1>
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                +91 {customerUser.phone}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="px-4 py-2 border border-stone-200 hover:border-stone-400 text-stone-600 hover:text-stone-900 rounded-full text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Saved Addresses */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-stone-700" />
                Saved Delivery Addresses
              </h3>
            </div>

            <div className="space-y-3">
              {(customerUser.savedAddresses || []).map((addr) => (
                <div key={addr.id} className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/60 text-xs space-y-1">
                  <span className="font-bold text-stone-800 uppercase tracking-wider text-[10px] bg-white px-2 py-0.5 rounded border border-stone-200">
                    {addr.label}
                  </span>
                  <p className="text-stone-700 pt-1">{addr.address}</p>
                  <p className="text-stone-500 font-medium">{addr.area}, Nashik - {addr.pincode}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-stone-700" />
              Recent Bakery Orders
            </h3>

            {orders.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">No orders placed yet.</p>
            ) : (
              <div className="divide-y divide-stone-100">
                {orders.map((ord) => (
                  <div key={ord.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900">{ord.orderNumber}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-800">
                          {ord.orderStatus}
                        </span>
                      </div>
                      <p className="text-stone-600">
                        {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </p>
                      <p className="text-[11px] text-stone-400">
                        Total: <strong>₹{ord.total}</strong> ({ord.paymentMethod})
                      </p>
                    </div>

                    <Link
                      href={`/${ord.outletSlug}/order/${ord.id}`}
                      className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold self-start sm:self-center flex items-center gap-1 transition"
                    >
                      <span>Track Order</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
