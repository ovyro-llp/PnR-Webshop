'use client';

import React, { useState, useEffect, useMemo, use } from 'react';
import Image from 'next/image';
import {
  Lock,
  Search,
  Plus,
  Minus,
  Send,
  CheckCircle2,
  Calendar,
  Clock,
  LogOut,
  Building2,
  FileText,
  AlertCircle,
  Printer,
  ShoppingBag,
} from 'lucide-react';
import { B2BClientCatalogItem, B2BOrder } from '@/types';

interface ClientSession {
  userId: string;
  name: string;
  username: string;
  clientId: string;
  clientSlug: string;
  clientName: string;
  departmentId: string;
  departmentName: string;
  departmentCode?: string;
}

export default function B2BClientPortalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const clientSlug = resolvedParams.slug;

  // Session & Authentication State
  const [session, setSession] = useState<ClientSession | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Client Metadata & Dynamic Catalog State
  const [clientData, setClientData] = useState<{
    name: string;
    slug: string;
    fulfillingOutletSlug: string;
  } | null>(null);
  const [catalog, setCatalog] = useState<B2BClientCatalogItem[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  // Order Requisition State
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState(
    'Morning (08:30 AM - 10:00 AM)'
  );
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<B2BOrder | null>(null);

  // 1. Check existing session on load
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/b2b/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.session) {
            // Verify session belongs to current slug
            if (data.session.clientSlug.toLowerCase() === clientSlug.toLowerCase()) {
              setSession(data.session);
            }
          }
        }
      } catch (err) {
        console.error('Session check failed', err);
      } finally {
        setIsCheckingSession(false);
      }
    }
    checkSession();
  }, [clientSlug]);

  // 2. Fetch Client Info & Curated Catalog
  useEffect(() => {
    async function fetchClientInfo() {
      setIsLoadingCatalog(true);
      try {
        const res = await fetch(`/api/b2b/client/${clientSlug}`);
        if (res.ok) {
          const data = await res.json();
          setClientData(data.client);
          setCatalog(data.catalog || []);
        } else {
          setClientData({
            name: clientSlug.toUpperCase(),
            slug: clientSlug,
            fulfillingOutletSlug: 'cycle-circle',
          });
        }
      } catch (err) {
        console.error('Fetch client error', err);
      } finally {
        setIsLoadingCatalog(false);
      }
    }
    fetchClientInfo();
  }, [clientSlug]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/b2b/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSlug,
          username: loginUsername.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Login failed. Please verify credentials.');
        setIsLoggingIn(false);
        return;
      }

      setSession({
        userId: data.user.id,
        name: data.user.name,
        username: data.user.username,
        clientId: data.client.id,
        clientSlug: data.client.slug,
        clientName: data.client.name,
        departmentId: data.department.id,
        departmentName: data.department.name,
        departmentCode: data.department.code,
      });
    } catch (err: any) {
      setLoginError(err.message || 'Connection error. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/b2b/auth/session', { method: 'DELETE' });
      setSession(null);
      setQuantities({});
      setSubmittedOrder(null);
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  // Quantity helpers
  const updateQuantity = (itemId: string, qty: number) => {
    const validQty = Math.max(0, qty);
    setQuantities((prev) => ({
      ...prev,
      [itemId]: validQty,
    }));
  };

  // Filter products
  const categories = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [catalog]);

  const filteredProducts = useMemo(() => {
    return catalog.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === 'ALL' || item.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [catalog, searchQuery, selectedCategory]);

  // Order summary calculations
  const totalUnits = useMemo(() => {
    return Object.values(quantities).reduce((sum, q) => sum + (q || 0), 0);
  }, [quantities]);

  const totalAmount = useMemo(() => {
    return catalog.reduce((sum, item) => {
      const qty = quantities[item.id] || 0;
      return sum + qty * item.b2bPrice;
    }, 0);
  }, [catalog, quantities]);

  const selectedItemsCount = useMemo(() => {
    return Object.values(quantities).filter((q) => q > 0).length;
  }, [quantities]);

  // Submit Requisition Order
  const handleSendOrder = async () => {
    if (!session) return;
    if (totalUnits === 0) {
      alert('Please select at least 1 item quantity before sending.');
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsToOrder = catalog
        .filter((item) => (quantities[item.id] || 0) > 0)
        .map((item) => ({
          productId: item.productId,
          productName: item.productName,
          category: item.category,
          unit: item.unit,
          b2bPrice: item.b2bPrice,
          quantity: quantities[item.id],
        }));

      const res = await fetch('/api/b2b/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSlug,
          departmentId: session.departmentId,
          clientUserId: session.userId,
          deliveryDate,
          deliveryTimeSlot,
          items: itemsToOrder,
          notes: orderNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to submit order. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setSubmittedOrder(data.order);
      setQuantities({});
      setOrderNotes('');
    } catch (err: any) {
      alert(err.message || 'Network error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render: Loading Screen
  // -------------------------------------------------------------------------
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-stone-300 border-t-amber-800 rounded-full animate-spin" />
          <p className="text-sm font-medium text-stone-600">
            Connecting to Corporate Portal...
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Corporate Login Screen
  // -------------------------------------------------------------------------
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
          {/* Header */}
          <div className="bg-stone-900 text-white p-6 text-center relative">
            <div className="mx-auto w-16 h-16 bg-white rounded-xl p-2 shadow-lg mb-3 flex items-center justify-center">
              <Image
                src="/images/logo.png"
                alt="Puffs 'n' Rolls"
                width={50}
                height={50}
                className="object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Puffs 'n' Rolls</h1>
            <p className="text-xs text-stone-300 uppercase tracking-wider font-semibold mt-0.5">
              Corporate & Institutional Portal
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-800 border border-stone-700 text-xs text-amber-300 font-medium">
              <Building2 className="w-3.5 h-3.5" />
              <span>{clientData?.name || clientSlug.toUpperCase()}</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Client Employee Login ID
              </label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="e.g. tcs_canteen1"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800"
              />
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-stone-900 hover:bg-black text-white font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Access Requisition Portal</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-stone-500">
                Logins are issued by Puffs 'n' Rolls corporate accounts desk.
                Department is strictly locked to your authorized credentials.
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Requisition Interface ("Send Order" View)
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-stone-100 flex flex-col pb-36">
      {/* Top Corporate App Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-stone-900 rounded-lg p-1.5 flex items-center justify-center text-white">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-stone-900 leading-tight">
                {session.clientName}
              </h1>
              <p className="text-xs text-stone-500">
                Daily Bakery Requisition Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Pre-Locked Department Badge (Strictly non-editable) */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg">
              <Lock className="w-3.5 h-3.5 text-emerald-700" />
              <div className="text-left">
                <span className="block text-[10px] uppercase font-bold text-emerald-800 leading-none">
                  Locked Department
                </span>
                <span className="text-xs font-bold text-emerald-900">
                  {session.departmentName}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Log out"
              className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Header: Locked Department */}
        <div className="sm:hidden px-4 py-2 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
            <Lock className="w-3.5 h-3.5 text-emerald-700" />
            <span>Assigned Dept: {session.departmentName}</span>
          </div>
          <span className="text-[10px] text-emerald-700 uppercase font-semibold">
            Pre-Locked
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto w-full px-4 pt-5 space-y-4">
        {/* Delivery Schedule Bar */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-800" />
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wide">
              Delivery Date:
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-800" />
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wide">
              Delivery Slot:
            </label>
            <select
              value={deliveryTimeSlot}
              onChange={(e) => setDeliveryTimeSlot(e.target.value)}
              className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800"
            >
              <option value="Morning (08:30 AM - 10:00 AM)">
                Morning (08:30 AM - 10:00 AM)
              </option>
              <option value="Afternoon (01:00 PM - 02:30 PM)">
                Afternoon (01:00 PM - 02:30 PM)
              </option>
              <option value="Evening High-Tea (04:30 PM - 06:00 PM)">
                Evening High-Tea (04:30 PM - 06:00 PM)
              </option>
            </select>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bakery items by name or category..."
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat === 'ALL' ? 'All Approved Items' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Catalog Grid (Optimized: No photo required) */}
        {isLoadingCatalog ? (
          <div className="p-12 text-center text-sm text-stone-500">
            Loading approved client catalog...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
            <p className="text-sm font-semibold text-stone-600">
              No products found matching your search.
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Contact PnR Admin to add more items to {session.clientName}'s approved catalog.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredProducts.map((item) => {
              const currentQty = quantities[item.id] || 0;
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl border p-4 shadow-sm transition-all flex items-center justify-between gap-3 ${
                    currentQty > 0
                      ? 'border-emerald-500 bg-emerald-50/20'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {/* Left: Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600">
                        {item.category}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        Per {item.unit}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-stone-900 truncate">
                      {item.productName}
                    </h3>

                    {/* Contracted Price Display */}
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-xs font-bold text-stone-900">
                        ₹{item.b2bPrice.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        (Contracted Rate)
                      </span>
                    </div>
                  </div>

                  {/* Right: Quantity Stepper */}
                  <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, currentQty - 1)}
                      disabled={currentQty === 0}
                      className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-700 hover:bg-stone-50 active:scale-95 disabled:opacity-40 transition-all"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <input
                      type="number"
                      min="0"
                      value={currentQty === 0 ? '' : currentQty}
                      placeholder="0"
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        updateQuantity(item.id, isNaN(val) ? 0 : val);
                      }}
                      className="w-12 h-8 text-center bg-transparent font-bold text-sm text-stone-900 focus:outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, currentQty + 1)}
                      className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center hover:bg-black active:scale-95 transition-all shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Requisition Tray ("Send Order" Mechanism) */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-300 shadow-2xl p-3 md:p-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Notes Input */}
          <div className="flex-1">
            <input
              type="text"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Optional: Requisition notes, PO number, or delivery instructions..."
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800"
            />
          </div>

          {/* Action Group */}
          <div className="flex items-center gap-4 justify-between md:justify-end">
            <div className="text-left md:text-right">
              <div className="text-xs text-stone-500 font-medium">
                <span className="font-bold text-stone-900">
                  {selectedItemsCount}
                </span>{' '}
                items •{' '}
                <span className="font-bold text-stone-900">
                  {totalUnits}
                </span>{' '}
                units
              </div>
              <div className="text-sm font-black text-stone-900">
                Est. ₹{totalAmount.toFixed(2)}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendOrder}
              disabled={isSubmitting || totalUnits === 0}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>SEND ORDER ➔</span>
                </>
              )}
            </button>
          </div>
        </div>
      </footer>

      {/* Order Confirmation Modal */}
      {submittedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-emerald-700 text-white p-6 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-black">Order Dispatched to Kitchen!</h2>
              <p className="text-xs text-emerald-100 mt-1">
                Your daily requisition has been recorded successfully.
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-stone-400 block font-semibold uppercase text-[10px]">
                    Order Number
                  </span>
                  <span className="font-bold text-stone-900">
                    {submittedOrder.orderNumber}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block font-semibold uppercase text-[10px]">
                    Department
                  </span>
                  <span className="font-bold text-stone-900">
                    {session.departmentName}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block font-semibold uppercase text-[10px]">
                    Delivery Date
                  </span>
                  <span className="font-bold text-stone-900">
                    {submittedOrder.deliveryDate}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block font-semibold uppercase text-[10px]">
                    Time Slot
                  </span>
                  <span className="font-bold text-stone-900">
                    {submittedOrder.deliveryTimeSlot}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">
                  Requested Items & Quantities
                </h4>
                <div className="border border-stone-200 rounded-xl divide-y divide-stone-100">
                  {submittedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-stone-900">
                          {item.productName}
                        </span>
                        <span className="block text-[10px] text-stone-500">
                          ₹{item.b2bPrice.toFixed(2)} / {item.unit}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-stone-900 text-sm">
                          {item.quantity} {item.unit}
                        </span>
                        <span className="block text-[10px] text-stone-400">
                          ₹{item.subtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {submittedOrder.notes && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <span className="font-bold block">Delivery Note:</span>
                  {submittedOrder.notes}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="bg-stone-50 p-4 border-t border-stone-200 flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-4 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setSubmittedOrder(null)}
                className="flex-1 py-2.5 px-4 bg-stone-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <span>Done</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
