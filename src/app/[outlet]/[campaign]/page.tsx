import { notFound } from 'next/navigation';
import { orderStore } from '@/lib/store/order-store';
import { Navbar } from '@/components/layout/Navbar';
import { CampaignHero } from '@/components/marketing/CampaignHero';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { TrackingProvider } from '@/components/tracking/TrackingProvider';
import { PixelDebuggerBadge } from '@/components/tracking/PixelDebuggerBadge';
import { Star, ShieldCheck, Bike, Award, CheckCircle2 } from 'lucide-react';

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

  // Filter items specifically featured in this ad campaign, or fallback to all items
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
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Navbar currentOutletSlug={outlet.slug} currentCampaignSlug={campaignSlug} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 flex-1">
          {/* Performance Marketing Campaign Hero */}
          {campaign ? (
            <CampaignHero campaign={campaign} outlet={outlet} />
          ) : (
            <div className="bg-amber-900 text-white p-8 rounded-3xl">
              <h1 className="text-2xl font-bold">Special Offer at {outlet.name}</h1>
              <p className="text-sm text-amber-200 mt-1">
                Explore our chef recommendations with 25-minute Mangwale delivery.
              </p>
            </div>
          )}

          {/* Social Proof & Value Props Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-sm flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-900">100% Pure Butter</p>
                <p className="text-[10px] text-stone-500">Traditional flaky puff crust</p>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-sm flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Bike className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-900">Mangwale Logistics</p>
                <p className="text-[10px] text-stone-500">25-min hot delivery in Nashik</p>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-sm flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-900">4.8+ Star Rating</p>
                <p className="text-[10px] text-stone-500">Over 850+ local reviews</p>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-sm flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-900">Hygiene Assured</p>
                <p className="text-[10px] text-stone-500">FSSAI certified kitchens</p>
              </div>
            </div>
          </div>

          {/* Featured Campaign Items */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">
                  Featured In This Ad Campaign
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 mt-0.5">
                  Hand-Picked Chef Specials
                </h2>
              </div>
              <span className="text-xs text-stone-500 font-medium">
                {featuredItems.length} curated offers
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredItems.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>

          {/* More Menu Choices */}
          {remainingItems.length > 0 && (
            <section className="space-y-4 pt-6 border-t border-stone-200">
              <h3 className="text-lg font-bold text-stone-900">
                More from {outlet.name}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {remainingItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {/* Local Nashik Reviews */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-stone-900">
                  What Nashik Foodies Say
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Verified orders fulfilled from our {outlet.area} branch
                </p>
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-2">
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                </div>
                <p className="text-stone-700 italic">
                  &ldquo;The Paneer Makhani puff was piping hot when it arrived! Mangwale delivered in just 20 minutes to Gangapur Road.&rdquo;
                </p>
                <p className="font-bold text-stone-900">— Tanvi Joshi, Nashik</p>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-2">
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                </div>
                <p className="text-stone-700 italic">
                  &ldquo;Best chocolate truffle cake in Nashik Road. We ordered through their Instagram campaign and the offer coupon worked smoothly.&rdquo;
                </p>
                <p className="font-bold text-stone-900">— Rahul Gaikwad, Nashik Road</p>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-2">
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                </div>
                <p className="text-stone-700 italic">
                  &ldquo;Fresh crispy puffs every single evening. The WhatsApp live rider tracking was super convenient.&rdquo;
                </p>
                <p className="font-bold text-stone-900">— Snehal Shirole, Indira Nagar</p>
              </div>
            </div>
          </section>
        </main>

        {/* Cart Drawer & Tag Monitor */}
        <CartDrawer outletSlug={outlet.slug} campaignSlug={campaignSlug} />
        <PixelDebuggerBadge />
      </div>
    </TrackingProvider>
  );
}
