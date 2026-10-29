import Link from 'next/link';
import Image from 'next/image';
import { OUTLETS, CAMPAIGNS, MENU_ITEMS } from '@/lib/data/mock-data';
import { Navbar } from '@/components/layout/Navbar';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { TrackingProvider } from '@/components/tracking/TrackingProvider';
import { PixelDebuggerBadge } from '@/components/tracking/PixelDebuggerBadge';
import { MapPin, Phone, ArrowRight, Sparkles, Bike, ShieldCheck, Clock, Award } from 'lucide-react';

export default function HomePage() {
  const bestsellers = MENU_ITEMS.filter((item) => item.isBestseller);

  return (
    <TrackingProvider
      pixelId="999888777666555" // Brand level fallback Pixel ID
      googleAdsId="AW-987654300"
    >
      <div className="min-h-screen flex flex-col">
        <Navbar />

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900 text-white overflow-hidden py-16 sm:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                Nashik’s Most Loved Oven-Fresh Bakery
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                Warm Crispy Puffs, Stuffed Rolls &amp; Celebration Cakes.
              </h1>
              <p className="text-base sm:text-lg text-stone-300 max-w-2xl leading-relaxed">
                Choose your nearest Puffs &amp; Rolls outlet in Nashik for freshly baked orders dispatched directly to your doorstep in 25 minutes via Mangwale Logistics.
              </p>
            </div>

            {/* Quick Outlet Selector Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
              {OUTLETS.map((outlet) => (
                <div
                  key={outlet.slug}
                  className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 hover:bg-white/15 transition duration-200 flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        {outlet.area}
                      </span>
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                        Open Now
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition">
                      {outlet.name.replace('Puffs and Rolls - ', '')}
                    </h3>
                    <p className="text-xs text-stone-300 line-clamp-2">
                      {outlet.tagline}
                    </p>
                    <p className="text-xs text-stone-400 flex items-start gap-1 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{outlet.address}</span>
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                      <Bike className="w-3.5 h-3.5" />
                      {outlet.deliveryTimeEstimate}
                    </span>
                    <Link
                      href={`/${outlet.slug}`}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-1 transition"
                    >
                      <span>Order Here</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Live Performance Campaigns Section */}
        <section className="py-12 bg-amber-50/60 border-y border-amber-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">
                  Active Outlet Ad Campaigns
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-stone-900 mt-1">
                  Targeted Performance Offers
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 mt-1">
                  Each campaign runs with dynamic Meta Pixels and outlet-specific Mangwale routing.
                </p>
              </div>
              <Link
                href="/admin"
                className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Manage Pixel Tags in Admin</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {CAMPAIGNS.map((camp) => {
                const targetOutlet = OUTLETS.find((o) => o.slug === camp.outletSlug);
                return (
                  <div
                    key={camp.id}
                    className="bg-white rounded-2xl border border-amber-200/80 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition"
                  >
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          {camp.badge}
                        </span>
                        <span className="text-[11px] font-bold text-amber-700">
                          {camp.discountPercentage}% OFF
                        </span>
                      </div>
                      <h3 className="font-extrabold text-stone-900 text-base leading-snug">
                        {camp.title}
                      </h3>
                      <p className="text-xs text-stone-500 line-clamp-2">
                        {camp.subheadline}
                      </p>

                      <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
                        <div className="flex justify-between text-stone-600">
                          <span>Target Outlet:</span>
                          <span className="font-semibold text-stone-900">
                            {targetOutlet?.name.replace('Puffs and Rolls - ', '')}
                          </span>
                        </div>
                        <div className="flex justify-between text-stone-600">
                          <span>Meta Pixel Attached:</span>
                          <span className="font-mono text-emerald-600 font-medium">
                            {camp.metaPixelId}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-stone-50 border-t border-stone-100">
                      <Link
                        href={`/${camp.outletSlug}/${camp.slug}`}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                      >
                        <span>View Ad Landing Page</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Bestselling Menu Items */}
        <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 flex-1">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">
                Nashik’s Favorites
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 mt-1">
              Popular Fresh Bakes
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Select an item to add directly to your cart or choose your nearest outlet.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestsellers.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        {/* Mangwale Logistics Callout Banner */}
        <section className="bg-gradient-to-r from-amber-900 to-stone-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                <Bike className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-black">
                  Powered by Mangwale Logistics Nashik
                </h3>
                <p className="text-xs sm:text-sm text-amber-100/80 max-w-xl">
                  Every order placed is instantly routed to Mangwale Delivery API with exact outlet pickup and live GPS tracking for our customers.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/10 px-4 py-2 rounded-xl text-center">
                <p className="text-xs text-amber-300 font-bold">AVG DISPATCH</p>
                <p className="text-base font-extrabold">8 Mins</p>
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-xl text-center">
                <p className="text-xs text-emerald-300 font-bold">AVG DELIVERY</p>
                <p className="text-base font-extrabold">24 Mins</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-stone-950 text-stone-400 py-10 border-t border-stone-800 text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-bold text-white text-sm mb-2">Puffs and Rolls (P&amp;R)</h4>
                <p className="leading-relaxed">
                  Artisanal bakery and savory rolls across 3 prime locations in Nashik, Maharashtra.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-white text-sm mb-2">Our Outlets</h4>
                <p>• College Road (Near BYK College)</p>
                <p>• Nashik Road (Opp. Bytco Point)</p>
                <p>• Indira Nagar (Govind Nagar Ring Road)</p>
              </div>
              <div>
                <h4 className="font-bold text-white text-sm mb-2">Delivery Partner</h4>
                <p>Mangwale Nashik Logistics &amp; Hyperlocal Delivery Services</p>
                <p className="mt-2 text-stone-500">© 2026 Puffs &amp; Rolls. All rights reserved.</p>
              </div>
            </div>
          </div>
        </footer>

        {/* Dynamic Cart Drawer & Tag Monitor */}
        <CartDrawer outletSlug="college-road" />
        <PixelDebuggerBadge />
      </div>
    </TrackingProvider>
  );
}
