import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { orderStore } from '@/lib/store/order-store';
import { Navbar } from '@/components/layout/Navbar';
import { ProductView } from '@/components/product/ProductView';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { MobileCartBar } from '@/components/cart/MobileCartBar';
import { Footer } from '@/components/layout/Footer';
import { PageTracker } from '@/components/tracking/PageTracker';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ outlet?: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await orderStore.getProductBySlugAsync(slug);

  if (!product) {
    return {
      title: "Product Not Found | Puffs 'n' Rolls Nashik",
      description: "The requested bakery item could not be found.",
    };
  }

  const title = `${product.name} | Puffs 'n' Rolls Nashik`;
  const description =
    product.description && product.description.trim()
      ? `${product.description} Freshly baked at Puffs 'n' Rolls Nashik. Express doorstep delivery.`
      : `Order fresh ${product.name} online from Puffs 'n' Rolls Nashik. Artisanal bakery with express doorstep delivery across Nashik.`;

  const ogImage = product.image.startsWith('http')
    ? product.image
    : `https://shop.puffsnrolls.com${product.image}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
      type: 'website',
      url: `https://shop.puffsnrolls.com/product/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: ProductPageProps) {
  const { slug } = await params;
  const search = searchParams ? await searchParams : undefined;
  const product = await orderStore.getProductBySlugAsync(slug, search?.outlet);

  if (!product) {
    notFound();
  }

  // Related products from the same category
  const allCategoryProducts = await orderStore.getMasterProductsAsync({
    category: product.category,
    outletSlug: search?.outlet,
  });
  const relatedProducts = allCategoryProducts
    .filter((item) => item.id !== product.id)
    .slice(0, 4);

  // Marketing tags for Pixel & Google Ads
  const tags = await orderStore.getMarketingTagsAsync();
  const pixelId = (tags.globalMetaPixelId as string) || undefined;
  const googleAdsId = (tags.globalGoogleAdsId as string) || undefined;

  // Schema.org Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image.startsWith('http')
      ? product.image
      : `https://shop.puffsnrolls.com${product.image}`,
    description: product.description || product.name,
    category: product.category,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'INR',
      availability:
        product.isAvailable !== false
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: "Puffs 'n' Rolls",
      },
    },
  };

  const effectiveOutletSlug =
    search?.outlet || product.availableOutlets[0] || 'cycle-circle';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageTracker pixelId={pixelId} googleAdsId={googleAdsId} />

      <div className="min-h-screen flex flex-col bg-[#FDFCFB] overflow-x-hidden w-full">
        <Navbar currentOutletSlug={effectiveOutletSlug} />

        <main className="flex-1 w-full">
          <ProductView product={product} relatedProducts={relatedProducts} />
        </main>

        <Footer />
        <CartDrawer outletSlug={effectiveOutletSlug} />
        <MobileCartBar />
      </div>
    </>
  );
}
