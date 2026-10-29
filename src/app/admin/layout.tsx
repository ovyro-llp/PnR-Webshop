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
  MapPin,
  Sparkles,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

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

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans selection:bg-stone-200">
      {/* Elegant Minimalist Admin Header */}
      <header className="bg-white border-b border-stone-200/80 sticky top-0 z-40 backdrop-blur-md bg-white/95">
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
                href="/"
                target="_blank"
                className="hidden sm:flex items-center gap-1.5 text-stone-600 hover:text-stone-950 px-3 py-1.5 rounded-full border border-stone-200 hover:border-stone-400 bg-stone-50/50 hover:bg-white transition"
              >
                <span>View Storefront</span>
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

          {/* Minimalist Sub Navigation Bar - Horizontal Thumb-Scrollable */}
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2.5 pt-1 border-t border-stone-100 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
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

      {/* Main Content Area with Warm Cream Palette */}
      <main className="flex-1 bg-[#FAF8F5] pb-16">{children}</main>
    </div>
  );
}
