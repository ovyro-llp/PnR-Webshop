'use client';

import React, { useState, useEffect } from 'react';
import { OUTLETS } from '@/lib/data/mock-data';
import { OutletStockItem, Outlet, MenuItem, MenuCategory } from '@/types';
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
  Layers,
  Upload,
  X,
  Check,
  Edit2,
  Trash2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import Image from 'next/image';

const CATEGORIES: MenuCategory[] = [
  'Puffs & Patties',
  'Savory Rolls',
  'Cakes & Pastries',
  'Snack Combos',
  'Breads & Buns',
  'Beverages',
];

const PRESET_IMAGES = [
  {
    name: 'Veg Puff',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800',
  },
  {
    name: 'Savory Roll',
    url: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&q=80&w=800',
  },
  {
    name: 'Cake Pastry',
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800',
  },
  {
    name: 'Artisan Bread',
    url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=800',
  },
  {
    name: 'Beverage / Chai',
    url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=800',
  },
];

export default function OutletInventoryPage() {
  const [activeTab, setActiveTab] = useState<'outlet' | 'catalog'>('outlet');
  const [outlets, setOutlets] = useState<Outlet[]>(OUTLETS);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('college-road');
  const [stockItems, setStockItems] = useState<OutletStockItem[]>([]);
  const [masterProducts, setMasterProducts] = useState<MenuItem[]>([]);
  const [isOutletOpen, setIsOutletOpen] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Modals state
  const [isAssignDrawerOpen, setIsAssignDrawerOpen] = useState<boolean>(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);

  // New Product Form State
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    description: '',
    category: 'Puffs & Patties' as MenuCategory,
    price: '',
    originalPrice: '',
    image: PRESET_IMAGES[0].url,
    isVeg: true,
    isBestseller: false,
    isSpicy: false,
    preparationTimeMinutes: 15,
    initialStock: 25,
    availableOutlets: ['college-road', 'nashik-road', 'indira-nagar'],
  });

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

  const fetchMasterProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && data.products) {
        setMasterProducts(data.products);
      }
    } catch (err) {
      console.error('Failed to load master products', err);
    }
  };

  useEffect(() => {
    fetchOutlets();
    fetchMasterProducts();
  }, []);

  useEffect(() => {
    fetchInventory(selectedOutlet);
  }, [selectedOutlet]);

  const activeOutletObj = outlets.find((o) => o.slug === selectedOutlet);

  // 1-Tap Toggle Availability (Quick 86)
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

  // Adjust Quantity (+ / -)
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

  // Toggle Outlet Accepting Orders
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

  // 1-Tap Toggle Product Assigned to this Outlet
  const handleToggleProductForOutlet = async (itemId: string, shouldBeActive: boolean) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_OUTLET_AVAILABILITY',
          outletSlug: selectedOutlet,
          itemId,
          isAvailable: shouldBeActive,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage(data.message);
        fetchInventory(selectedOutlet);
        fetchMasterProducts();
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      console.error('Failed to toggle outlet availability', err);
    }
  };

  // Bulk Assign All Master Products to Current Outlet
  const handleSelectAllMasterProducts = async () => {
    const allIds = masterProducts.map((p) => p.id);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BULK_ASSIGN_OUTLET',
          outletSlug: selectedOutlet,
          itemIds: allIds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`✓ All ${allIds.length} master products activated for ${selectedOutlet}`);
        fetchInventory(selectedOutlet);
        fetchMasterProducts();
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      console.error('Bulk assign error', err);
    }
  };

  // Create Product in Master Catalog
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name.trim() || !newProductForm.price) {
      alert('Please enter a product name and price');
      return;
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_PRODUCT',
          productData: {
            name: newProductForm.name,
            description: newProductForm.description || 'Freshly baked artisanal specialty handcrafted in Nashik',
            category: newProductForm.category,
            price: Number(newProductForm.price),
            originalPrice: newProductForm.originalPrice ? Number(newProductForm.originalPrice) : undefined,
            image: newProductForm.image,
            isVeg: newProductForm.isVeg,
            isBestseller: newProductForm.isBestseller,
            isSpicy: newProductForm.isSpicy,
            preparationTimeMinutes: Number(newProductForm.preparationTimeMinutes) || 15,
            initialStock: Number(newProductForm.initialStock) || 25,
            availableOutlets: newProductForm.availableOutlets,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage(`✓ Product "${data.product.name}" created and added to master catalog!`);
        setIsAddProductModalOpen(false);
        setNewProductForm({
          name: '',
          description: '',
          category: 'Puffs & Patties',
          price: '',
          originalPrice: '',
          image: PRESET_IMAGES[0].url,
          isVeg: true,
          isBestseller: false,
          isSpicy: false,
          preparationTimeMinutes: 15,
          initialStock: 25,
          availableOutlets: ['college-road', 'nashik-road', 'indira-nagar'],
        });
        fetchMasterProducts();
        fetchInventory(selectedOutlet);
        setTimeout(() => setStatusMessage(''), 4000);
      } else {
        alert(data.error || 'Failed to create product');
      }
    } catch (err) {
      console.error('Failed to create product', err);
    }
  };

  // Save Editing Master Product
  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_PRODUCT',
          id: editingProduct.id,
          updates: {
            name: editingProduct.name,
            category: editingProduct.category,
            price: Number(editingProduct.price),
            originalPrice: editingProduct.originalPrice ? Number(editingProduct.originalPrice) : undefined,
            description: editingProduct.description,
            image: editingProduct.image,
            isVeg: editingProduct.isVeg,
            availableOutlets: editingProduct.availableOutlets,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage(`✓ Master product "${editingProduct.name}" updated!`);
        setEditingProduct(null);
        fetchMasterProducts();
        fetchInventory(selectedOutlet);
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      console.error('Update error', err);
    }
  };

  // Archive Master Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to archive "${name}" from the central master catalog?`)) {
      return;
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_PRODUCT',
          id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage(`✓ Product "${name}" archived from catalog`);
        fetchMasterProducts();
        fetchInventory(selectedOutlet);
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  // Filter Active Stock Items
  const filteredStockItems = stockItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Filter Master Products
  const filteredMasterProducts = masterProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || product.category === selectedCategory;
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
      {/* Top Main Navigation Switcher: Outlet Inventory vs Central Master Catalog */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-stone-100 text-stone-900 border border-stone-200">
              <Package className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight">
              {activeTab === 'outlet' ? 'Outlet Inventory & 86-ing Terminal' : 'Central Master Product Catalog'}
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {activeTab === 'outlet'
              ? 'Select master products for this outlet, adjust live batch counts, and 1-tap 86 sold-out items.'
              : 'Corporate headquarters repository of all products, master pricing, and photography assets across Nashik.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-stone-200 shadow-2xs shrink-0">
          <button
            onClick={() => setActiveTab('outlet')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'outlet'
                ? 'bg-[#1C1917] text-white font-semibold shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Outlet Stock &amp; 86</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-[#1C1917] text-white font-semibold shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Master Catalog</span>
            <span className="text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.2 rounded-full font-bold ml-0.5">
              {masterProducts.length}
            </span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-medium text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* =========================================================================
          TAB 1: OUTLET INVENTORY & 86-ING TERMINAL (FOR OUTLET MANAGERS)
         ========================================================================= */}
      {activeTab === 'outlet' && (
        <div className="space-y-6">
          {/* Outlet Switcher Pills & Kitchen State Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider shrink-0 mr-1">
                Active Outlet:
              </span>
              {outlets.map((outlet) => {
                const isSelected = selectedOutlet === outlet.slug;
                return (
                  <button
                    key={outlet.slug}
                    onClick={() => setSelectedOutlet(outlet.slug)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#1C1917] text-white font-semibold shadow-xs'
                        : 'bg-stone-50 text-stone-600 hover:text-stone-900 border border-stone-200'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>{outlet.name.replace("Puffs 'n' Rolls - ", '')}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions: Assign from Master Catalog & Pause */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsAssignDrawerOpen(true)}
                className="px-4 py-2 bg-[#1C1917] hover:bg-stone-800 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Assign from Master Catalog</span>
              </button>

              <button
                onClick={handleToggleOutletOpen}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  isOutletOpen
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{isOutletOpen ? 'Pause Orders' : 'Resume'}</span>
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                Assigned Products
              </p>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-serif font-bold text-stone-900">{totalItems}</span>
                <span className="text-[10px] text-stone-400 font-mono">in this outlet</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                In Stock &amp; Live
              </p>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-serif font-bold text-emerald-700">{inStockCount}</span>
                <span className="text-[10px] text-emerald-600 font-mono">Available</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                Sold Out (86-ed)
              </p>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-serif font-bold text-rose-600">{soldOutCount}</span>
                <span className="text-[10px] text-rose-500 font-mono">Inactive</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                Low Stock Alert
              </p>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-serif font-bold text-amber-600">{lowStockCount}</span>
                <span className="text-[10px] text-amber-600 font-mono">≤ 5 units</span>
              </div>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search products in this outlet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-2xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900 shadow-2xs"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {['ALL', ...CATEGORIES].map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#1C1917] text-white font-semibold'
                        : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Outlet Items Grid */}
          {isLoading ? (
            <div className="py-16 text-center text-xs font-mono text-stone-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-stone-600" />
              <span>Loading outlet stock matrix...</span>
            </div>
          ) : filteredStockItems.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-stone-200/90 space-y-4">
              <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
                <Package className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  No products assigned to {activeOutletObj?.name || 'this outlet'}
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Select items from P&amp;R&apos;s Central Master Catalog to activate them on this outlet&apos;s storefront.
                </p>
              </div>
              <button
                onClick={() => setIsAssignDrawerOpen(true)}
                className="px-5 py-2.5 bg-[#1C1917] text-white rounded-full text-xs font-semibold hover:bg-stone-800 transition shadow-xs cursor-pointer"
              >
                + Assign Products from Master Catalog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredStockItems.map((item) => {
                const isSoldOut = !item.isAvailable || item.stockQuantity === 0;
                const isLowStock =
                  item.isAvailable &&
                  item.stockQuantity > 0 &&
                  item.stockQuantity <= item.lowStockThreshold;

                return (
                  <div
                    key={item.itemId}
                    className={`p-4 rounded-3xl border transition shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between gap-3 bg-white ${
                      isSoldOut ? 'border-stone-200 opacity-75' : 'border-stone-200/90'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono uppercase font-semibold text-stone-400">
                            {item.category}
                          </span>
                          <h3 className="font-serif font-bold text-sm text-stone-900 mt-0.5 leading-snug">
                            {item.name}
                          </h3>
                        </div>

                        <span className="text-xs font-bold text-stone-900 font-mono shrink-0">
                          ₹{item.customPrice || item.basePrice}
                        </span>
                      </div>

                      {/* Stock Status Badge */}
                      <div className="flex items-center gap-2 mt-2">
                        {isSoldOut ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            Sold Out (86-ed)
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock ({item.stockQuantity} left)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            In Stock ({item.stockQuantity} ready)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Controls Bar: Stock Counter, 1-Tap 86 Toggle, Remove from Outlet */}
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1 bg-stone-50 rounded-full border border-stone-200 px-2 py-1">
                        <button
                          onClick={() => handleAdjustQuantity(item, -5)}
                          disabled={item.stockQuantity === 0}
                          className="w-6 h-6 rounded-full text-stone-600 hover:text-stone-900 hover:bg-stone-200 flex items-center justify-center text-xs font-bold transition disabled:opacity-30 cursor-pointer"
                          title="-5 units"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono font-bold text-stone-900 min-w-[28px] text-center">
                          {item.stockQuantity}
                        </span>
                        <button
                          onClick={() => handleAdjustQuantity(item, 5)}
                          className="w-6 h-6 rounded-full text-stone-600 hover:text-stone-900 hover:bg-stone-200 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                          title="+5 units"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* 1-Tap 86 / In Stock Button */}
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition cursor-pointer ${
                          isSoldOut
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isSoldOut ? 'Mark In Stock' : '86 Item'}
                      </button>

                      {/* Remove from Outlet shortcut */}
                      <button
                        onClick={() => handleToggleProductForOutlet(item.itemId, false)}
                        className="p-1.5 text-stone-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Remove from this outlet's menu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: CENTRAL MASTER PRODUCT CATALOG (HEADQUARTERS)
         ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="p-6 bg-white rounded-3xl border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900">
                  Bakery Master Catalog
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-mono font-bold uppercase border border-stone-200">
                  {masterProducts.length} Items
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1 max-w-xl">
                Master recipes and base pricing defined here are automatically available for outlet managers
                to select and activate across all Nashik locations.
              </p>
            </div>

            <button
              onClick={() => setIsAddProductModalOpen(true)}
              className="px-5 py-2.5 bg-[#1C1917] hover:bg-stone-800 text-white rounded-full text-xs font-semibold flex items-center gap-2 transition shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Upload New Product</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search master catalog by name, category, recipe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-2xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {['ALL', ...CATEGORIES].map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#1C1917] text-white font-semibold'
                        : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Master Products Table / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMasterProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-3xl border border-stone-200/90 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200/80">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            product.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        />
                        <span className="text-[10px] font-mono uppercase font-semibold text-stone-400 truncate">
                          {product.category}
                        </span>
                      </div>
                      <h3 className="font-serif font-bold text-sm text-stone-900 truncate mt-0.5">
                        {product.name}
                      </h3>
                      <p className="text-xs font-mono font-bold text-stone-900 mt-1">
                        ₹{product.price}{' '}
                        {product.originalPrice && (
                          <span className="line-through text-stone-400 font-normal text-[11px]">
                            ₹{product.originalPrice}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-500 mt-2.5 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>

                  {/* Outlet Availability Badges */}
                  <div className="mt-3 pt-3 border-t border-stone-100">
                    <span className="text-[10px] font-mono text-stone-400 uppercase font-semibold block mb-1">
                      Assigned Outlets ({product.availableOutlets.length}/{outlets.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {outlets.map((o) => {
                        const isCarried = product.availableOutlets.includes(o.slug);
                        return (
                          <span
                            key={o.slug}
                            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-medium ${
                              isCarried
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-100 text-stone-400'
                            }`}
                          >
                            {o.name.replace("Puffs 'n' Rolls - ", '')}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Edit & Archive Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="px-3 py-1 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-medium border border-stone-200 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3 text-stone-500" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeleteProduct(product.id, product.name)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    title="Archive Product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          DRAWER MODAL: ASSIGN FROM MASTER CATALOG TO CURRENT OUTLET
         ========================================================================= */}
      {isAssignDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsAssignDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
            <div className="w-screen max-w-lg bg-[#FAF8F5] shadow-2xl flex flex-col justify-between border-l border-stone-200 animate-in slide-in-from-right duration-250">
              {/* Header */}
              <div className="p-5 border-b border-stone-200 bg-white flex items-center justify-between">
                <div>
                  <h2 className="text-base font-serif font-bold text-stone-900">
                    Assign to {activeOutletObj?.name}
                  </h2>
                  <p className="text-xs text-stone-500">
                    Check products from P&amp;R Master Catalog to immediately activate them for this outlet
                  </p>
                </div>
                <button
                  onClick={() => setIsAssignDrawerOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-800 rounded-full hover:bg-stone-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Quick Selection Shortcuts */}
                <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-stone-200/90 shadow-2xs">
                  <span className="text-xs text-stone-600 font-medium">
                    {masterProducts.filter((p) => p.availableOutlets.includes(selectedOutlet)).length} of {masterProducts.length} items active
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllMasterProducts}
                      className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-full text-xs font-semibold transition cursor-pointer"
                    >
                      Select All
                    </button>
                  </div>
                </div>

                {/* Master Products List with Checkboxes */}
                <div className="space-y-2">
                  {masterProducts.map((product) => {
                    const isChecked = product.availableOutlets.includes(selectedOutlet);
                    return (
                      <div
                        key={product.id}
                        onClick={() => handleToggleProductForOutlet(product.id, !isChecked)}
                        className={`p-3 bg-white rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                          isChecked
                            ? 'border-stone-900 bg-white ring-1 ring-stone-900 shadow-2xs'
                            : 'border-stone-200/90 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by parent onClick
                            className="w-4 h-4 rounded text-stone-900 focus:ring-stone-900 cursor-pointer"
                          />
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  product.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                                }`}
                              />
                              <p className="text-xs font-bold text-stone-900 truncate">
                                {product.name}
                              </p>
                            </div>
                            <p className="text-[11px] text-stone-400">
                              {product.category} • ₹{product.price}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                            isChecked
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {isChecked ? 'Active' : 'Add'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-5 border-t border-stone-200 bg-white">
                <button
                  type="button"
                  onClick={() => setIsAssignDrawerOpen(false)}
                  className="w-full py-3 bg-[#1C1917] hover:bg-stone-800 text-white rounded-full text-xs font-semibold uppercase tracking-wider transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Done / Synchronize Outlet</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: + UPLOAD NEW PRODUCT (CENTRAL MASTER CATALOG)
         ========================================================================= */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Upload Product to Central Catalog
                </h3>
                <p className="text-xs text-stone-500">
                  Adds new item to P&amp;R master catalog and provisions outlet stock
                </p>
              </div>
              <button
                onClick={() => setIsAddProductModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-800 rounded-full hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special Paneer Makhani Puff"
                  value={newProductForm.name}
                  onChange={(e) =>
                    setNewProductForm({ ...newProductForm, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Category *
                  </label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) =>
                      setNewProductForm({
                        ...newProductForm,
                        category: e.target.value as MenuCategory,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Base Master Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 45"
                    value={newProductForm.price}
                    onChange={(e) =>
                      setNewProductForm({ ...newProductForm, price: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Flaky layers, spiced filling, freshly baked daily..."
                  value={newProductForm.description}
                  onChange={(e) =>
                    setNewProductForm({ ...newProductForm, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 resize-none"
                />
              </div>

              {/* Photo Image Presets & URL */}
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Product Photo Asset
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 mb-2">
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() =>
                        setNewProductForm({ ...newProductForm, image: preset.url })
                      }
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border shrink-0 transition cursor-pointer ${
                        newProductForm.image === preset.url
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-stone-50 text-stone-600 border-stone-200'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  placeholder="https://... photo url"
                  value={newProductForm.image}
                  onChange={(e) =>
                    setNewProductForm({ ...newProductForm, image: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono focus:bg-white focus:outline-none"
                />
              </div>

              {/* Toggles: Pure Veg & Initial Stock */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 p-2.5 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProductForm.isVeg}
                    onChange={(e) =>
                      setNewProductForm({ ...newProductForm, isVeg: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-600"
                  />
                  <span className="text-xs font-semibold text-stone-800">100% Pure Veg</span>
                </label>

                <div>
                  <input
                    type="number"
                    placeholder="Batch stock: 25"
                    value={newProductForm.initialStock}
                    onChange={(e) =>
                      setNewProductForm({
                        ...newProductForm,
                        initialStock: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono"
                  />
                </div>
              </div>

              {/* Outlet Availability Assignment */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  Assign to Outlets
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {outlets.map((outlet) => {
                    const isChecked = newProductForm.availableOutlets.includes(outlet.slug);
                    return (
                      <button
                        type="button"
                        key={outlet.slug}
                        onClick={() => {
                          const updated = isChecked
                            ? newProductForm.availableOutlets.filter((s) => s !== outlet.slug)
                            : [...newProductForm.availableOutlets, outlet.slug];
                          setNewProductForm({ ...newProductForm, availableOutlets: updated });
                        }}
                        className={`p-2 rounded-xl border text-[11px] font-medium transition cursor-pointer text-center ${
                          isChecked
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-stone-50 text-stone-600 border-stone-200'
                        }`}
                      >
                        {outlet.name.replace("Puffs 'n' Rolls - ", '')}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1C1917] hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer"
                >
                  Save &amp; Upload Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT MASTER PRODUCT
         ========================================================================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Edit Master Product
                </h3>
                <p className="text-xs text-stone-500">
                  Updates master recipe and cascades pricing across outlets
                </p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 text-stone-400 hover:text-stone-800 rounded-full hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Category
                  </label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value as MenuCategory,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Master Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editingProduct.description}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1C1917] hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
