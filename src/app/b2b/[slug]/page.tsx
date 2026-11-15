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
  ArrowRight,
  History,
  X,
  ChevronRight,
  Filter,
  Sparkles,
  Eye,
  EyeOff,
  Trash2,
  Check,
  Package,
} from 'lucide-react';
import { B2BClientCatalogItem, B2BOrder } from '@/types';
import { DietarySymbol, GlutenFreeSymbol } from '@/components/ui/DietarySymbol';

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
  const [showPassword, setShowPassword] = useState(false);
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
  const [dietaryFilter, setDietaryFilter] = useState<'ALL' | 'VEG' | 'NON_VEG'>('ALL');
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

  // Drawers: Requisition Review & Order History
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [orderHistory, setOrderHistory] = useState<B2BOrder[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Dynamic client organization name (dynamically prioritizes live client record, then session, then slug)
  const displayClientName = clientData?.name || session?.clientName || clientSlug.toUpperCase();

  // 1. Check existing session on load
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/b2b/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.session) {
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
          // Dynamically synchronize active session with updated organization name
          if (data.client?.name) {
            setSession((prev) =>
              prev ? { ...prev, clientName: data.client.name, clientSlug: data.client.slug } : null
            );
          }
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

  // 3. Fetch Department Order History when session exists or history drawer opens
  const fetchOrderHistory = async () => {
    if (!session) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch(
        `/api/b2b/orders?departmentId=${session.departmentId}&date=ALL`
      );
      if (res.ok) {
        const data = await res.json();
        setOrderHistory(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load order history', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchOrderHistory();
    }
  }, [session]);

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
      setIsReviewDrawerOpen(false);
      setIsHistoryDrawerOpen(false);
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

  const addQuickUnits = (itemId: string, delta: number) => {
    const current = quantities[itemId] || 0;
    updateQuantity(itemId, current + delta);
  };

  // Helper to determine dietary type based on item attributes and name
  const isItemVeg = (item: B2BClientCatalogItem) => {
    if (typeof item.isVeg === 'boolean') return item.isVeg;
    const name = item.productName.toLowerCase();
    return (
      !name.includes('chicken') &&
      !name.includes('meat') &&
      !name.includes('mutton') &&
      !name.includes('egg') &&
      !name.includes('non-veg')
    );
  };

  const isItemGlutenFree = (item: B2BClientCatalogItem) => {
    if (typeof item.isGlutenFree === 'boolean') return item.isGlutenFree;
    const name = item.productName.toLowerCase();
    return name.includes('millet') || name.includes('ragi');
  };

  // Filter products by category, dietary, and search
  const categories = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [catalog]);

  const vegCount = useMemo(() => catalog.filter(isItemVeg).length, [catalog]);
  const nonVegCount = useMemo(() => catalog.filter((i) => !isItemVeg(i)).length, [catalog]);

  const filteredProducts = useMemo(() => {
    return catalog.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === 'ALL' || item.category === selectedCategory;

      const isVeg = isItemVeg(item);
      let matchesDietary = true;
      if (dietaryFilter === 'VEG' && !isVeg) matchesDietary = false;
      if (dietaryFilter === 'NON_VEG' && isVeg) matchesDietary = false;

      return matchesSearch && matchesCat && matchesDietary;
    });
  }, [catalog, searchQuery, selectedCategory, dietaryFilter]);

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
      setIsReviewDrawerOpen(false);
      fetchOrderHistory(); // Refresh order history immediately
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
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-stone-200 border-t-[#1C1917] rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest font-semibold text-stone-500">
            Connecting to Corporate Operations Portal...
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Corporate Login Screen (Matching B2C CustomerLoginModal Luxury UI)
  // -------------------------------------------------------------------------
  if (!session) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-4">
        <div className="bg-[#FAF8F5] border border-stone-200/90 rounded-3xl max-w-md w-full p-6 sm:p-8 relative shadow-2xl space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="relative h-12 w-40 mx-auto">
              <Image
                src="https://puffsnrolls.com/wp-content/uploads/2025/12/banner-logo.png"
                alt="Puffs 'n' Rolls"
                fill
                sizes="160px"
                className="object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-400 block">
                B2B Commercial Operations
              </span>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight mt-0.5">
                Corporate Requisition Portal
              </h1>
            </div>

            {/* Client Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-stone-200 text-xs text-stone-800 font-semibold shadow-2xs">
              <Building2 className="w-3.5 h-3.5 text-amber-700" />
              <span>{displayClientName}</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Authorized Requisition ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="e.g. tcs_canteen1"
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Access Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter employee password"
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 shadow-2xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-[#1C1917] hover:bg-stone-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer active:scale-[0.99]"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Access Requisitions Terminal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Logins are issued by Puffs 'n' Rolls Corporate Desk.
                Department is strictly locked to your issued credentials.
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Requisition Interface (Matching B2C Storefront Experience)
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col text-[#1A1918]">
      {/* =================================================================== */}
      {/* 1. TOP CORPORATE NAVBAR (Matching B2C Navbar Polish)                */}
      {/* =================================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-28 sm:w-32">
              <Image
                src="https://puffsnrolls.com/wp-content/uploads/2025/12/banner-logo.png"
                alt="Puffs 'n' Rolls"
                fill
                sizes="128px"
                className="object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="hidden md:block pl-3 border-l border-stone-200">
              <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400 block">
                Corporate Supply
              </span>
              <span className="text-xs font-serif font-bold text-stone-900">
                {displayClientName}
              </span>
            </div>
          </div>

          {/* Department Locked Badge & User Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Pre-Locked Department Badge (Strictly Non-Editable) */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-300/80 rounded-full shadow-2xs">
              <Lock className="w-3 h-3 text-emerald-700 shrink-0" />
              <div className="text-left">
                <span className="hidden sm:inline text-[9px] uppercase font-bold text-emerald-800 tracking-wider mr-1">
                  Department:
                </span>
                <span className="text-xs font-bold text-emerald-950 truncate max-w-[100px] sm:max-w-none block sm:inline">
                  {session.departmentName}
                </span>
              </div>
            </div>

            {/* Requisition History Button */}
            <button
              onClick={() => {
                fetchOrderHistory();
                setIsHistoryDrawerOpen(true);
              }}
              title="View Requisition History"
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-stone-600" />
              <span className="hidden sm:inline">History</span>
              {orderHistory.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-stone-900 text-white text-[10px] font-mono flex items-center justify-center">
                  {orderHistory.length}
                </span>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Log out of Corporate Portal"
              className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-full transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* =================================================================== */}
      {/* 2. REQUISITION HERO BANNER (Matching B2C Outlet Header)            */}
      {/* =================================================================== */}
      <section className="bg-white border-b border-stone-200/80 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700">
                  Institutional Requisitions Desk
                </span>
                <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Contract Pricing Active
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
                {displayClientName} Requisitions
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
                Fresh bakery supply direct from our commercial baking ovens to{' '}
                <strong className="text-stone-900">{session.departmentName}</strong>. Select daily quantities below and dispatch straight to kitchen.
              </p>
            </div>

            {/* Requisition Details Pill */}
            <div className="bg-[#FAF8F5] border border-stone-200 rounded-2xl p-4 space-y-1.5 shrink-0 md:w-72">
              <span className="text-[9px] uppercase tracking-wider font-semibold text-stone-400 block">
                Delivery Schedule
              </span>
              <p className="text-xs sm:text-sm font-serif font-bold text-stone-900">
                {deliveryDate === new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                  ? "Tomorrow's Scheduled Shift"
                  : deliveryDate}
              </p>
              <div className="text-[11px] text-stone-500 flex justify-between pt-1 border-t border-stone-200/60">
                <span>Slot: {deliveryTimeSlot.split(' ')[0]}</span>
                <span className="text-emerald-700 font-medium">B2B Monthly Ledger</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. CATALOG & REQUISITION CONTROLS (Matching B2C MenuCatalogSection) */}
      {/* =================================================================== */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-32">
        {/* Controls Bar: Search, Dietary Filters, Category Pills */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search approved contracted bakery items..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200/90 rounded-2xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* 3-Way Dietary Filter Controls (Exact B2C Match, Full-Width on Phone) */}
            <div className="flex items-center p-1 bg-white border border-stone-200/90 rounded-2xl shadow-2xs w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setDietaryFilter('ALL')}
                className={`flex-1 sm:flex-none justify-center px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  dietaryFilter === 'ALL'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                <span>All ({catalog.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDietaryFilter('VEG')}
                className={`flex-1 sm:flex-none justify-center px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  dietaryFilter === 'VEG'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-800 hover:text-emerald-950 bg-emerald-50/50'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    dietaryFilter === 'VEG' ? 'bg-white' : 'bg-emerald-600'
                  }`}
                />
                <span>Veg Only ({vegCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setDietaryFilter('NON_VEG')}
                className={`flex-1 sm:flex-none justify-center px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  dietaryFilter === 'NON_VEG'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'text-rose-800 hover:text-rose-950 bg-rose-50/50'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    dietaryFilter === 'NON_VEG' ? 'bg-white' : 'bg-rose-700'
                  }`}
                />
                <span>Non-Veg ({nonVegCount})</span>
              </button>
            </div>
          </div>

          {/* Category Navigation Pills (Mobile Edge-to-Edge Scroll) */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 max-w-full -mx-4 px-4 sm:mx-0 sm:px-0">
            {categories.map((cat) => {
              const count =
                cat === 'ALL'
                  ? catalog.length
                  : catalog.filter((i) => i.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? 'bg-[#1C1917] text-white shadow-xs'
                      : 'bg-white border border-stone-200/80 hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  <span>{cat === 'ALL' ? 'All Items' : cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedCategory === cat
                        ? 'bg-white/20 text-white'
                        : 'bg-stone-200/80 text-stone-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* =================================================================== */}
        {/* 4. PRODUCT CARDS GRID (Matching B2C MenuItemCard Architecture)     */}
        {/* =================================================================== */}
        {isLoadingCatalog ? (
          <div className="p-16 text-center text-xs uppercase tracking-widest text-stone-400 font-semibold">
            Loading approved contracted catalog...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200/80 p-12 text-center space-y-2">
            <Package className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <h3 className="text-base font-serif font-bold text-stone-800">
              No items match this filter
            </h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Try adjusting your category selection or dietary filter. If your department requires a product not listed here, contact PnR Bakery Admin to add it to {displayClientName}'s approved catalog.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredProducts.map((item) => {
              const currentQty = quantities[item.id] || 0;
              const isVeg = isItemVeg(item);
              const isGlutenFree = isItemGlutenFree(item);

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-[0_2px_8px_rgba(0,0,0,0.02)] ${
                    currentQty > 0
                      ? 'border-stone-900 ring-1 ring-stone-900 shadow-md'
                      : 'border-stone-200/70 hover:border-stone-400/80'
                  }`}
                >
                  {/* Card Body */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Category & Dietary Indicator */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-400 block">
                          {item.category}
                        </span>
                        {/* Veg / Non-Veg & Gluten-Free Indicator */}
                        <div className="flex items-center gap-1.5">
                          {isGlutenFree && (
                            <div className="bg-white border border-stone-200/80 p-0.5 rounded shadow-2xs">
                              <GlutenFreeSymbol size="xs" />
                            </div>
                          )}
                          <div className="bg-white border border-stone-200/80 p-0.5 rounded shadow-2xs">
                            <DietarySymbol isVeg={isVeg} size="xs" />
                          </div>
                        </div>
                      </div>

                      {/* Product Title */}
                      <h3 className="font-serif font-bold text-base text-stone-900 group-hover:text-stone-700 transition line-clamp-1 mt-1">
                        {item.productName}
                      </h3>

                      {/* Commercial Unit & Packaging */}
                      <p className="text-xs text-stone-500 mt-0.5">
                        Commercial Packaging: Per {item.unit}
                      </p>
                    </div>

                    {/* Quick Bulk Requisition Chips */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400">
                        Quick Add:
                      </span>
                      <button
                        type="button"
                        onClick={() => addQuickUnits(item.id, 10)}
                        className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md text-[11px] font-mono font-bold transition cursor-pointer"
                      >
                        +10
                      </button>
                      <button
                        type="button"
                        onClick={() => addQuickUnits(item.id, 25)}
                        className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md text-[11px] font-mono font-bold transition cursor-pointer"
                      >
                        +25
                      </button>
                      <button
                        type="button"
                        onClick={() => addQuickUnits(item.id, 50)}
                        className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md text-[11px] font-mono font-bold transition cursor-pointer"
                      >
                        +50
                      </button>
                    </div>

                    {/* Price & Action Row (Matching B2C MenuItemCard Bottom Bar) */}
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-bold text-stone-900 font-mono">
                            ₹{item.b2bPrice.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-stone-400 font-normal">
                            /{item.unit}
                          </span>
                        </div>
                        <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-800">
                          Contract Rate
                        </span>
                      </div>

                      {/* Stepper / Add Button */}
                      {currentQty === 0 ? (
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="px-4 py-1.5 bg-[#1C1917] hover:bg-stone-800 text-white rounded-full text-xs font-medium tracking-wide transition flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-full border border-stone-200">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, currentQty - 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-stone-700 hover:text-stone-950 shadow-2xs cursor-pointer active:scale-95"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={currentQty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              updateQuantity(item.id, isNaN(val) ? 0 : val);
                            }}
                            className="w-10 text-center font-mono font-bold text-xs text-stone-900 bg-transparent focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, currentQty + 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-[#1C1917] text-white shadow-2xs cursor-pointer active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* 5. FLOATING REQUISITION TRAY (Matching B2C MobileCartBar)           */}
      {/* =================================================================== */}
      {totalUnits > 0 && (
        <div className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:right-8 sm:w-[420px] z-30 animate-in slide-in-from-bottom duration-300">
          <button
            onClick={() => setIsReviewDrawerOpen(true)}
            className="w-full bg-[#1C1917] hover:bg-stone-800 text-white rounded-2xl p-3.5 shadow-2xl flex items-center justify-between border border-stone-700/50 active:scale-[0.99] transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-stone-200">
                <ShoppingBag className="w-4 h-4 text-amber-300" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold leading-none">
                  {selectedItemsCount} items • {totalUnits} units
                </p>
                <p className="text-[11px] text-stone-300 mt-0.5">
                  Est. Total: <strong className="font-mono">₹{totalAmount.toFixed(2)}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-white text-stone-900 px-3.5 py-1.5 rounded-xl text-xs font-bold">
              <span>Review & Send</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* 6. REQUISITION REVIEW DRAWER (Matching B2C CartDrawer)              */}
      {/* =================================================================== */}
      {isReviewDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FAF8F5] w-full max-w-lg h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 bg-white border-b border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400 block">
                  Requisition Slip
                </span>
                <h3 className="text-lg font-serif font-bold text-stone-900">
                  {session.departmentName} Order
                </h3>
              </div>
              <button
                onClick={() => setIsReviewDrawerOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-800 rounded-full hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Delivery Shift & Timing */}
              <div className="bg-white border border-stone-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-900 uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-amber-700" />
                  <span>Delivery Schedule</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      Delivery Date
                    </label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      Shift Slot
                    </label>
                    <select
                      value={deliveryTimeSlot}
                      onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900"
                    >
                      <option value="Morning (08:30 AM - 10:00 AM)">
                        Morning (08:30 - 10:00 AM)
                      </option>
                      <option value="Afternoon (01:00 PM - 02:30 PM)">
                        Afternoon (01:00 - 02:30 PM)
                      </option>
                      <option value="Evening High-Tea (04:30 PM - 06:00 PM)">
                        High-Tea (04:30 - 06:00 PM)
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Special Instructions & Notes */}
              <div className="bg-white border border-stone-200/90 rounded-2xl p-4 space-y-2 shadow-2xs">
                <label className="block text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Kitchen Notes & PO Number (Optional)
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. PO# 9942, deliver to 3rd Floor tech pantry, pack in 2 separate crates..."
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 resize-none placeholder:text-stone-400"
                />
              </div>

              {/* Requisition Products Table */}
              <div className="bg-white border border-stone-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-stone-900 uppercase tracking-wider pb-2 border-b border-stone-100">
                  <span>Selected Products ({selectedItemsCount})</span>
                  <span>{totalUnits} Units Total</span>
                </div>

                <div className="divide-y divide-stone-100">
                  {catalog
                    .filter((item) => (quantities[item.id] || 0) > 0)
                    .map((item) => {
                      const qty = quantities[item.id];
                      const subtotal = qty * item.b2bPrice;

                      return (
                        <div
                          key={item.id}
                          className="py-3 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-stone-900 truncate">
                              {item.productName}
                            </h4>
                            <span className="text-[11px] text-stone-500 font-mono">
                              ₹{item.b2bPrice.toFixed(2)} / {item.unit}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1.5 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, qty - 1)}
                                className="text-stone-600 hover:text-stone-950 p-0.5 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono font-bold text-xs text-stone-900 min-w-[20px] text-center">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, qty + 1)}
                                className="text-stone-600 hover:text-stone-950 p-0.5 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <span className="font-mono font-bold text-stone-900 min-w-[60px] text-right">
                              ₹{subtotal.toFixed(2)}
                            </span>

                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 0)}
                              className="text-stone-400 hover:text-rose-600 p-1 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Drawer Footer & Action Button */}
            <div className="p-5 bg-white border-t border-stone-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 font-medium">Estimated Requisition Total</span>
                <span className="font-mono font-black text-lg text-stone-900">
                  ₹{totalAmount.toFixed(2)}
                </span>
              </div>
              <p className="text-[10px] text-stone-400">
                Invoiced directly to {displayClientName} corporate account under contracted monthly terms.
              </p>

              <button
                type="button"
                onClick={handleSendOrder}
                disabled={isSubmitting || totalUnits === 0}
                className="w-full py-3.5 bg-[#1C1917] hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Transmitting to Bakery Ovens...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-amber-300" />
                    <span>CONFIRM & TRANSMIT TO KITCHEN ➔</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 7. REQUISITION HISTORY DRAWER                                       */}
      {/* =================================================================== */}
      {isHistoryDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FAF8F5] w-full max-w-lg h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 bg-white border-b border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400 block">
                  Department Audit Log
                </span>
                <h3 className="text-lg font-serif font-bold text-stone-900">
                  Past Requisitions ({orderHistory.length})
                </h3>
              </div>
              <button
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-800 rounded-full hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {isLoadingHistory ? (
                <div className="p-12 text-center text-xs uppercase tracking-widest text-stone-400">
                  Loading order history...
                </div>
              ) : orderHistory.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-xs">
                  No previous requisitions found for {session.departmentName}.
                </div>
              ) : (
                orderHistory.map((order) => {
                  const statusColors: Record<string, string> = {
                    RECEIVED: 'bg-amber-100 text-amber-900 border-amber-300',
                    CONFIRMED: 'bg-blue-100 text-blue-900 border-blue-300',
                    BAKING: 'bg-orange-100 text-orange-900 border-orange-300',
                    PACKED: 'bg-purple-100 text-purple-900 border-purple-300',
                    DELIVERED: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                    CANCELLED: 'bg-stone-100 text-stone-500 border-stone-200',
                  };

                  return (
                    <div
                      key={order.id}
                      className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono font-bold text-xs text-stone-900 block">
                            #{order.orderNumber}
                          </span>
                          <span className="text-[11px] text-stone-500">
                            Delivery: {order.deliveryDate} ({order.deliveryTimeSlot.split(' ')[0]})
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            statusColors[order.status] || 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>

                      {/* Items Preview */}
                      <div className="bg-stone-50 rounded-xl p-2.5 text-xs text-stone-700 space-y-1">
                        {order.items.map((i, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span className="truncate max-w-[240px]">
                              {i.quantity}x {i.productName}
                            </span>
                            <span className="font-mono text-stone-500">
                              ₹{i.subtotal.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100">
                        <span className="font-medium text-stone-500">
                          Total: <strong className="font-mono text-stone-900">₹{order.totalAmount.toFixed(2)}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSubmittedOrder(order);
                            setIsHistoryDrawerOpen(false);
                          }}
                          className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                        >
                          <span>View Receipt</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 8. ORDER CONFIRMATION & RECEIPT MODAL                               */}
      {/* =================================================================== */}
      {submittedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#FAF8F5] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#1C1917] text-white p-6 text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400 block">
                Requisition Transmitted
              </span>
              <h2 className="text-xl font-serif font-bold">
                Order Dispatched to Bakery Kitchen!
              </h2>
              <p className="text-xs text-stone-300">
                Your department order has been recorded into the kitchen tally.
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="bg-white border border-stone-200 rounded-2xl p-4 grid grid-cols-2 gap-3 text-xs shadow-2xs">
                <div>
                  <span className="text-stone-400 block font-semibold uppercase text-[10px]">
                    Requisition Slip #
                  </span>
                  <span className="font-mono font-bold text-stone-900">
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
                    Time Shift
                  </span>
                  <span className="font-bold text-stone-900">
                    {submittedOrder.deliveryTimeSlot}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-2 shadow-2xs">
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  Requested Items & Quantities
                </h4>
                <div className="divide-y divide-stone-100">
                  {submittedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-stone-900 block">
                          {item.productName}
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">
                          ₹{item.b2bPrice.toFixed(2)} / {item.unit}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-stone-900 text-sm">
                          {item.quantity} {item.unit}
                        </span>
                        <span className="block text-[10px] text-stone-400 font-mono">
                          ₹{item.subtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {submittedOrder.notes && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <span className="font-bold block text-[10px] uppercase">
                    Delivery Note:
                  </span>
                  {submittedOrder.notes}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="bg-white p-4 border-t border-stone-200 flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
              <button
                type="button"
                onClick={() => setSubmittedOrder(null)}
                className="flex-1 py-2.5 px-4 bg-[#1C1917] hover:bg-stone-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-md cursor-pointer"
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
