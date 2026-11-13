'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Order } from '@/types';
import { User, MapPin, Phone, LogOut, ShoppingBag, Clock, ArrowRight, Edit3, Plus, Trash2, X, CheckCircle2, Truck, ExternalLink } from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const { user, isCustomer, logout, updateCustomerProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addrLabel, setAddrLabel] = useState('');
  const [addrLine, setAddrLine] = useState('');
  const [addrArea, setAddrArea] = useState('');
  const [addrPincode, setAddrPincode] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (!user || !isCustomer) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }

    const phone = (user as { phone?: string }).phone;
    if (!phone) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }

    setLoadingOrders(true);
    fetch(`/api/orders/list?phone=${encodeURIComponent(phone)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOrders(data.orders);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingOrders(false));
  }, [user, isCustomer]);

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

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditName(customerUser.name);
                setEditPhone(customerUser.phone);
                setIsEditModalOpen(true);
              }}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="px-4 py-2 border border-stone-200 hover:border-stone-400 text-stone-600 hover:text-stone-900 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-medium text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Saved Addresses */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-stone-700" />
                <span>Saved Addresses</span>
              </h3>
              <button
                onClick={() => {
                  setAddrLabel('');
                  setAddrLine('');
                  setAddrArea('');
                  setAddrPincode('');
                  setIsAddingAddress(true);
                }}
                className="text-[11px] font-semibold text-stone-700 hover:text-stone-950 flex items-center gap-1 cursor-pointer bg-stone-100 px-2.5 py-1 rounded-lg"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>

            <div className="space-y-3">
              {(customerUser.savedAddresses || []).length === 0 ? (
                <p className="text-xs text-stone-400 py-3 text-center">No addresses saved yet.</p>
              ) : (
                (customerUser.savedAddresses || []).map((addr) => (
                  <div key={addr.id} className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/60 text-xs space-y-1 relative group">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-800 uppercase tracking-wider text-[10px] bg-white px-2 py-0.5 rounded border border-stone-200">
                        {addr.label}
                      </span>
                      <button
                        onClick={async () => {
                          const updated = (customerUser.savedAddresses || []).filter((a) => a.id !== addr.id);
                          await updateCustomerProfile({ savedAddresses: updated });
                          setStatusMessage('Address removed');
                          setTimeout(() => setStatusMessage(''), 3000);
                        }}
                        className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Remove address"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-stone-700 pt-1">{addr.address}</p>
                    <p className="text-stone-500 font-medium">{addr.area}, Nashik - {addr.pincode}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-stone-700" />
              Recent Bakery Orders
            </h3>

            {loadingOrders ? (
              <p className="text-xs text-stone-400 py-6 text-center animate-pulse">Loading your orders...</p>
            ) : orders.length === 0 ? (
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

                    {(() => {
                      const userPhone = customerUser?.phone || (user && 'phone' in user ? (user as any).phone : '');
                      const cleanPhone = (ord.customer?.phone || userPhone || '').replace(/[^0-9]/g, '').slice(-10);
                      const trackingUrl =
                        ord.mangwale?.trackingUrl ||
                        (ord.mangwale?.taskId && cleanPhone
                          ? `https://track.mangwale.com/track/${encodeURIComponent(ord.mangwale.taskId)}/${cleanPhone}`
                          : null);

                      return (
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          {trackingUrl && (
                            <a
                              href={trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                              title="Track delivery on Live GPS Map"
                            >
                              <Truck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Live Map</span>
                              <ExternalLink className="w-3 h-3 text-emerald-600" />
                            </a>
                          )}
                          <Link
                            href={`/${ord.outletSlug}/order/${ord.id}`}
                            className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <span>Details</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Edit Customer Profile Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full space-y-4 shadow-xl border border-stone-200">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="font-serif font-bold text-stone-900 text-base">Edit Profile</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!editName.trim() || !editPhone.trim()) return;
                  await updateCustomerProfile({ name: editName.trim(), phone: editPhone.trim() });
                  setIsEditModalOpen(false);
                  setStatusMessage('Profile updated successfully');
                  setTimeout(() => setStatusMessage(''), 3000);
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none font-mono"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-stone-600 hover:text-stone-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#1C1917] hover:bg-stone-800 text-white rounded-full font-semibold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Saved Address Modal (Zero pre-fill) */}
        {isAddingAddress && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full space-y-4 shadow-xl border border-stone-200">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="font-serif font-bold text-stone-900 text-base">Add Delivery Address</h3>
                <button onClick={() => setIsAddingAddress(false)} className="text-stone-400 hover:text-stone-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!addrLine.trim() || !addrArea.trim() || !addrPincode.trim()) return;
                  const newAddr = {
                    id: `addr-${Date.now()}`,
                    label: addrLabel.trim() || 'Home',
                    address: addrLine.trim(),
                    area: addrArea.trim(),
                    pincode: addrPincode.trim(),
                  };
                  const currentAddresses = customerUser.savedAddresses || [];
                  await updateCustomerProfile({ savedAddresses: [...currentAddresses, newAddr] });
                  setIsAddingAddress(false);
                  setStatusMessage('Delivery address saved');
                  setTimeout(() => setStatusMessage(''), 3000);
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Label</label>
                  <input
                    type="text"
                    value={addrLabel}
                    onChange={(e) => setAddrLabel(e.target.value)}
                    placeholder="e.g. Home, Office, Studio"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">House / Flat / Street *</label>
                  <textarea
                    rows={2}
                    required
                    value={addrLine}
                    onChange={(e) => setAddrLine(e.target.value)}
                    placeholder="Building name, flat number, street"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Nashik Area *</label>
                    <select
                      required
                      value={addrArea}
                      onChange={(e) => setAddrArea(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:bg-white focus:outline-none"
                    >
                      <option value="">Select Area...</option>
                      <option value="Cycle Circle / College Road">Cycle Circle / College Road</option>
                      <option value="Krishi Nagar / Thatte Nagar">Krishi Nagar / Thatte Nagar</option>
                      <option value="Gangapur Road / Sahdev Nagar">Gangapur Road / Sahdev Nagar</option>
                      <option value="Datta Chowk / Serene Meadows">Datta Chowk / Serene Meadows</option>
                      <option value="ND Patel Road / Shalimar">ND Patel Road / Shalimar</option>
                      <option value="CBS / Old Nashik">CBS / Old Nashik</option>
                      <option value="Panchavati">Panchavati</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Pincode *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={addrPincode}
                      onChange={(e) => setAddrPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="e.g. 422005"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(false)}
                    className="px-4 py-2 text-stone-600 hover:text-stone-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#1C1917] hover:bg-stone-800 text-white rounded-full font-semibold"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
