'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  ShoppingBag,
  SlidersHorizontal,
  Package,
  Users,
  BarChart3,
  LogOut,
  ExternalLink,
  Store,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // If on /admin/login, don't protect
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
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span>Verifying Admin Credentials...</span>
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
      label: 'Outlet Stock & 86-ing',
      href: '/admin/inventory',
      icon: Package,
    },
    {
      label: 'Performance Marketing',
      href: '/admin/marketing',
      icon: SlidersHorizontal,
    },
    {
      label: 'Staff & Hierarchy',
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Navigation */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md">
                P&amp;R
              </div>
              <div>
                <span className="font-bold text-white text-sm block leading-none">
                  P&amp;R Operations Admin
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {user?.name || 'Administrator'} • HQ
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 text-xs">
              <Link
                href="/"
                target="_blank"
                className="hidden sm:flex items-center gap-1 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition"
              >
                <span>Storefront</span>
                <ExternalLink className="w-3 h-3" />
              </Link>

              <button
                onClick={() => {
                  logout();
                  router.push('/admin/login');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition text-xs"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation Bar - Mobile Thumb Scrollable */}
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 pt-1 border-t border-slate-800/60 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-slate-950 text-slate-100">{children}</main>
    </div>
  );
}
