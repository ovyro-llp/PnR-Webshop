import Link from 'next/link';
import Image from 'next/image';
import { orderStore } from '@/lib/store/order-store';
import { MENU_ITEMS } from '@/lib/data/mock-data';
import { Navbar } from '@/components/layout/Navbar';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { MobileCartBar } from '@/components/cart/MobileCartBar';
import { TrackingProvider } from '@/components/tracking/TrackingProvider';
import { CustomerLoginModal } from '@/components/auth/CustomerLoginModal';
import { MapPin, ArrowRight, Sparkles, Phone, Compass } from 'lucide-react';

export default function HomePage() {
  const outlets = orderStore.getOutlets();
  const bestsellers = MENU_ITEMS.filter((item) => item.isBestseller);

  return (
    <TrackingProvider
      pixelId="999888777666555"
      googleAdsId="AW-987654300"
    >
      <div className="min-h-screen flex flex-col bg-[#FDFCFB] overflow-x-hidden w-full">
        <Navbar />

        {/* Minimalist Mobile-First Hero Section */}
        <section className="relative border-b border-stone-200/80 py-10 sm:py-20 overflow-hidden w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="max-w-3xl space-y-3.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase bg-stone-100 text-stone-700 border border-stone-200">
                <Sparkles className="w-3 h-3 text-stone-500" />
                Where Every Bite Unrolls Happiness
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-stone-900 tracking-tight leading-snug sm:leading-tight">
                Artisanal Bakes, Warm Savory Rolls &amp; Celebration Cakes.
              </h1>
              <p className="text-xs sm:text-base text-stone-600 max-w-2xl leading-relaxed">
                Handcrafted daily across our three Nashik bakery outlets using pure butter, slow fermentation, and authentic recipes. Delivered fresh to your doorstep.
              </p>
            </div>

            {/* Outlets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-1">
              {outlets.map((outlet) => (
                <div
                  key={outlet.slug}
                  className="bg-white border border-stone-200/90 rounded-3xl p-5 sm:p-7 hover:border-stone-400 transition-all duration-200 flex flex-col justify-between space-y-5 shadow-xs"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold tracking-widest uppercase text-stone-400">
                        {outlet.area}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        outlet.isOpen ? 'text-emerald-800 bg-emerald-50' : 'text-rose-800 bg-rose-50'
                      }`}>
                        {outlet.isOpen ? 'Open Now' : 'Orders Paused'}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-lg sm:text-xl text-stone-900">
                      {outlet.name.replace("Puffs 'n' Rolls - ", '')}
                    </h3>
                    <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                      {outlet.tagline}
                    </p>

                    <div className="space-y-1.5 pt-1 text-xs text-stone-600">
                      <p className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{outlet.address}</span>
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                        <a href={`tel:${outlet.phone}`} className="flex items-center gap-1 hover:text-stone-950 font-mono">
                          <Phone className="w-3 h-3 text-stone-400" />
                          <span>{outlet.phone}</span>
                        </a>
                        {outlet.googleMapsUrl && (
                          <a
                            href={outlet.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-stone-800 hover:text-amber-700 font-medium transition"
                          >
                            <Compass className="w-3 h-3 text-amber-600" />
                            <span>Directions</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3.5 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs text-stone-500 font-medium">
                      ~{outlet.deliveryTimeEstimate}
                    </span>
                    <Link
                      href={`/${outlet.slug}`}
                      className="px-4 py-2 bg-[#1C1917] hover:bg-stone-800 active:scale-95 text-white font-medium text-xs rounded-full flex items-center gap-1.5 transition"
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

        {/* Bestselling Catalog */}
        <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 flex-1 w-full">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-400 block">
              Handcrafted in Nashik
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-stone-900 mt-0.5">
              Bestselling Creations
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Prepared in small batches every morning. Delivered piping hot.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {bestsellers.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        {/* Minimalist Mobile-First Footer */}
        <footer className="bg-[#1C1917] text-stone-400 py-10 sm:py-12 text-xs w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="space-y-2">
                <div className="relative h-9 w-32">
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
                <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-2 sm:mb-3">
                  Bakery Outlets (Nashik)
                </h4>
                <div className="space-y-1 text-stone-400">
                  <p>• College Road (Near BYK College)</p>
                  <p>• Nashik Road (Opp. Bytco Point)</p>
                  <p>• Indira Nagar (Govind Nagar Ring Road)</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-2 sm:mb-3">
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

        {/* Mobile Sticky Cart Bar, Cart Drawer & Login Modal */}
        <MobileCartBar />
        <CartDrawer outletSlug="college-road" />
        <CustomerLoginModal />
      </div>
    </TrackingProvider>
  );
}
