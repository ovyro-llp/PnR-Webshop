import Link from 'next/link';
import Image from 'next/image';
import { OUTLETS, CAMPAIGNS, MENU_ITEMS } from '@/lib/data/mock-data';
import { Navbar } from '@/components/layout/Navbar';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { TrackingProvider } from '@/components/tracking/TrackingProvider';
import { PixelDebuggerBadge } from '@/components/tracking/PixelDebuggerBadge';
import { CustomerLoginModal } from '@/components/auth/CustomerLoginModal';
import { MapPin, ArrowRight, Sparkles, Clock, Star, Phone } from 'lucide-react';

export default function HomePage() {
  const bestsellers = MENU_ITEMS.filter((item) => item.isBestseller);

  return (
    <TrackingProvider
      pixelId="999888777666555"
      googleAdsId="AW-987654300"
    >
      <div className="min-h-screen flex flex-col bg-[#FDFCFB]">
        <Navbar />

        {/* Minimalist Hero Section */}
        <section className="relative border-b border-stone-200/80 py-16 sm:py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase bg-stone-100 text-stone-700 border border-stone-200">
                <Sparkles className="w-3 h-3 text-stone-500" />
                Where Every Bite Unrolls Happiness
              </div>
              <h1 className="text-4xl sm:text-6xl font-serif font-bold text-stone-900 tracking-tight leading-[1.15]">
                Artisanal Bakes, Warm Savory Rolls &amp; Celebration Cakes.
              </h1>
              <p className="text-base sm:text-lg text-stone-600 max-w-2xl leading-relaxed">
                Handcrafted daily across our three Nashik bakery outlets using pure butter, slow fermentation, and authentic recipes. Delivered fresh to your doorstep.
              </p>
            </div>

            {/* Outlets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {OUTLETS.map((outlet) => (
                <div
                  key={outlet.slug}
                  className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-7 hover:border-stone-400 transition-all duration-200 flex flex-col justify-between space-y-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold tracking-widest uppercase text-stone-400">
                        {outlet.area}
                      </span>
                      <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                        Open Now
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-xl text-stone-900">
                      {outlet.name.replace("Puffs 'n' Rolls - ", '')}
                    </h3>
                    <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                      {outlet.tagline}
                    </p>

                    <p className="text-xs text-stone-600 flex items-start gap-1.5 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{outlet.address}</span>
                    </p>
                  </div>

                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs text-stone-500 font-medium">
                      ~{outlet.deliveryTimeEstimate}
                    </span>
                    <Link
                      href={`/${outlet.slug}`}
                      className="px-4 py-2 bg-[#1C1917] hover:bg-stone-800 text-white font-medium text-xs rounded-full flex items-center gap-1.5 transition"
                    >
                      <span>Explore Outlet</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Targeted Performance Offers */}
        <section className="py-14 bg-[#FAF8F5] border-b border-stone-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-400 block">
                  Outlet Campaigns
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
                  Active Seasonal Offers
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  Tailored destinations with dynamic tracking and exclusive outlet menus.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {CAMPAIGNS.map((camp) => {
                const targetOutlet = OUTLETS.find((o) => o.slug === camp.outletSlug);
                return (
                  <div
                    key={camp.id}
                    className="bg-white rounded-3xl border border-stone-200/90 p-6 flex flex-col justify-between space-y-5 hover:border-stone-400 transition shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full">
                          {camp.badge}
                        </span>
                        <span className="text-xs font-bold text-stone-900">
                          {camp.discountPercentage}% OFF
                        </span>
                      </div>

                      <h3 className="font-serif font-bold text-lg text-stone-900 leading-snug">
                        {camp.title}
                      </h3>
                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {camp.subheadline}
                      </p>

                      <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 text-xs space-y-1">
                        <div className="flex justify-between text-stone-500">
                          <span>Outlet:</span>
                          <span className="font-medium text-stone-800">
                            {targetOutlet?.name.replace("Puffs 'n' Rolls - ", '')}
                          </span>
                        </div>
                        <div className="flex justify-between text-stone-500">
                          <span>Promo Code:</span>
                          <span className="font-mono text-stone-900 font-bold">
                            {camp.offerCode}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/${camp.outletSlug}/${camp.slug}`}
                      className="w-full py-2.5 bg-[#1C1917] hover:bg-stone-800 text-white rounded-full text-xs font-medium tracking-wide flex items-center justify-center gap-1.5 transition"
                    >
                      <span>View Campaign Destination</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Bestselling Catalog */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 flex-1">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-400 block">
              Handcrafted in Nashik
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
              Bestselling Creations
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Prepared in small batches every morning. Delivered piping hot.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestsellers.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        {/* Minimalist Footer */}
        <footer className="bg-[#1C1917] text-stone-400 py-12 text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <div className="relative h-10 w-36">
                  <Image
                    src="https://puffsnrolls.com/wp-content/uploads/2025/12/banner-logo.png"
                    alt="Puffs 'n' Rolls"
                    fill
                    className="object-contain brightness-0 invert"
                  />
                </div>
                <p className="text-stone-400 text-xs leading-relaxed max-w-xs">
                  Where Every Bite Unrolls Happiness. Handcrafted bakery delicacies since 2001.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">
                  Bakery Outlets (Nashik)
                </h4>
                <div className="space-y-1.5 text-stone-400">
                  <p>• College Road (Near BYK College)</p>
                  <p>• Nashik Road (Opp. Bytco Point)</p>
                  <p>• Indira Nagar (Govind Nagar Ring Road)</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">
                  Portals &amp; Assistance
                </h4>
                <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-stone-300">
                    <Phone className="w-3.5 h-3.5" />
                    +91 94236 39911
                  </p>
                  <div className="flex items-center gap-4 pt-1">
                    <Link href="/login" className="hover:text-white transition underline">
                      Customer Login
                    </Link>
                    <Link href="/admin/login" className="hover:text-white transition underline">
                      Admin Portal
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-stone-500 text-[11px] gap-2">
              <p>© 2026 Puffs &apos;n&apos; Rolls. All rights reserved.</p>
              <p>Baking Excellence Since 2001</p>
            </div>
          </div>
        </footer>

        {/* Cart Drawer, Login Modal & Tag Monitor */}
        <CartDrawer outletSlug="college-road" />
        <CustomerLoginModal />
        <PixelDebuggerBadge />
      </div>
    </TrackingProvider>
  );
}
