import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Playfair_Display } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { TrackingProvider } from '@/components/tracking/TrackingProvider';
import { CartProvider } from '@/context/CartContext';
import { LocationProvider } from '@/context/LocationContext';
import { CustomerLoginModal } from '@/components/auth/CustomerLoginModal';
import { LocationPromptModal } from '@/components/location/LocationPromptModal';
import { orderStore } from '@/lib/store/order-store';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Puffs 'n' Rolls | Where Every Bite Unrolls Happiness | Nashik",
  description:
    "Artisanal bakery in Nashik since 2001. Fresh oven-baked puffs, loaded savory rolls, celebration cakes & handcrafted pastries delivered fresh from your nearest bakery kitchen.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tags = await orderStore.getMarketingTagsAsync();
  const initialPixelId = (tags.globalMetaPixelId as string) || '';
  const initialGoogleAdsId = (tags.globalGoogleAdsId as string) || '';

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <head>
        {tags.customHeaderScript ? (
          <div
            dangerouslySetInnerHTML={{ __html: tags.customHeaderScript }}
            style={{ display: 'contents' }}
          />
        ) : null}
      </head>
      <body className="min-h-full flex flex-col bg-[#FDFCFB] text-stone-900 font-sans selection:bg-stone-200 overflow-x-hidden w-full">
        <AuthProvider>
          <LocationProvider>
            <TrackingProvider
              initialPixelId={initialPixelId}
              initialGoogleAdsId={initialGoogleAdsId}
            >
              <CartProvider>
                {children}
                <CustomerLoginModal />
                <LocationPromptModal />
              </CartProvider>
            </TrackingProvider>
          </LocationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
