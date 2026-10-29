import { notFound } from 'next/navigation';
import { orderStore } from '@/lib/store/order-store';
import { Navbar } from '@/components/layout/Navbar';
import { CampaignHero } from '@/components/marketing/CampaignHero';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { TrackingProvider } from '@/components/tracking/TrackingProvider';
import { Star, ShieldCheck, CheckCircle2, Award, Clock } from 'lucide-react';

export default async function CampaignLandingPage({
  params,
}: {
  params: Promise<{ outlet: string; campaign: string }>;
}) {
  const { outlet: outletSlug, campaign: campaignSlug } = await params;
  const outlet = orderStore.getOutletBySlug(outletSlug);

  if (!outlet) {
    notFound();
  }

  const campaign = orderStore.getCampaign(outletSlug, campaignSlug);
  const allOutletItems = orderStore.getMenuItems(outletSlug);

  const featuredItems = campaign?.featuredItemIds
    ? allOutletItems.filter((i) => campaign.featuredItemIds?.includes(i.id))
    : allOutletItems.slice(0, 4);

  const remainingItems = allOutletItems.filter(
    (i) => !featuredItems.some((f) => f.id === i.id)
  );

  const pixelId = campaign?.metaPixelId || outlet.defaultMetaPixelId;
  const googleAdsId = campaign?.googleAdsId || outlet.defaultGoogleAdsId;

  return (
    <TrackingProvider
      pixelId={pixelId}
      googleAdsId={googleAdsId}
      outletSlug={outlet.slug}
      campaignSlug={campaignSlug}
    >
      <div className="min-h-screen flex flex-col bg-[#FDFCFB]">
        <Navbar currentOutletSlug={outlet.slug} currentCampaignSlug={campaignSlug} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 flex-1">
          {/* Performance Hero */}
          {campaign ? (
            <CampaignHero campaign={campaign} outlet={outlet} />
          ) : (
            <div className="bg-[#FAF8F5] p-8 rounded-3xl border border-stone-200">
              <h1 className="text-2xl font-serif font-bold text-stone-900">
                Special Offer at {outlet.name}
              </h1>
            </div>
          )}

          {/* Social Proof Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-900">100% Pure Butter</p>
                <p className="text-[10px] text-stone-500">Traditional flaky pastry</p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-900">25-Min Dispatch</p>
                <p className="text-[10px] text-stone-500">Direct to your doorstep</p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-900">Since 2001</p>
                <p className="text-[10px] text-stone-500">Over 25 years of trust</p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-900">Quality Certified</p>
                <p className="text-[10px] text-stone-500">Hygiene assured kitchen</p>
              </div>
            </div>
          </div>

          {/* Featured Campaign Items */}
          <section className="space-y-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-400 block">
                Featured Specials
              </span>
              <h2 className="text-2xl font-serif font-bold text-stone-900 mt-0.5">
                Hand-Crafted Bestsellers
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredItems.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>

          {/* Remaining Items */}
          {remainingItems.length > 0 && (
            <section className="space-y-4 pt-8 border-t border-stone-200">
              <h3 className="text-lg font-serif font-bold text-stone-900">
                More from {outlet.name}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {remainingItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {/* Customer Reviews */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif font-bold text-stone-900">
                  Customer Reflections
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Verified orders from our {outlet.area} bakery
                </p>
              </div>
              <div className="flex items-center gap-1 text-stone-800">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-stone-800" />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-2">
                <p className="text-stone-700 italic">
                  &ldquo;The Paneer Makhani puff was piping hot when it arrived. Delivered in just 20 minutes to Gangapur Road.&rdquo;
                </p>
                <p className="font-semibold text-stone-900">— Tanvi Joshi, Nashik</p>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-2">
                <p className="text-stone-700 italic">
                  &ldquo;Best chocolate truffle cake in Nashik Road. We ordered through their Instagram campaign and the offer coupon worked smoothly.&rdquo;
                </p>
                <p className="font-semibold text-stone-900">— Rahul Gaikwad, Nashik Road</p>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-2">
                <p className="text-stone-700 italic">
                  &ldquo;Fresh crispy puffs every single evening. The WhatsApp live rider tracking was super convenient.&rdquo;
                </p>
                <p className="font-semibold text-stone-900">— Snehal Shirole, Indira Nagar</p>
              </div>
            </div>
          </section>
        </main>

        <CartDrawer outletSlug={outlet.slug} campaignSlug={campaignSlug} />
      </div>
    </TrackingProvider>
  );
}
