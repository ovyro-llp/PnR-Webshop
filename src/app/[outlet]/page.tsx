import { notFound } from 'next/navigation';
import { orderStore } from '@/lib/store/order-store';
import { Navbar } from '@/components/layout/Navbar';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { TrackingProvider } from '@/components/tracking/TrackingProvider';
import { PixelDebuggerBadge } from '@/components/tracking/PixelDebuggerBadge';
import { MapPin, Phone, Clock, Bike, Star, Sparkles, Tag, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function OutletPage({
  params,
}: {
  params: Promise<{ outlet: string }>;
}) {
  const { outlet: outletSlug } = await params;
  const outlet = orderStore.getOutletBySlug(outletSlug);

  if (!outlet) {
    notFound();
  }

  const menuItems = orderStore.getMenuItems(outletSlug);
  const outletCampaigns = orderStore
    .getCampaigns()
    .filter((c) => c.outletSlug === outletSlug && c.active);

  return (
    <TrackingProvider
      pixelId={outlet.defaultMetaPixelId}
      googleAdsId={outlet.defaultGoogleAdsId}
      outletSlug={outlet.slug}
    >
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Navbar currentOutletSlug={outlet.slug} />

        {/* Outlet Header Banner */}
        <section className="bg-white border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    FOCO Outlet Model
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Accepting Orders
                  </span>
                  <span className="text-xs font-medium text-stone-500 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {outlet.rating} ({outlet.reviewCount} reviews)
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
                  {outlet.name}
                </h1>
                <p className="text-stone-600 text-sm leading-relaxed">
                  {outlet.tagline}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    {outlet.address}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    {outlet.openingHours}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    {outlet.phone}
                  </span>
                </div>
              </div>

              {/* Delivery Promise Card */}
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 shrink-0 md:w-72">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-900 uppercase">
                      Mangwale Delivery
                    </p>
                    <p className="text-xs text-amber-700">
                      Dispatched in {outlet.deliveryTimeEstimate}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-stone-600 space-y-1 pt-1 border-t border-amber-200/50">
                  <div className="flex justify-between">
                    <span>Min. Order Value:</span>
                    <span className="font-semibold text-stone-800">₹{outlet.minOrderAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Zones:</span>
                    <span className="font-semibold text-stone-800">Nashik City</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Outlet Specific Active Campaigns */}
        {outletCampaigns.length > 0 && (
          <section className="bg-gradient-to-r from-amber-900 to-stone-900 text-white py-4 border-b border-amber-800/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                <span className="font-bold text-amber-200">Active Campaign:</span>
                <span className="font-medium">{outletCampaigns[0].title}</span>
              </div>
              <Link
                href={`/${outlet.slug}/${outletCampaigns[0].slug}`}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg transition flex items-center gap-1 shrink-0"
              >
                <span>View Dedicated Ad Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>
        )}

        {/* Outlet Menu Catalog */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900">
                Fresh Bakery Menu ({outlet.area})
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                Baked in small batches throughout the day. Available for immediate pickup or delivery.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-stone-600 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm">
              <Tag className="w-3.5 h-3.5 text-amber-600" />
              <span>Free Delivery above ₹299</span>
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {menuItems.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </main>

        {/* Cart Drawer & Tag Monitor */}
        <CartDrawer outletSlug={outlet.slug} />
        <PixelDebuggerBadge />
      </div>
    </TrackingProvider>
  );
}
