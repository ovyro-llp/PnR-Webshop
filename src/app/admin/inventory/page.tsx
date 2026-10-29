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
  Sliders,
  Power,
  Store,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function OutletInventoryPage() {
  const [selectedOutlet, setSelectedOutlet] = useState<string>('college-road');
  const [stockItems, setStockItems] = useState<OutletStockItem[]>([]);
  const [isOutletOpen, setIsOutletOpen] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>('');

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
      fetchInventory(selectedOutlet); // Revert on failure
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header & Outlet Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Package className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Outlet Inventory &amp; 86-ing Terminal
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time outlet stock levels, 1-tap sold-out toggles, and kitchen load controls
          </p>
        </div>

        {/* Outlet Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800 overflow-x-auto no-scrollbar">
          {OUTLETS.map((outlet) => {
            const isSelected = selectedOutlet === outlet.slug;
            return (
              <button
                key={outlet.slug}
                onClick={() => setSelectedOutlet(outlet.slug)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full animate-pulse ${
              isOutletOpen ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {isOutletOpen ? 'Accepting Orders' : 'Kitchen Rush / Orders Paused'}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-semibold ${
                  isOutletOpen
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}
              >
                {isOutletOpen ? 'ONLINE' : 'PAUSED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isOutletOpen
                ? 'Storefront customers can place live delivery and pickup orders'
                : 'Customer checkout is temporarily paused to let the bakery catch up'}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleOutletOpen}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shrink-0 ${
            isOutletOpen
              ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{isOutletOpen ? 'Emergency Pause Outlet' : 'Resume Accepting Orders'}</span>
        </button>
      </div>

      {/* Status Feedback Toast */}
      {statusMessage && (
        <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs font-medium text-amber-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block font-medium">Total Items</span>
          <span className="text-2xl font-bold text-white mt-1 block">{totalItems}</span>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-emerald-400 block font-medium">In Stock</span>
          <span className="text-2xl font-bold text-emerald-300 mt-1 block">{inStockCount}</span>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-rose-400 block font-medium">Sold Out (86-ed)</span>
          <span className="text-2xl font-bold text-rose-300 mt-1 block">{soldOutCount}</span>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-amber-400 block font-medium">Low Stock (&lt; 5)</span>
          <span className="text-2xl font-bold text-amber-300 mt-1 block">{lowStockCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search bakery items by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <button
            onClick={() => fetchInventory(selectedOutlet)}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs transition"
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                selectedCategory === cat
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Item Grid (Mobile-friendly card list) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredItems.map((item) => {
          const isSoldOut = !item.isAvailable || item.stockQuantity === 0;
          const isLowStock = !isSoldOut && item.stockQuantity <= item.lowStockThreshold;

          return (
            <div
              key={item.itemId}
              className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                isSoldOut
                  ? 'bg-slate-900/40 border-rose-900/30'
                  : isLowStock
                  ? 'bg-slate-900 border-amber-900/40'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                      {item.category}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5 line-clamp-1">
                      {item.name}
                    </h3>
                  </div>

                  {/* 1-Tap Quick 86 Button */}
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition shrink-0 flex items-center gap-1 ${
                      isSoldOut
                        ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {isSoldOut ? (
                      <>
                        <XCircle className="w-3 h-3 text-rose-400" />
                        <span>Sold Out</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>In Stock</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-bold text-amber-400 font-mono">
                    ₹{item.basePrice}
                  </span>
                  {isLowStock && (
                    <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Low Stock Warning
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Stepper & Last Updated Info */}
              <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Updated: {new Date(item.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    By: {item.updatedBy || 'Outlet Manager'}
                  </span>
                </div>

                {/* Counter Control */}
                <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => handleAdjustQuantity(item, -1)}
                    disabled={item.stockQuantity <= 0}
                    className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Decrease Stock"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span
                    className={`text-xs font-mono font-bold min-w-[24px] text-center ${
                      isSoldOut ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-white'
                    }`}
                  >
                    {item.stockQuantity}
                  </span>
                  <button
                    onClick={() => handleAdjustQuantity(item, 1)}
                    className="p-1 rounded text-slate-400 hover:text-white"
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
