'use client';

import React, { useState, useEffect } from 'react';
import { OUTLETS } from '@/lib/data/mock-data';
import { OutletStockItem, Outlet } from '@/types';
import {
  Package,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Minus,
  RefreshCw,
  Power,
  Store,
} from 'lucide-react';

export default function OutletInventoryPage() {
  const [outlets, setOutlets] = useState<Outlet[]>(OUTLETS);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('college-road');
  const [stockItems, setStockItems] = useState<OutletStockItem[]>([]);
  const [isOutletOpen, setIsOutletOpen] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>('');

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

  const fetchInventory = async (outletSlug: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/inventory?outlet=${outletSlug}`);
      const data = await res.json();
      if (data.success) {
        setStockItems(data.stock);
        setIsOutletOpen(data.isOpen);
      }
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOutlets();
  }, []);

  useEffect(() => {
    fetchInventory(selectedOutlet);
  }, [selectedOutlet]);

  const handleToggleAvailability = async (item: OutletStockItem) => {
    const newStatus = !item.isAvailable;
    const newQty = newStatus ? (item.stockQuantity === 0 ? 10 : item.stockQuantity) : 0;

    // Optimistic UI
    setStockItems((prev) =>
      prev.map((s) =>
        s.itemId === item.itemId
          ? {
              ...s,
              isAvailable: newStatus,
              stockQuantity: newQty,
              lastUpdated: new Date().toISOString(),
              updatedBy: 'Store Manager',
            }
          : s
      )
    );

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outletSlug: selectedOutlet,
          itemId: item.itemId,
          isAvailable: newStatus,
          stockQuantity: newQty,
          updatedBy: 'Store Manager (Quick 86)',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage(
          newStatus
            ? `✓ ${item.name} is now IN STOCK`
            : `⚠️ ${item.name} is now SOLD OUT (86-ed)`
        );
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      console.error('Update failed', err);
      fetchInventory(selectedOutlet);
    }
  };

  const handleAdjustQuantity = async (item: OutletStockItem, delta: number) => {
    const newQty = Math.max(0, item.stockQuantity + delta);
    const newStatus = newQty > 0;

    setStockItems((prev) =>
      prev.map((s) =>
        s.itemId === item.itemId
          ? {
              ...s,
              stockQuantity: newQty,
              isAvailable: newStatus,
              lastUpdated: new Date().toISOString(),
            }
          : s
      )
    );

    try {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outletSlug: selectedOutlet,
          itemId: item.itemId,
          stockQuantity: newQty,
          isAvailable: newStatus,
          updatedBy: 'Store Manager',
        }),
      });
    } catch (err) {
      console.error('Adjust stock error', err);
      fetchInventory(selectedOutlet);
    }
  };

  const handleToggleOutletOpen = async () => {
    const nextState = !isOutletOpen;
    setIsOutletOpen(nextState);

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outletSlug: selectedOutlet,
          toggleOutletOpen: nextState,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(data.message);
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      console.error('Failed to toggle outlet status', err);
    }
  };

  const categories = ['ALL', ...Array.from(new Set(stockItems.map((s) => s.category)))];

  const filteredItems = stockItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalItems = stockItems.length;
  const inStockCount = stockItems.filter((s) => s.isAvailable && s.stockQuantity > 0).length;
  const soldOutCount = totalItems - inStockCount;
  const lowStockCount = stockItems.filter(
    (s) => s.isAvailable && s.stockQuantity > 0 && s.stockQuantity <= s.lowStockThreshold
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Outlet Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-stone-100 text-stone-900 border border-stone-200">
              <Package className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight">
              Outlet Stock &amp; 86-ing Terminal
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Real-time outlet stock levels, 1-tap sold-out toggles, and kitchen rush pause controls
          </p>
        </div>

        {/* Outlet Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-stone-200 overflow-x-auto no-scrollbar shadow-2xs">
          {outlets.map((outlet) => {
            const isSelected = selectedOutlet === outlet.slug;
            return (
              <button
                key={outlet.slug}
                onClick={() => setSelectedOutlet(outlet.slug)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#1C1917] text-white font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>{outlet.name.replace("Puffs 'n' Rolls - ", '')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Outlet Kitchen Operating State & Quick 86 Alert Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full animate-pulse ${
              isOutletOpen ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-serif font-bold text-stone-900">
                {isOutletOpen ? 'Accepting Orders' : 'Kitchen Rush / Orders Paused'}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-semibold ${
                  isOutletOpen
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {isOutletOpen ? 'ONLINE' : 'PAUSED'}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {isOutletOpen
                ? 'Storefront customers can place live delivery and pickup orders'
                : 'Customer checkout is temporarily paused to let the bakery catch up'}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleOutletOpen}
          className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition shrink-0 ${
            isOutletOpen
              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
              : 'bg-[#1C1917] hover:bg-stone-800 text-white'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{isOutletOpen ? 'Pause Outlet Orders' : 'Resume Accepting Orders'}</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-medium text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-xs text-stone-400 block font-medium">Total Items</span>
          <span className="text-2xl font-serif font-bold text-stone-900 mt-1 block">{totalItems}</span>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-xs text-emerald-700 block font-medium">In Stock</span>
          <span className="text-2xl font-serif font-bold text-emerald-800 mt-1 block">{inStockCount}</span>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-xs text-rose-700 block font-medium">Sold Out (86-ed)</span>
          <span className="text-2xl font-serif font-bold text-rose-800 mt-1 block">{soldOutCount}</span>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-xs text-amber-700 block font-medium">Low Stock (&lt; 5)</span>
          <span className="text-2xl font-serif font-bold text-amber-800 mt-1 block">{lowStockCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search bakery items by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 shadow-2xs"
            />
          </div>

          <button
            onClick={() => fetchInventory(selectedOutlet)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 text-xs font-medium transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[#1C1917] text-white font-semibold'
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Item Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const isSoldOut = !item.isAvailable || item.stockQuantity === 0;
          const isLowStock = !isSoldOut && item.stockQuantity <= item.lowStockThreshold;

          return (
            <div
              key={item.itemId}
              className={`p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)] ${
                isSoldOut
                  ? 'bg-stone-50/70 border-stone-200 opacity-75'
                  : isLowStock
                  ? 'bg-amber-50/30 border-amber-200'
                  : 'bg-white border-stone-200/90 hover:border-stone-400'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-stone-400 block">
                      {item.category}
                    </span>
                    <h3 className="text-sm font-serif font-bold text-stone-900 mt-0.5 line-clamp-1">
                      {item.name}
                    </h3>
                  </div>

                  {/* 1-Tap Quick 86 Button */}
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider transition shrink-0 flex items-center gap-1 ${
                      isSoldOut
                        ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                        : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                    }`}
                  >
                    {isSoldOut ? (
                      <>
                        <XCircle className="w-3 h-3 text-rose-600" />
                        <span>Sold Out</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>In Stock</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-bold text-stone-900 font-mono">
                    ₹{item.basePrice}
                  </span>
                  {isLowStock && (
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Low Stock (&lt; 5)
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Stepper & Last Updated Info */}
              <div className="pt-3 mt-4 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 block font-mono">
                    Updated: {new Date(item.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[9px] text-stone-400 font-mono">
                    By: {item.updatedBy || 'Outlet Manager'}
                  </span>
                </div>

                {/* Counter Control */}
                <div className="flex items-center gap-1 bg-stone-100 px-2 py-1 rounded-full border border-stone-200">
                  <button
                    onClick={() => handleAdjustQuantity(item, -1)}
                    disabled={item.stockQuantity <= 0}
                    className="p-1 rounded-full text-stone-600 hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Decrease Stock"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span
                    className={`text-xs font-mono font-bold min-w-[22px] text-center ${
                      isSoldOut ? 'text-rose-600' : isLowStock ? 'text-amber-700' : 'text-stone-900'
                    }`}
                  >
                    {item.stockQuantity}
                  </span>
                  <button
                    onClick={() => handleAdjustQuantity(item, 1)}
                    className="p-1 rounded-full text-stone-600 hover:text-stone-900"
                    title="Increase Stock"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
