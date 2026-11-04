'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, AdminUser } from '@/context/AuthContext';
import { EmployeeRole, Permission } from '@/types';
import { hasPermission, getRoleDefinition } from '@/lib/auth/rbac';
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
  Menu,
  X,
  ChevronRight,
  Shield,
  Truck,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isHydrated, logout } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const adminUser = user && user.role === 'ADMIN' ? (user as AdminUser) : null;
  const userRole: EmployeeRole =
    adminUser?.employeeRole ||
    (adminUser?.outletAccess && !adminUser.outletAccess.includes('all')
      ? 'OUTLET_MANAGER'
      : 'SUPER_ADMIN');
  const roleDef = getRoleDefinition(userRole);

  const allNavItems = [
    {
      label: 'Orders & Dispatch',
      shortLabel: 'Orders',
      href: '/admin',
      icon: ShoppingBag,
      permission: 'orders:view' as Permission,
      exact: true,
    },
    {
      label: 'Outlets & Fleet API',
      shortLabel: 'Outlets',
      href: '/admin/outlets',
      icon: Store,
      permission: 'outlets:view' as Permission,
    },
    {
      label: 'Inventory & Stock 86',
      shortLabel: 'Stock',
      href: '/admin/inventory',
      icon: Package,
      permission: 'inventory:view' as Permission,
    },
    {
      label: 'Performance Marketing',
      shortLabel: 'Marketing',
      href: '/admin/marketing',
      icon: SlidersHorizontal,
      permission: 'marketing:view' as Permission,
    },
    {
      label: 'Staff & RBAC Matrix',
      shortLabel: 'Staff',
      href: '/admin/employees',
      icon: Users,
      permission: 'staff:view' as Permission,
    },
    {
      label: 'Analytics & Reports',
      shortLabel: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      permission: 'analytics:view_outlet' as Permission,
    },
  ];

  const navItems = useMemo(
    () => allNavItems.filter((item) => hasPermission(userRole, item.permission)),
    [userRole]
  );

  useEffect(() => {
    if (!isHydrated) return;

    if (pathname === '/admin/login') {
      setIsChecking(false);
      return;
    }

    if (!user || user.role !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }

    // Enterprise RBAC: Route guarding based on explicit permissions
    if (pathname.startsWith('/admin/outlets') && !hasPermission(userRole, 'outlets:view')) {
      router.push('/admin');
      return;
    }
    if (pathname.startsWith('/admin/marketing') && !hasPermission(userRole, 'marketing:view')) {
      router.push('/admin');
      return;
    }
    if (pathname.startsWith('/admin/employees') && !hasPermission(userRole, 'staff:view')) {
      router.push('/admin');
      return;
    }
    if (pathname.startsWith('/admin/inventory') && !hasPermission(userRole, 'inventory:view')) {
      router.push('/admin');
      return;
    }
    if (pathname.startsWith('/admin/analytics') && !hasPermission(userRole, 'analytics:view_outlet')) {
      router.push('/admin');
      return;
    }

    setIsChecking(false);
  }, [user, isHydrated, pathname, router, userRole]);

  // Close sidebar automatically when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-xs font-mono text-stone-500">
          <span className="w-3.5 h-3.5 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
          <span>Authenticating Operations Session...</span>
        </div>
      </div>
    );
  }

  const currentTab =
    navItems.find((item) =>
      item.exact ? pathname === item.href : pathname.startsWith(item.href)
    ) || navItems[0] || allNavItems[0];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col md:flex-row font-sans selection:bg-stone-200">
      {/* =========================================================================
          DESKTOP PERSISTENT SIDEBAR (Hidden on mobile, visible on md: and up)
         ========================================================================= */}
      <aside className="hidden md:flex flex-col justify-between w-64 lg:w-72 bg-white border-r border-stone-200/90 h-screen sticky top-0 shrink-0 z-30">
        <div className="p-6 space-y-6">
          {/* Brand Header */}
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-[#1C1917] text-white flex items-center justify-center font-serif font-bold text-sm shadow-xs group-hover:bg-stone-800 transition">
              P&amp;R
            </div>
            <div>
              <span className="font-serif font-bold text-stone-900 text-sm tracking-tight block">
                Puffs &apos;n&apos; Rolls
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[9px] uppercase font-mono tracking-wider font-semibold px-2 py-0.2 rounded-full border ${roleDef.badge.bg} ${roleDef.badge.text} ${roleDef.badge.border}`}
                >
                  {roleDef.shortName}
                </span>
                <span className="text-[9px] text-stone-400 font-mono">
                  {roleDef.scope === 'ALL_OUTLETS' ? 'HQ' : 'Store'}
                </span>
              </div>
            </div>
          </Link>

          {/* Vertical Navigation Links */}
          <nav className="space-y-1 text-xs">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-medium transition cursor-pointer ${
                    isActive
                      ? 'bg-[#1C1917] text-white shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-amber-400' : 'text-stone-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop Sidebar Footer */}
        <div className="p-5 border-t border-stone-100 bg-[#FAF8F5]/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center font-serif font-bold text-xs text-stone-700">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-stone-900 block truncate">
                  {user?.name || 'Administrator'}
                </span>
                <span className="text-[10px] text-stone-400 font-mono block truncate">
                  {adminUser?.title || roleDef.name}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                router.push('/admin/login');
              }}
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/"
            target="_blank"
            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <span>View Live Storefront</span>
            <ExternalLink className="w-3 h-3 text-stone-400" />
          </Link>
        </div>
      </aside>

      {/* =========================================================================
          MOBILE TOP APP BAR (Visible on mobile screens)
         ========================================================================= */}
      <header className="md:hidden bg-white/95 border-b border-stone-200/90 sticky top-0 z-40 backdrop-blur-md px-4 h-14 flex items-center justify-between shadow-2xs">
        {/* Hamburger Toggle Button */}
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-2 -ml-2 rounded-xl text-stone-800 hover:bg-stone-100 transition active:scale-95 cursor-pointer"
          aria-label="Open Admin Menu"
        >
          <Menu className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Current Active Section Title */}
        <div className="text-center">
          <span className="font-serif font-bold text-sm text-stone-900 block">
            {currentTab.label}
          </span>
          <span className="text-[9px] uppercase font-mono tracking-wider font-semibold text-stone-400 block -mt-0.5">
            {roleDef.shortName} • P&amp;R Operations
          </span>
        </div>

        {/* Right shortcut: Storefront */}
        <Link
          href="/"
          target="_blank"
          className="p-2 -mr-2 rounded-xl text-stone-600 hover:bg-stone-100 transition cursor-pointer"
          title="Storefront"
        >
          <ExternalLink className="w-4 h-4 text-stone-500" />
        </Link>
      </header>

      {/* =========================================================================
          MOBILE SLIDE-OVER SIDEBAR DRAWER (Only rendered on mobile)
         ========================================================================= */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 animate-in fade-in duration-200">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Slide-in Drawer Container */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col justify-between z-50 p-5 animate-in slide-in-from-left duration-200">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#1C1917] text-white flex items-center justify-center font-serif font-bold text-xs shadow-xs">
                    P&amp;R
                  </div>
                  <div>
                    <span className="font-serif font-bold text-stone-900 text-sm block">
                      Puffs &apos;n&apos; Rolls
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {roleDef.shortName} ({roleDef.scope === 'ALL_OUTLETS' ? 'HQ' : 'Store'})
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Links */}
              <nav className="space-y-1 text-xs">
                {navItems.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-medium transition cursor-pointer ${
                        isActive
                          ? 'bg-[#1C1917] text-white shadow-xs font-semibold'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? 'text-amber-400' : 'text-stone-400'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight
                        className={`w-3.5 h-3.5 ${
                          isActive ? 'text-white' : 'text-stone-300'
                        }`}
                      />
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Mobile Drawer Footer */}
            <div className="border-t border-stone-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center font-serif font-bold text-xs text-stone-700">
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-stone-900 block truncate">
                      {user?.name || 'Administrator'}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono block truncate">
                      {adminUser?.title || roleDef.name}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    router.push('/admin/login');
                  }}
                  className="p-1.5 text-stone-400 hover:text-rose-600 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              <Link
                href="/"
                target="_blank"
                className="w-full py-2 px-3 rounded-xl bg-stone-100 text-stone-700 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Storefront</span>
                <ExternalLink className="w-3 h-3 text-stone-400" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}
