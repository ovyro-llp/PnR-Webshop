'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { OUTLETS } from '@/lib/data/mock-data';
import {
  ShoppingBag,
  MapPin,
  ChevronDown,
  User,
  Menu,
  X,
  Phone,
  Sparkles,
  ChevronRight,
  Search,
  Cake,
  Cookie,
  Flame,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface NavbarProps {
  currentOutletSlug?: string;
  currentCampaignSlug?: string;
}

interface CategoryNavDef {
  id: string;
  name: string;
  count: number;
  description: string;
  subCategoriesPreview: string[];
  iconType: 'cake' | 'pastry' | 'puff' | 'cookie' | 'tea-cake' | 'bread';
}

const CATEGORY_DIRECTORY: CategoryNavDef[] = [
  {
    id: 'cat-celebration-cakes',
    name: 'Celebration Cakes',
    count: 79,
    description: 'Fresh artisanal cakes in 1/2 KG & 1 KG',
    subCategoriesPreview: ['Chocolate', 'Signature', 'Fruit & Berry', 'Cheesecakes', 'Sin Cakes'],
    iconType: 'cake',
  },
  {
    id: 'cat-pastries-desserts',
    name: 'Pastries & Desserts',
    count: 51,
    description: 'Decadent individual pastries, mousses & doughnuts',
    subCategoriesPreview: ['Small Pastries', 'Large Pastries', 'Cheese Pastries', 'Doughnuts'],
    iconType: 'pastry',
  },
  {
    id: 'cat-puffs-savories',
    name: 'Puffs, Rolls & Savories',
    count: 32,
    description: 'Flaky bakery puffs, savory rolls & croissants',
    subCategoriesPreview: ['Puffs & Patties', 'Savory Rolls', 'Croissants', 'Fried Snacks'],
    iconType: 'puff',
  },
  {
    id: 'cat-high-tea',
    name: 'Khari, Cookies & High Tea',
    count: 21,
    description: 'Crispy special khari, sweet rusk toast & cookies',
    subCategoriesPreview: ['Special Khari', 'Rusk Toast', 'Healthy Cookies', 'Eggless'],
    iconType: 'cookie',
  },
  {
    id: 'cat-tea-time-cakes',
    name: 'Tea-Time Cakes & Brownies',
    count: 16,
    description: 'Traditional mawa cakes, fudgy brownies & muffins',
    subCategoriesPreview: ['Mawa Cakes', 'Brownies', 'Loaves', 'Muffins'],
    iconType: 'tea-cake',
  },
  {
    id: 'cat-breads-daily',
    name: 'Breads & Daily Bakes',
    count: 14,
    description: 'Fresh sandwich loaves, sourdough, pav & buns',
    subCategoriesPreview: ['Sandwich Loaves', 'Flavored Breads', 'Ladi Paav', 'Daily Buns'],
    iconType: 'bread',
  },
];

export function Navbar({ currentOutletSlug, currentCampaignSlug }: NavbarProps) {
  const router = useRouter();
  const { itemCount, total, setIsCartOpen } = useCart();
  const { user, isCustomer, openCustomerLogin } = useAuth();
  const {
    nearestOutlet,
    openLocationModal,
    deliveryAddress,
    deliveryArea,
  } = useLocation();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [selectedDietary, setSelectedDietary] = useState<'ALL' | 'VEG' | 'NON_VEG'>('ALL');

  // Lock body scroll and prevent background bounce when mobile drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      const prevOverflow = document.body.style.overflow;
      const prevTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.touchAction = prevTouchAction;
      };
    }
  }, [isDrawerOpen]);

  // Authoritative outlet for this customer
  const effectiveOutlet =
    nearestOutlet ||
    (currentOutletSlug && OUTLETS.find((o) => o.slug === currentOutletSlug)) ||
    OUTLETS[0];

  const handleCategoryClick = (categoryName: string) => {
    setIsDrawerOpen(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('pnr-select-category', { detail: { category: categoryName } })
      );
      if (window.location.pathname === '/') {
        document.getElementById('bakery-catalog')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        router.push('/#bakery-catalog');
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDrawerOpen(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('pnr-set-search', { detail: { query: navSearch.trim() } })
      );
      if (window.location.pathname === '/') {
        document.getElementById('bakery-catalog')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        router.push('/#bakery-catalog');
      }
    }
  };

  const handleDietaryClick = (dietary: 'ALL' | 'VEG' | 'NON_VEG') => {
    setSelectedDietary(dietary);
    setIsDrawerOpen(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('pnr-set-dietary', { detail: { dietary } })
      );
      if (window.location.pathname === '/') {
        document.getElementById('bakery-catalog')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        router.push('/#bakery-catalog');
      }
    }
  };

  const renderCategoryIcon = (type: CategoryNavDef['iconType']) => {
    switch (type) {
      case 'cake':
        return <Cake className="w-5 h-5 text-amber-700" />;
      case 'pastry':
        return <Sparkles className="w-5 h-5 text-amber-600" />;
      case 'puff':
        return <Flame className="w-5 h-5 text-rose-600" />;
      case 'cookie':
        return <Cookie className="w-5 h-5 text-amber-800" />;
      case 'tea-cake':
        return <Cake className="w-5 h-5 text-stone-700" />;
      case 'bread':
        return <Package className="w-5 h-5 text-amber-700" />;
      default:
        return <Sparkles className="w-5 h-5 text-amber-700" />;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FDFCFB]/95 backdrop-blur-md border-b border-stone-200/80 transition-all w-full">
        {/* Top subtle announcement bar */}
        <div className="bg-[#1C1917] text-stone-300 text-[10px] sm:text-[11px] py-1 px-3 text-center tracking-wider uppercase font-medium truncate w-full flex items-center justify-center gap-2">
          <span>Baking Excellence Since 2001 • Handcrafted in Nashik</span>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4 w-full">
          {/* Left: Mobile-Only Hamburger Toggle & Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Hamburger Toggle for Product Navigation */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="md:hidden p-2 -ml-1 rounded-xl text-stone-900 hover:bg-stone-100 transition active:scale-95 flex items-center gap-1.5 cursor-pointer bg-stone-100/80 border border-stone-200/80 shadow-2xs"
              aria-label="Open Products Navigation Menu"
              title="Browse Bakery Menu"
            >
              <Menu className="w-4 h-4 stroke-[2.2]" />
              <span className="text-[11px] font-bold text-stone-800 pr-0.5">Menu</span>
            </button>

            {/* Brand Logo */}
            <Link href="/" className="flex items-center shrink-0">
              <div className="relative h-8 w-24 sm:h-11 sm:w-36 transition-transform active:scale-95">
                <Image
                  src="https://puffsnrolls.com/wp-content/uploads/2025/12/banner-logo.png"
                  alt="Puffs 'n' Rolls"
                  fill
                  priority
                  sizes="(max-width: 640px) 96px, 144px"
                  className="object-contain object-left"
                />
              </div>
            </Link>
          </div>

          {/* Desktop Direct Navigation (Hidden on Mobile, Visible on Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-stone-600">
            <a
              href="#bakery-catalog"
              onClick={(e) => {
                if (typeof window !== 'undefined' && window.location.pathname === '/') {
                  e.preventDefault();
                  document.getElementById('bakery-catalog')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="hover:text-stone-950 transition font-semibold cursor-pointer"
            >
              Bakery Menu
            </a>
            <button
              type="button"
              onClick={() => handleCategoryClick('Celebration Cakes')}
              className="hover:text-stone-950 transition font-medium cursor-pointer"
            >
              Cakes
            </button>
            <button
              type="button"
              onClick={() => handleCategoryClick('Puffs, Rolls & Savories')}
              className="hover:text-stone-950 transition font-medium cursor-pointer"
            >
              Puffs & Rolls
            </button>
            <button
              type="button"
              onClick={() => handleCategoryClick('Pastries & Desserts')}
              className="hover:text-stone-950 transition font-medium cursor-pointer"
            >
              Pastries
            </button>
            <a
              href={`tel:${effectiveOutlet.phone}`}
              className="hover:text-stone-950 transition flex items-center gap-1 font-mono text-[11px]"
              title="Call Bakery Kitchen"
            >
              <Phone className="w-3 h-3 text-amber-700" />
              <span>{effectiveOutlet.phone}</span>
            </a>
          </nav>

          {/* Right: Location & Profile Cluster + Cart Action */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Location & Location Selection Button (Located exclusively at top-right of profile section) */}
            <button
              type="button"
              onClick={openLocationModal}
              className="flex items-center bg-white border border-stone-200/90 hover:border-stone-400 rounded-full px-2.5 sm:px-3 py-1.5 text-xs text-stone-700 transition shadow-2xs cursor-pointer group max-w-[120px] sm:max-w-[180px] active:scale-95"
              title="Your delivery location & outlet. Click to update location."
            >
              <MapPin className="w-3.5 h-3.5 text-amber-700 mr-1 shrink-0 group-hover:scale-110 transition-transform" />
              <div className="truncate text-left min-w-0">
                <span className="font-bold text-[10px] sm:text-xs text-stone-900 block truncate leading-tight">
                  {deliveryArea || (deliveryAddress ? deliveryAddress.split(',')[0] : effectiveOutlet.area)}
                </span>
                <span className="text-[9px] text-stone-400 font-mono hidden sm:block truncate leading-none">
                  {effectiveOutlet.name.replace("Puffs 'n' Rolls - ", '')}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-stone-400 ml-1 shrink-0" />
            </button>

            {/* Profile / Account Trigger */}
            {user && isCustomer ? (
              <Link
                href="/account"
                aria-label="My Account"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-stone-800 hover:text-stone-950 text-xs font-semibold transition border border-stone-200 bg-white hover:bg-stone-50 shadow-2xs"
              >
                <div className="w-4 h-4 rounded-full bg-[#1C1917] text-white flex items-center justify-center text-[9px] font-bold">
                  {user.name.charAt(0)}
                </div>
                <span className="hidden sm:inline truncate max-w-[65px] sm:max-w-none">{user.name.split(' ')[0]}</span>
              </Link>
            ) : (
              <button
                onClick={openCustomerLogin}
                aria-label="Customer Sign In"
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-stone-800 hover:text-stone-950 text-xs font-semibold transition cursor-pointer border border-stone-200 bg-white hover:bg-stone-50 shadow-2xs active:scale-95"
              >
                <User className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* Bag / Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 sm:px-4 sm:py-2 rounded-full bg-[#1C1917] hover:bg-stone-800 active:scale-95 text-white font-medium text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              aria-label="View Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-stone-300" />
              <span className="hidden sm:inline tracking-wide font-semibold">Bag</span>
              {itemCount > 0 && (
                <span className="bg-white text-stone-900 font-bold text-[10px] px-1.5 py-0.2 rounded-full min-w-[16px] text-center">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MOBILE PRODUCT NAVIGATION MENU (PURE PRODUCT FOCUS)
          - NO location cards, NO outlet switchers, NO checkout flows
          - 100% focused on finding, exploring, and navigating bakery products
         ========================================================================= */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 overflow-hidden touch-none">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in touch-none overscroll-contain"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 max-w-full flex">
            <div className="w-[88vw] max-w-sm bg-[#FAF8F5] shadow-2xl flex flex-col justify-between border-r border-stone-200 animate-in slide-in-from-left duration-250 overscroll-contain touch-pan-y">
              {/* Header */}
              <div className="p-4 border-b border-stone-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#1C1917] text-white flex items-center justify-center font-serif font-bold text-xs shadow-xs">
                    P&amp;R
                  </div>
                  <div>
                    <span className="font-serif font-bold text-stone-900 text-sm block">
                      Bakery Catalog
                    </span>
                    <span className="text-[10px] font-mono uppercase text-stone-400 block -mt-0.5">
                      213 Fresh Counter Items
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-800 rounded-full hover:bg-stone-100 transition cursor-pointer"
                  aria-label="Close Product Navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Products Navigation Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-stone-800 text-xs overscroll-contain touch-pan-y">
                {/* 1. Fast Product Search Input */}
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={navSearch}
                    onChange={(e) => setNavSearch(e.target.value)}
                    placeholder="Search cakes, puffs, cookies..."
                    className="w-full pl-9 pr-8 py-2.5 bg-white border border-stone-200 rounded-xl text-xs placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition shadow-2xs"
                  />
                  {navSearch && (
                    <button
                      type="button"
                      onClick={() => setNavSearch('')}
                      className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 p-0.5 rounded-full cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>

                {/* 2. Dietary Preference Selector */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                    Dietary Filter
                  </span>
                  <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-stone-200/90 shadow-2xs text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => handleDietaryClick('ALL')}
                      className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer ${
                        selectedDietary === 'ALL'
                          ? 'bg-stone-900 text-white shadow-xs'
                          : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      All Items
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDietaryClick('VEG')}
                      className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1 ${
                        selectedDietary === 'VEG'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-emerald-800 hover:bg-emerald-50'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedDietary === 'VEG' ? 'bg-white' : 'bg-emerald-600'}`} />
                      <span>Veg</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDietaryClick('NON_VEG')}
                      className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1 ${
                        selectedDietary === 'NON_VEG'
                          ? 'bg-rose-700 text-white shadow-xs'
                          : 'text-rose-800 hover:bg-rose-50'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedDietary === 'NON_VEG' ? 'bg-white' : 'bg-rose-600'}`} />
                      <span>Non-Veg</span>
                    </button>
                  </div>
                </div>

                {/* 3. Quick Navigation Shortcuts */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                    Quick Jump
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleCategoryClick('All')}
                      className="p-2.5 rounded-xl bg-white border border-stone-200/90 text-stone-800 hover:border-stone-400 transition text-left cursor-pointer flex items-center justify-between shadow-2xs group"
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-700 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-semibold">All Bakes</span>
                      </div>
                      <span className="text-[10px] font-mono text-stone-400">213</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCategoryClick('Celebration Cakes')}
                      className="p-2.5 rounded-xl bg-white border border-stone-200/90 text-stone-800 hover:border-stone-400 transition text-left cursor-pointer flex items-center justify-between shadow-2xs group"
                    >
                      <div className="flex items-center gap-2">
                        <Cake className="w-4 h-4 text-amber-700 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-semibold">Cakes</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">79</span>
                    </button>
                  </div>
                </div>

                {/* 4. Artisanal Product Categories List */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                    Product Categories
                  </span>
                  <div className="space-y-2">
                    {CATEGORY_DIRECTORY.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryClick(cat.name)}
                        className="w-full p-3 bg-white hover:bg-stone-50 rounded-2xl border border-stone-200/90 text-left transition shadow-2xs flex items-center justify-between gap-3 group active:scale-[0.99] cursor-pointer"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-50 group-hover:text-amber-800 transition">
                            {renderCategoryIcon(cat.iconType)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-stone-900 block truncate group-hover:text-amber-900 transition">
                              {cat.name}
                            </span>
                            <span className="text-[10px] text-stone-500 block truncate mt-0.5">
                              {cat.description}
                            </span>
                            <div className="flex items-center gap-1 mt-1.5 overflow-hidden">
                              {cat.subCategoriesPreview.slice(0, 3).map((sub) => (
                                <span
                                  key={sub}
                                  className="text-[9px] font-medium text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-md truncate"
                                >
                                  {sub}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                            {cat.count}
                          </span>
                          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800 group-hover:translate-x-0.5 transition" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Footer: Pure Product / Bag Action */}
              <div className="p-4 border-t border-stone-200 bg-white">
                {itemCount > 0 ? (
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      setIsCartOpen(true);
                    }}
                    className="w-full py-3 px-4 bg-[#1C1917] hover:bg-stone-800 active:scale-[0.99] text-white rounded-2xl font-bold text-xs flex items-center justify-between transition shadow-md cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-amber-400" />
                      <span>View Bag ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono">
                      <span>₹{total}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      document.getElementById('bakery-catalog')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Browse All 213 Bakery Items</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
