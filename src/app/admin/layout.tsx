'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  ShoppingBag,
  Store,
  Package,
  SlidersHorizontal,
  Users,
  BarChart3,
  LogOut,
  ExternalLink,
  Smartphone,
  Menu,
  X,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setIsChecking(false);
      return;
    }

    if (!user || user.role !== 'ADMIN') {
      router.push('/admin/login');
    } else {
      setIsChecking(false);
    }
  }, [user, pathname, router]);

  // Close mobile more sheet on navigation
  useEffect(() => {
    setIsMobileMoreOpen(false);
  }, [pathname]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-xs font-mono text-stone-500">
          <span className="w-3.5 h-3.5 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
          <span>Authenticating P&amp;R Operations Session...</span>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      label: 'Orders & Dispatch',
      href: '/admin',
      icon: ShoppingBag,
      exact: true,
    },
    {
      label: 'Outlets Directory',
      href: '/admin/outlets',
      icon: Store,
    },
    {
      label: 'Stock & 86-ing',
      href: '/admin/inventory',
      icon: Package,
    },
    {
      label: 'Phone View',
      href: '/admin/preview',
      icon: Smartphone,
    },
    {
      label: 'Performance Marketing',
      href: '/admin/marketing',
      icon: SlidersHorizontal,
    },
    {
      label: 'Staff & Roles',
      href: '/admin/employees',
      icon: Users,
    },
    {
      label: 'FOCO Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
    },
  ];

  // Primary mobile navigation tabs (for bottom bar)
  const mobilePrimaryTabs = [
    { label: 'Orders', href: '/admin', icon: ShoppingBag, exact: true },
    { label: 'Outlets', href: '/admin/outlets', icon: Store },
    { label: 'Stock 86', href: '/admin/inventory', icon: Package },
    { label: 'Phone View', href: '/admin/preview', icon: Smartphone },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans selection:bg-stone-200">
      {/* Elegant Minimalist Admin Header */}
      <header className="bg-white/95 border-b border-stone-200/80 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Brand Logo & Context */}
            <div className="flex items-center gap-3">
              <Link href="/admin" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-xl bg-[#1C1917] text-white flex items-center justify-center font-serif font-bold text-xs shadow-xs group-hover:bg-stone-800 transition">
                  P&amp;R
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-stone-900 text-sm tracking-tight">
                      Puffs &apos;n&apos; Rolls
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2 py-0.2 rounded-full bg-stone-100 text-stone-600 border border-stone-200/80">
                      Operations Admin
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400 block -mt-0.5">
                    Logged in as: <strong className="text-stone-700 font-medium">{user?.name || 'HQ Administrator'}</strong>
                  </span>
                </div>
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs">
              <Link
                href="/admin/preview"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-medium transition"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                <span>Phone View</span>
              </Link>

              <Link
                href="/"
                target="_blank"
                className="hidden sm:flex items-center gap-1.5 text-stone-600 hover:text-stone-950 px-3 py-1.5 rounded-full border border-stone-200 hover:border-stone-400 bg-stone-50/50 hover:bg-white transition"
              >
                <span>Storefront</span>
                <ExternalLink className="w-3 h-3 text-stone-400" />
              </Link>

              <button
                onClick={() => {
                  logout();
                  router.push('/admin/login');
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 text-xs font-medium transition"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Minimalist Sub Navigation Bar - Desktop & Tablet */}
          <nav className="hidden sm:flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-2.5 pt-1 border-t border-stone-100 no-scrollbar">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition shrink-0 ${
                    isActive
                      ? 'bg-[#1C1917] text-white shadow-xs font-semibold'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 bg-[#FAF8F5] pb-24 sm:pb-16">{children}</main>

      {/* Dedicated App-Like Bottom Navigation Tab Bar for Phone View of Admin */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around safe-bottom">
        {mobilePrimaryTabs.map((tab) => {
          const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition ${
                isActive
                  ? 'text-[#1C1917] font-semibold'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              <div className={`p-1 rounded-xl transition ${isActive ? 'bg-stone-100' : 'bg-transparent'}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-stone-900 stroke-[2.3]' : 'text-stone-400'}`} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </Link>
          );
        })}

        {/* More Options Tab (Opens bottom drawer) */}
        <button
          onClick={() => setIsMobileMoreOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition ${
            pathname.startsWith('/admin/marketing') || pathname.startsWith('/admin/employees') || pathname.startsWith('/admin/analytics')
              ? 'text-[#1C1917] font-semibold'
              : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          <div className="p-1 rounded-xl">
            <Menu className="w-5 h-5 text-stone-500" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">More</span>
        </button>
      </nav>

      {/* Mobile More Drawer Sheet */}
      {isMobileMoreOpen && (
        <div className="sm:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end animate-in fade-in">
          <div className="bg-white rounded-t-3xl border-t border-stone-200 p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-stone-900 text-sm">
                  P&amp;R Operations Navigation
                </span>
              </div>
              <button
                onClick={() => setIsMobileMoreOpen(false)}
                className="text-stone-400 hover:text-stone-900 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <Link
                href="/admin/marketing"
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-stone-50 text-stone-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <SlidersHorizontal className="w-4 h-4 text-stone-500" />
                  <span className="font-medium">Performance Marketing &amp; Pixels</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </Link>

              <Link
                href="/admin/employees"
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-stone-50 text-stone-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-stone-500" />
                  <span className="font-medium">Staff Directory &amp; Roles</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </Link>

              <Link
                href="/admin/analytics"
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-stone-50 text-stone-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-stone-500" />
                  <span className="font-medium">FOCO Franchise Analytics</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </Link>

              <Link
                href="/"
                target="_blank"
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-stone-50 text-stone-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <ExternalLink className="w-4 h-4 text-stone-500" />
                  <span className="font-medium">View Live Storefront</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </Link>
            </div>

            <div className="pt-2 border-t border-stone-100">
              <button
                onClick={() => {
                  logout();
                  router.push('/admin/login');
                }}
                className="w-full py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Operations</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
