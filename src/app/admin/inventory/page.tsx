'use client';

import React, { useState, useEffect } from 'react';
import { OUTLETS } from '@/lib/data/mock-data';
import { OutletStockItem, Outlet, MenuItem, MenuCategory, MediaUpload, Category, SubCategory } from '@/types';
import { OutletSelector } from '@/components/admin/OutletSelector';
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
  Database,
  UploadCloud,
  Image as ImageIcon,
  Copy,
  ExternalLink,
  FileText,
  Tag,
  FolderTree,
  ChevronRight,
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
  const [activeTab, setActiveTab] = useState<'outlet' | 'catalog' | 'media'>('outlet');
  const [outlets, setOutlets] = useState<Outlet[]>(OUTLETS);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('college-road');
  const [stockItems, setStockItems] = useState<OutletStockItem[]>([]);
  const [masterProducts, setMasterProducts] = useState<MenuItem[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaUpload[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState<boolean>(false);
  const [mediaSearchQuery, setMediaSearchQuery] = useState<string>('');
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState<boolean>(false);
  const [mediaTargetMode, setMediaTargetMode] = useState<'new' | 'edit'>('new');
  const [isOutletOpen, setIsOutletOpen] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('ALL');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [newCategoryDesc, setNewCategoryDesc] = useState<string>('');
  const [newSubCategoryName, setNewSubCategoryName] = useState<string>('');
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
    subCategory: '',
    subCategoryId: '',
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

  const fetchMediaAssets = async () => {
    try {
      const res = await fetch('/api/media?limit=100');
      const data = await res.json();
      if (data.success && data.media) {
        setMediaAssets(data.media);
      }
    } catch (err) {
      console.error('Failed to load media assets', err);
    }
  };

  const handleUploadMediaFile = async (file: File, target: 'new' | 'edit' = 'new') => {
    if (!file.type.startsWith('image/')) {
      setStatusMessage('Please select a valid image file (PNG, JPG, WebP)');
      setTimeout(() => setStatusMessage(''), 4000);
      return;
    }

    setIsUploadingMedia(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const res = await fetch('/api/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type,
            byteSize: file.size,
            dataUrl,
            title: file.name.replace(/\.[^/.]+$/, ''),
            category: 'bakery',
          }),
        });

        const data = await res.json();
        if (data.success && data.media) {
          if (target === 'edit' && editingProduct) {
            setEditingProduct({ ...editingProduct, image: data.media.url });
          } else {
            setNewProductForm((prev) => ({ ...prev, image: data.media.url }));
          }
          await fetchMediaAssets();
          setStatusMessage(`Uploaded to Supabase PostgreSQL: ${file.name}`);
          setTimeout(() => setStatusMessage(''), 4000);
        } else {
          setStatusMessage(`Upload failed: ${data.error || 'Unknown error'}`);
          setTimeout(() => setStatusMessage(''), 4000);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setStatusMessage(`Upload error: ${err.message}`);
      setTimeout(() => setStatusMessage(''), 4000);
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleDeleteMediaAsset = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this media asset from Supabase?')) return;
    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setStatusMessage('Media asset deleted from Supabase PostgreSQL');
        setTimeout(() => setStatusMessage(''), 3000);
        fetchMediaAssets();
      }
    } catch (err: any) {
      console.error('Delete error', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success && data.categories) {
        setCategories(data.categories);
        if (data.categories.length > 0) {
          setSelectedCategoryForSub((prev) => prev || data.categories[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_CATEGORY',
          name: newCategoryName.trim(),
          description: newCategoryDesc.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
        if (data.category) {
          setSelectedCategoryForSub(data.category.id);
        }
        setNewCategoryName('');
        setNewCategoryDesc('');
        setStatusMessage(data.message);
        setTimeout(() => setStatusMessage(''), 4000);
      } else {
        setStatusMessage(data.error || 'Failed to create category');
      }
    } catch (err: any) {
      console.error('Error creating category:', err);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!confirm(`Are you sure you want to delete category "${cat?.name || 'this category'}"? Products will remain in the catalog.`)) {
      return;
    }

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_CATEGORY',
          categoryId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
        if (selectedCategoryForSub === categoryId && data.categories.length > 0) {
          setSelectedCategoryForSub(data.categories[0].id);
        }
        setStatusMessage('Category deleted successfully');
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err: any) {
      console.error('Error deleting category:', err);
    }
  };

  const handleCreateSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryForSub || !newSubCategoryName.trim()) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_SUB_CATEGORY',
          categoryId: selectedCategoryForSub,
          name: newSubCategoryName.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
        setNewSubCategoryName('');
        setStatusMessage(data.message);
        setTimeout(() => setStatusMessage(''), 4000);
      } else {
        setStatusMessage(data.error || 'Failed to create sub-category');
      }
    } catch (err: any) {
      console.error('Error creating sub-category:', err);
    }
  };

  const handleDeleteSubCategory = async (categoryId: string, subCategoryId: string) => {
    if (!confirm('Are you sure you want to delete this sub-category?')) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_SUB_CATEGORY',
          categoryId,
          subCategoryId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
        setStatusMessage('Sub-Category deleted successfully');
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err: any) {
      console.error('Error deleting sub-category:', err);
    }
  };

  useEffect(() => {
    fetchOutlets();
    fetchMasterProducts();
    fetchMediaAssets();
    fetchCategories();
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
            subCategory: newProductForm.subCategory,
            subCategoryId: newProductForm.subCategoryId,
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
          category: categories.length > 0 ? categories[0].name : 'Puffs & Patties',
          subCategory: '',
          subCategoryId: '',
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
            subCategory: editingProduct.subCategory,
            subCategoryId: editingProduct.subCategoryId,
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

  const activeSubCategoryParent = categories.find((c) => c.id === selectedCategoryForSub);

  // Filter Master Products
  const filteredMasterProducts = masterProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.subCategory && product.subCategory.toLowerCase().includes(searchQuery.toLowerCase())) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || product.category === selectedCategory;
    const matchesSub = selectedSubCategory === 'ALL' || product.subCategory === selectedSubCategory;
    return matchesSearch && matchesCat && matchesSub;
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
              {activeTab === 'outlet'
                ? 'Outlet Inventory & 86-ing Terminal'
                : activeTab === 'catalog'
                ? 'Central Master Product Catalog'
                : 'Supabase Media Storage'}
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {activeTab === 'outlet'
              ? 'Select master products for this outlet, adjust live batch counts, and 1-tap 86 sold-out items.'
              : activeTab === 'catalog'
              ? 'Corporate headquarters repository of all products, master pricing, and photography assets across Nashik.'
              : 'Bakery photography and media uploads stored securely in Supabase PostgreSQL.'}
          </p>
        </div>

        {/* Tab Switcher - Wrapped cleanly, zero horizontal scrolling */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 bg-white p-1 rounded-2xl sm:rounded-full border border-stone-200 shadow-2xs shrink-0">
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

          <button
            onClick={() => setActiveTab('media')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'media'
                ? 'bg-[#1C1917] text-white font-semibold shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-amber-500" />
            <span>Supabase Media</span>
            <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full font-bold ml-0.5">
              {mediaAssets.length}
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
          {/* Outlet Switcher & Kitchen State Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            {/* Non-scrolling luxury outlet dropdown selector */}
            <OutletSelector
              outlets={outlets}
              selectedOutlet={selectedOutlet}
              onSelectOutlet={(slug) => setSelectedOutlet(slug)}
              label="Active Kitchen Outlet:"
            />

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

            {/* Category Pills - Natural Wrap, Zero Horizontal Scrolling */}
            <div className="flex flex-wrap items-center gap-1.5">
              {['ALL', ...categories.map((c) => c.name)].map((cat) => {
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

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 rounded-full text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                <span>Categories &amp; Sub-Categories</span>
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-600 text-[10px] font-mono">
                  {categories.length}
                </span>
              </button>

              <button
                onClick={() => setIsAddProductModalOpen(true)}
                className="px-5 py-2.5 bg-[#1C1917] hover:bg-stone-800 text-white rounded-full text-xs font-semibold flex items-center gap-2 transition shadow-xs shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Upload New Product</span>
              </button>
            </div>
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

            {/* Category Pills - Natural Wrap, Zero Horizontal Scrolling */}
            <div className="flex flex-wrap items-center gap-1.5">
              {['ALL', ...categories.map((c) => c.name)].map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSelectedSubCategory('ALL');
                    }}
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

          {/* Sub-Category Filter if selected category has subcategories */}
          {selectedCategory !== 'ALL' &&
            (() => {
              const activeCat = categories.find((c) => c.name === selectedCategory);
              if (!activeCat || !activeCat.subCategories || activeCat.subCategories.length === 0) return null;
              return (
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-stone-50 rounded-2xl border border-stone-200/80">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mr-1 flex items-center gap-1">
                    <FolderTree className="w-3 h-3 text-stone-400" />
                    Sub-Category:
                  </span>
                  <button
                    onClick={() => setSelectedSubCategory('ALL')}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition cursor-pointer ${
                      selectedSubCategory === 'ALL'
                        ? 'bg-stone-900 text-white font-semibold'
                        : 'bg-white text-stone-600 border border-stone-200'
                    }`}
                  >
                    All {selectedCategory}
                  </button>
                  {activeCat.subCategories.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubCategory(sub.name)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition cursor-pointer ${
                        selectedSubCategory === sub.name
                          ? 'bg-stone-900 text-white font-semibold'
                          : 'bg-white text-stone-600 border border-stone-200'
                      }`}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              );
            })()}

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
                          {product.subCategory ? ` › ${product.subCategory}` : ''}
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
          TAB 3: SUPABASE MEDIA ASSETS STUDIO
         ========================================================================= */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          {/* Supabase PostgreSQL DB Connection Card */}
          <div className="p-5 rounded-3xl bg-white border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-stone-900 font-serif">
                    Supabase PostgreSQL Media Storage
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Connected
                  </span>
                </div>
                <p className="text-xs text-stone-500 font-mono mt-0.5">
                  aws-0-ap-south-1.pooler.supabase.com:5432 &bull; table: public.media_uploads
                </p>
              </div>
            </div>

            {/* Direct Media Upload Input */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label className="flex-1 md:flex-none px-4 py-2 bg-[#1C1917] hover:bg-stone-800 text-white rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs">
                <UploadCloud className="w-4 h-4 text-amber-400" />
                <span>{isUploadingMedia ? 'Uploading to Supabase...' : 'Upload Media to Supabase'}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploadingMedia}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadMediaFile(file, 'new');
                  }}
                />
              </label>

              <button
                onClick={fetchMediaAssets}
                className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full transition cursor-pointer"
                title="Refresh Media Assets"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Media Search Bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search media by filename, title, or category..."
              value={mediaSearchQuery}
              onChange={(e) => setMediaSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-2xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900 shadow-2xs"
            />
          </div>

          {/* Media Assets Gallery Grid */}
          {mediaAssets.length === 0 ? (
            <div className="text-center py-16 bg-white border border-stone-200 rounded-3xl p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-stone-800">No media assets in Supabase yet</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Upload bakery photos from your device. They will be stored directly in Supabase PostgreSQL and served with high-performance edge caching.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {mediaAssets
                .filter(
                  (m) =>
                    !mediaSearchQuery ||
                    m.filename.toLowerCase().includes(mediaSearchQuery.toLowerCase()) ||
                    (m.title && m.title.toLowerCase().includes(mediaSearchQuery.toLowerCase()))
                )
                .map((asset) => (
                  <div
                    key={asset.id}
                    className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="relative w-full h-36 bg-stone-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.url}
                        alt={asset.title || asset.filename}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-black/70 text-white backdrop-blur-xs">
                        {asset.mimeType.replace('image/', '').toUpperCase()}
                      </span>
                    </div>

                    <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-semibold text-stone-900 truncate" title={asset.filename}>
                          {asset.title || asset.filename}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono pt-0.5">
                          <span>{(asset.byteSize / 1024).toFixed(1)} KB</span>
                          <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(asset.url);
                            setStatusMessage(`Copied media URL: ${asset.url}`);
                            setTimeout(() => setStatusMessage(''), 3000);
                          }}
                          className="flex-1 py-1 px-2 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-700 text-[10px] font-medium flex items-center justify-center gap-1 border border-stone-200 transition cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy URL</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteMediaAsset(asset.id)}
                          className="p-1 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition cursor-pointer"
                          title="Delete Asset from Supabase"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-stone-800">
                      Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[10px] text-amber-700 hover:underline font-medium"
                    >
                      + Manage Categories
                    </button>
                  </div>
                  <select
                    value={newProductForm.category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setNewProductForm({
                        ...newProductForm,
                        category: newCat,
                        subCategory: '',
                        subCategoryId: '',
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Sub-Category (Optional)
                  </label>
                  <select
                    value={newProductForm.subCategory}
                    onChange={(e) => {
                      const subName = e.target.value;
                      const activeCat = categories.find((c) => c.name === newProductForm.category);
                      const subObj = activeCat?.subCategories?.find((s) => s.name === subName);
                      setNewProductForm({
                        ...newProductForm,
                        subCategory: subName,
                        subCategoryId: subObj?.id || '',
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none"
                  >
                    <option value="">General / None</option>
                    {categories
                      .find((c) => c.name === newProductForm.category)
                      ?.subCategories?.map((sub) => (
                        <option key={sub.id} value={sub.name}>
                          {sub.name}
                        </option>
                      ))}
                  </select>
                </div>
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

              {/* Photo Image Asset - Supabase Upload, Library Picker, and Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-800">
                    Product Photo Asset
                  </label>
                  <span className="text-[10px] text-stone-400 font-mono flex items-center gap-1">
                    <Database className="w-3 h-3 text-amber-500" />
                    Supabase Storage
                  </span>
                </div>

                {/* Upload from device or pick from library */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <label className="flex-1 px-3 py-2 bg-white border border-stone-300 hover:border-stone-900 rounded-xl text-xs font-medium text-stone-800 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs">
                    <UploadCloud className="w-4 h-4 text-stone-600" />
                    <span>{isUploadingMedia ? 'Uploading to Supabase...' : 'Upload from Phone / PC'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingMedia}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadMediaFile(file, 'new');
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setMediaTargetMode('new');
                      setIsMediaPickerOpen(true);
                    }}
                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-stone-500" />
                    <span>Supabase Library ({mediaAssets.length})</span>
                  </button>
                </div>

                {/* Presets - Natural Wrap, Zero Horizontal Scrolling */}
                <div className="pt-1">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block mb-1">
                    Quick Bakery Presets:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {PRESET_IMAGES.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() =>
                          setNewProductForm({ ...newProductForm, image: preset.url })
                        }
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition cursor-pointer ${
                          newProductForm.image === preset.url
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview & Custom URL */}
                <div className="flex items-center gap-2 pt-1">
                  {newProductForm.image && (
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={newProductForm.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <input
                    type="url"
                    placeholder="https://... photo url or /api/media/..."
                    value={newProductForm.image}
                    onChange={(e) =>
                      setNewProductForm({ ...newProductForm, image: e.target.value })
                    }
                    className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono focus:bg-white focus:outline-none"
                  />
                </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-stone-800">
                      Category
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[10px] text-amber-700 hover:underline font-medium"
                    >
                      + Manage
                    </button>
                  </div>
                  <select
                    value={editingProduct.category}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value as MenuCategory,
                        subCategory: '',
                        subCategoryId: '',
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Sub-Category (Optional)
                  </label>
                  <select
                    value={editingProduct.subCategory || ''}
                    onChange={(e) => {
                      const subName = e.target.value;
                      const activeCat = categories.find((c) => c.name === editingProduct.category);
                      const subObj = activeCat?.subCategories?.find((s) => s.name === subName);
                      setEditingProduct({
                        ...editingProduct,
                        subCategory: subName,
                        subCategoryId: subObj?.id || '',
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none"
                  >
                    <option value="">General / None</option>
                    {categories
                      .find((c) => c.name === editingProduct.category)
                      ?.subCategories?.map((sub) => (
                        <option key={sub.id} value={sub.name}>
                          {sub.name}
                        </option>
                      ))}
                  </select>
                </div>
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

              {/* Photo Asset for Editing Product */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-800">
                    Product Photo Asset
                  </label>
                  <span className="text-[10px] text-stone-400 font-mono flex items-center gap-1">
                    <Database className="w-3 h-3 text-amber-500" />
                    Supabase Storage
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex-1 px-3 py-2 bg-white border border-stone-300 hover:border-stone-900 rounded-xl text-xs font-medium text-stone-800 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs">
                    <UploadCloud className="w-4 h-4 text-stone-600" />
                    <span>{isUploadingMedia ? 'Uploading...' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingMedia}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadMediaFile(file, 'edit');
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setMediaTargetMode('edit');
                      setIsMediaPickerOpen(true);
                    }}
                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-stone-500" />
                    <span>Library</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {editingProduct.image && (
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={editingProduct.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <input
                    type="url"
                    value={editingProduct.image || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, image: e.target.value })
                    }
                    placeholder="https://... or /api/media/..."
                    className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono focus:bg-white focus:outline-none"
                  />
                </div>
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

      {/* =========================================================================
          MEDIA PICKER MODAL (SUPABASE POSTGRESQL ASSETS)
         ========================================================================= */}
      {isMediaPickerOpen && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#FAF8F5] border border-stone-200 rounded-3xl w-full max-w-2xl p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    Select from Supabase Media Storage
                  </h3>
                  <p className="text-xs text-stone-500 font-mono">
                    PostgreSQL pooler &bull; aws-0-ap-south-1.pooler.supabase.com
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMediaPickerOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-800 rounded-full hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {mediaAssets.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <ImageIcon className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="text-xs text-stone-600 font-medium">No assets in Supabase yet</p>
                <p className="text-[11px] text-stone-400">Upload a photo first using the upload button.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-1">
                {mediaAssets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => {
                      if (mediaTargetMode === 'edit' && editingProduct) {
                        setEditingProduct({ ...editingProduct, image: asset.url });
                      } else {
                        setNewProductForm({ ...newProductForm, image: asset.url });
                      }
                      setIsMediaPickerOpen(false);
                      setStatusMessage(`Selected media: ${asset.filename}`);
                      setTimeout(() => setStatusMessage(''), 3000);
                    }}
                    className="group bg-white rounded-xl border border-stone-200 hover:border-stone-900 overflow-hidden shadow-2xs hover:shadow-md transition text-left cursor-pointer flex flex-col justify-between"
                  >
                    <div className="relative w-full h-24 bg-stone-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.url}
                        alt={asset.title || asset.filename}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-[11px] font-semibold text-stone-900 truncate">
                        {asset.title || asset.filename}
                      </p>
                      <span className="text-[9px] text-stone-400 font-mono">
                        {(asset.byteSize / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsMediaPickerOpen(false)}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CATEGORIES & SUB-CATEGORIES MANAGER
         ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-[#FAF8F5] border border-stone-200 rounded-3xl w-full max-w-4xl p-5 sm:p-7 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-stone-900">
                    Product Categories &amp; Sub-Categories
                  </h3>
                  <p className="text-xs text-stone-500">
                    Create, organize, and delete menu categories for Puffs &apos;n&apos; Rolls master products
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-800 rounded-full hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Two-Panel Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Panel: Categories */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                      <FolderTree className="w-4 h-4 text-stone-500" />
                      <span>Master Categories ({categories.length})</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">Select to view sub-categories</span>
                  </div>

                  {/* Categories List */}
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {categories.map((cat) => {
                      const isSelected = selectedCategoryForSub === cat.id;
                      const productCount = masterProducts.filter((p) => p.category === cat.name).length;
                      const subCount = cat.subCategories ? cat.subCategories.length : 0;

                      return (
                        <div
                          key={cat.id}
                          onClick={() => setSelectedCategoryForSub(cat.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                            isSelected
                              ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                              : 'bg-stone-50 hover:bg-stone-100/80 text-stone-800 border-stone-200'
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-semibold block truncate">{cat.name}</span>
                            <span
                              className={`text-[10px] flex items-center gap-2 ${
                                isSelected ? 'text-stone-300' : 'text-stone-400'
                              }`}
                            >
                              <span>{productCount} products</span>
                              <span>&bull;</span>
                              <span>{subCount} sub-categories</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCategory(cat.id);
                              }}
                              className={`p-1 rounded-lg transition ${
                                isSelected
                                  ? 'hover:bg-rose-900 text-stone-400 hover:text-rose-300'
                                  : 'hover:bg-rose-50 text-stone-400 hover:text-rose-600'
                              }`}
                              title={`Delete Category "${cat.name}"`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <ChevronRight
                              className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-stone-400'}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Create Category Form */}
                <form onSubmit={handleCreateCategory} className="pt-3 border-t border-stone-100 space-y-2">
                  <span className="text-[11px] font-bold text-stone-700 block">+ Add New Category</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Category name (e.g. Gourmet Pizzas)..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                    <button
                      type="submit"
                      disabled={!newCategoryName.trim()}
                      className="px-4 py-2 bg-[#1C1917] hover:bg-stone-800 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Panel: Sub-Categories */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                      Sub-Categories for: <span className="text-amber-800">{activeSubCategoryParent?.name || 'Category'}</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {activeSubCategoryParent?.subCategories?.length || 0} items
                    </span>
                  </div>

                  {/* Sub-Categories List */}
                  {!activeSubCategoryParent ? (
                    <div className="text-center py-12 text-stone-400 text-xs">
                      Select a category on the left to manage its sub-categories.
                    </div>
                  ) : activeSubCategoryParent.subCategories?.length === 0 ? (
                    <div className="text-center py-10 bg-stone-50 rounded-xl border border-dashed border-stone-200 p-4 space-y-1">
                      <p className="text-xs text-stone-600 font-medium">No sub-categories yet</p>
                      <p className="text-[10px] text-stone-400">Add sub-categories below to group items within {activeSubCategoryParent.name}.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                      {activeSubCategoryParent.subCategories.map((sub) => {
                        const productCount = masterProducts.filter(
                          (p) => p.subCategory === sub.name || p.subCategoryId === sub.id
                        ).length;

                        return (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 transition"
                          >
                            <div>
                              <span className="text-xs font-semibold text-stone-800 block">{sub.name}</span>
                              <span className="text-[10px] text-stone-400">{productCount} products assigned</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteSubCategory(activeSubCategoryParent.id, sub.id)}
                              className="p-1 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition cursor-pointer"
                              title={`Delete Sub-Category "${sub.name}"`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Create Sub-Category Form */}
                {activeSubCategoryParent && (
                  <form onSubmit={handleCreateSubCategory} className="pt-3 border-t border-stone-100 space-y-2">
                    <span className="text-[11px] font-bold text-stone-700 block">
                      + Add Sub-Category to {activeSubCategoryParent.name}
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Sub-category name (e.g. Peri Peri Puffs)..."
                        value={newSubCategoryName}
                        onChange={(e) => setNewSubCategoryName(e.target.value)}
                        className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                      />
                      <button
                        type="submit"
                        disabled={!newSubCategoryName.trim()}
                        className="px-4 py-2 bg-[#1C1917] hover:bg-stone-800 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
              <span className="text-[11px] text-stone-500">
                Changes cascade immediately to master catalog and outlet menus across Nashik.
              </span>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-5 py-2 bg-[#1C1917] hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
