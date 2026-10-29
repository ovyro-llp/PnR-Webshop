import { notFound } from 'next/navigation';
import { orderStore } from '@/lib/store/order-store';
import { Navbar } from '@/components/layout/Navbar';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { MobileCartBar } from '@/components/cart/MobileCartBar';
import { TrackingProvider } from '@/components/tracking/TrackingProvider';
import { MapPin, Phone, Clock, Star, Sparkles, ArrowRight } from 'lucide-react';
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
      <div className="min-h-screen flex flex-col bg-[#FDFCFB] overflow-x-hidden w-full">
        <Navbar currentOutletSlug={outlet.slug} />

        {/* Minimalist Outlet Header */}
        <section className="bg-white border-b border-stone-200/80 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
              <div className="space-y-2.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                    Nashik Bakery Outlet
                  </span>
                  <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    Baking Fresh
                  </span>
                  <span className="text-xs text-stone-500 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-stone-700 text-stone-700" />
                    {outlet.rating} ({outlet.reviewCount})
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight">
                  {outlet.name}
                </h1>
                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                  {outlet.tagline}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 pt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    {outlet.address}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    {outlet.openingHours}
                  </span>
                </div>
              </div>

              {/* Delivery Details Pill */}
              <div className="bg-[#FAF8F5] border border-stone-200 rounded-2xl p-4 space-y-1.5 shrink-0 md:w-64">
                <span className="text-[9px] uppercase tracking-wider font-semibold text-stone-400 block">
                  Delivery Details
                </span>
                <p className="text-xs sm:text-sm font-serif font-bold text-stone-900">
                  {outlet.deliveryTimeEstimate} Doorstep Delivery
                </p>
                <div className="text-[11px] text-stone-500 flex justify-between pt-1 border-t border-stone-200/60">
                  <span>Min. Order: ₹{outlet.minOrderAmount}</span>
                  <span className="text-emerald-700 font-medium">Nashik City</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Outlet Active Campaign Bar */}
        {outletCampaigns.length > 0 && (
          <section className="bg-[#1C1917] text-white py-3 border-b border-stone-800 w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                <span className="font-medium truncate">{outletCampaigns[0].title}</span>
              </div>
              <Link
                href={`/${outlet.slug}/${outletCampaigns[0].slug}`}
                className="px-3.5 py-1 bg-white hover:bg-stone-200 text-stone-950 rounded-full font-medium transition flex items-center gap-1 shrink-0 self-start sm:self-auto text-[11px]"
              >
                <span>View Offer</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </section>
        )}

        {/* Menu Catalog */}
        <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 sm:space-y-8 flex-1 w-full">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-400 block">
              Outlet Catalog
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mt-0.5">
              Fresh Menu ({outlet.area})
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Baked in small batches throughout the day. Free delivery above ₹299.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {menuItems.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </main>

        <MobileCartBar />
        <CartDrawer outletSlug={outlet.slug} />
      </div>
    </TrackingProvider>
  );
}
