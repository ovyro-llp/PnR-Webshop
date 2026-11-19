import { notFound } from 'next/navigation';
import { orderStore } from '@/lib/store/order-store';
import { Navbar } from '@/components/layout/Navbar';
import { CampaignHero } from '@/components/marketing/CampaignHero';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { MobileCartBar } from '@/components/cart/MobileCartBar';
import { PageTracker } from '@/components/tracking/PageTracker';
import { isB2COutletAcceptingOrders } from '@/lib/outlet-timing';
import { Star, ShieldCheck, CheckCircle2, Award, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CampaignLandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ outlet: string; campaign: string }>;
  searchParams?: Promise<{ simulatedTime?: string }>;
}) {
  const { outlet: outletSlug, campaign: campaignSlug } = await params;
  const search = searchParams ? await searchParams : undefined;
  const outlet = orderStore.getOutletBySlug(outletSlug);

  if (!outlet) {
    notFound();
  }

  let simDate: Date | undefined;
  if (search?.simulatedTime) {
    const [h, m] = search.simulatedTime.split(':').map(Number);
    simDate = new Date(`2026-11-15T${String(h).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}:00+05:30`);
  }

  const acceptance = isB2COutletAcceptingOrders(outlet, simDate);
  const allOutlets = orderStore.getOutlets();
  const alternativeOutlet = allOutlets.find(
    (o) => o.slug !== outletSlug && isB2COutletAcceptingOrders(o, simDate).isAccepting
  );
  const campaign = orderStore.getCampaign(outletSlug, campaignSlug);
  const allOutletItems = orderStore.getMenuItems(outletSlug);

  const featuredItems = campaign?.featuredItemIds
    ? allOutletItems.filter((i) => campaign.featuredItemIds?.includes(i.id))
    : allOutletItems.slice(0, 4);

  const remainingItems = allOutletItems.filter(
    (i) => !featuredItems.some((f) => f.id === i.id)
  );

  const pixelId = campaign?.metaPixelId || outlet.defaultMetaPixelId || undefined;
  const googleAdsId = campaign?.googleAdsId || outlet.defaultGoogleAdsId || undefined;

  return (
    <>
      <PageTracker
        pixelId={pixelId}
        googleAdsId={googleAdsId}
        outletSlug={outlet.slug}
        campaignSlug={campaignSlug}
      />
      <div className="min-h-screen flex flex-col bg-[#FDFCFB] overflow-x-hidden w-full">
        <Navbar currentOutletSlug={outlet.slug} currentCampaignSlug={campaignSlug} />

        {/* Notice if outlet orders are paused or closed */}
        {acceptance.isPausedByAdmin ? (
          <div className="bg-amber-50 border-b border-amber-200 py-3.5 px-4">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-center sm:text-left">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                <p className="text-xs sm:text-sm text-amber-950 font-medium">
                  <strong>{outlet.name}</strong> is currently unavailable for online delivery.
                  {alternativeOutlet && (
                    <span className="text-stone-700"> You can order fresh bakes from our nearby <strong>{alternativeOutlet.name}</strong> kitchen!</span>
                  )}
                </p>
              </div>
              {alternativeOutlet && (
                <Link
                  href={`/${alternativeOutlet.slug}`}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-xs font-bold transition shadow-xs shrink-0 cursor-pointer"
                >
                  <span>Order from {alternativeOutlet.name.replace("Puffs 'n' Rolls - ", '')}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </Link>
              )}
            </div>
          </div>
        ) : !acceptance.timing.isOpen ? (
          <div className="bg-amber-50 border-b border-amber-200 py-3 px-4 text-center text-xs text-amber-950 font-medium flex items-center justify-center gap-2">
            <span>🕒 <strong>Operating Hours (10:00 AM – 10:00 PM):</strong> {outlet.name} accepts customer orders only between 10:00 AM and 10:00 PM. We are currently closed for order taking (Current time: {acceptance.timing.currentIstTime} IST). Orders open {acceptance.timing.nextOpenTimeText.toLowerCase()}.</span>
          </div>
        ) : null}

        <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-8 sm:space-y-12 flex-1 w-full">
          {/* Performance Hero */}
          {campaign ? (
            <CampaignHero campaign={campaign} outlet={outlet} />
          ) : (
            <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-stone-200">
              <h1 className="text-xl font-serif font-bold text-stone-900">
                Special Offer at {outlet.name}
              </h1>
            </div>
          )}

          {/* Social Proof Bar: Ergonomic 2-col on mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 w-full">
            <div className="p-3 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-stone-900 truncate">100% Pure Butter</p>
                <p className="text-[10px] text-stone-500 truncate">Traditional crust</p>
              </div>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-stone-900 truncate">Express Delivery</p>
                <p className="text-[10px] text-stone-500 truncate">To your doorstep</p>
              </div>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center shrink-0">
                <Award className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-stone-900 truncate">Since 2001</p>
                <p className="text-[10px] text-stone-500 truncate">25 years of trust</p>
              </div>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-stone-900 truncate">Hygiene Assured</p>
                <p className="text-[10px] text-stone-500 truncate">Certified bakes</p>
              </div>
            </div>
          </div>

          {/* Featured Campaign Items */}
          <section className="space-y-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-400 block">
                Featured Specials
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mt-0.5">
                Hand-Crafted Bestsellers
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {featuredItems.map((item) => (
                <MenuItemCard key={item.id} item={item} outletSlug={outlet.slug} />
              ))}
            </div>
          </section>

          {/* Remaining Items */}
          {remainingItems.length > 0 && (
            <section className="space-y-4 pt-6 border-t border-stone-200">
              <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900">
                More from {outlet.name}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {remainingItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} outletSlug={outlet.slug} />
                ))}
              </div>
            </section>
          )}

          {/* Customer Reflections */}
          <section className="bg-white rounded-3xl p-5 sm:p-8 border border-stone-200/80 space-y-4 sm:space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900">
                  Customer Reflections
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Verified orders from our {outlet.area} bakery
                </p>
              </div>
              <div className="flex items-center gap-0.5 text-stone-800">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-stone-800" />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-100 space-y-1.5">
                <p className="text-stone-700 italic">
                  &ldquo;The Paneer Makhani puff was piping hot when it arrived. Delivered fresh to Gangapur Road via express delivery.&rdquo;
                </p>
                <p className="font-semibold text-stone-900">— Tanvi Joshi, Nashik</p>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-100 space-y-1.5">
                <p className="text-stone-700 italic">
                  &ldquo;Best chocolate truffle cake in Old Nashik. We ordered for our family celebration and the delivery arrived right on schedule.&rdquo;
                </p>
                <p className="font-semibold text-stone-900">— Rahul Gaikwad, ND Patel Road</p>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-100 space-y-1.5">
                <p className="text-stone-700 italic">
                  &ldquo;Fresh crispy puffs every single evening. The WhatsApp live rider tracking was super convenient.&rdquo;
                </p>
                <p className="font-semibold text-stone-900">— Snehal Shirole, College Road</p>
              </div>
            </div>
          </section>
        </main>

        <MobileCartBar />
        <CartDrawer outletSlug={outlet.slug} campaignSlug={campaignSlug} />
      </div>
    </>
  );
}
