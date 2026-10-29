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

  const adminTabs = [
    {
      label: 'Orders',
      href: '/admin',
      icon: ShoppingBag,
      exact: true,
    },
    {
      label: 'Outlets',
      href: '/admin/outlets',
      icon: Store,
    },
    {
      label: 'Stock (86)',
      href: '/admin/inventory',
      icon: Package,
    },
    {
      label: 'Marketing',
      href: '/admin/marketing',
      icon: SlidersHorizontal,
    },
    {
      label: 'Staff',
      href: '/admin/employees',
      icon: Users,
    },
    {
      label: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans selection:bg-stone-200">
      {/* Top Header */}
      <header className="bg-white border-b border-stone-200/80 sticky top-0 z-40 backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 sm:h-16 flex items-center justify-between">
            {/* Brand Logo & Context */}
            <div className="flex items-center gap-2.5">
              <Link href="/admin" className="flex items-center gap-2 group">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#1C1917] text-white flex items-center justify-center font-serif font-bold text-xs shadow-xs group-hover:bg-stone-800 transition">
                  P&amp;R
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif font-bold text-stone-900 text-xs sm:text-sm tracking-tight">
                      Puffs &apos;n&apos; Rolls
                    </span>
                    <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider font-semibold px-2 py-0.2 rounded-full bg-stone-100 text-stone-600 border border-stone-200/80">
                      Admin
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-stone-400 block -mt-0.5">
                    {user?.name || 'Administrator'}
                  </span>
                </div>
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 text-xs">
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-1 text-stone-600 hover:text-stone-950 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-stone-200 hover:border-stone-400 bg-stone-50/50 hover:bg-white transition text-[11px] sm:text-xs"
              >
                <span>Storefront</span>
                <ExternalLink className="w-3 h-3 text-stone-400" />
              </Link>

              <button
                onClick={() => {
                  logout();
                  router.push('/admin/login');
                }}
                className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 text-[11px] sm:text-xs font-medium transition"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Dedicated Tab Bar - Designed Specifically for Phone View & Desktop */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2 border-t border-stone-100 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {adminTabs.map((tab) => {
              const isActive = tab.exact
                ? pathname === tab.href
                : pathname.startsWith(tab.href);
              const Icon = tab.icon;

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full text-xs font-medium transition shrink-0 ${
                    isActive
                      ? 'bg-[#1C1917] text-white shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900 bg-stone-100/70 hover:bg-stone-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-stone-500'}`} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-[#FAF8F5] pb-12">{children}</main>
    </div>
  );
}
