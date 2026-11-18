import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Geist, Geist_Mono, Playfair_Display } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { TrackingProvider } from '@/components/tracking/TrackingProvider';
import { CartProvider } from '@/context/CartContext';
import { LocationProvider } from '@/context/LocationContext';
import { CustomerLoginModal } from '@/components/auth/CustomerLoginModal';
import { LocationPromptModal } from '@/components/location/LocationPromptModal';
import { orderStore } from '@/lib/store/order-store';
import { parseCustomHeaderScripts } from '@/lib/marketing/parse-header-scripts';

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
  const parsedHeader = parseCustomHeaderScripts(tags.customHeaderScript as string | undefined);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <head>
        {parsedHeader.metaTags.map((meta, idx) => (
          <meta
            key={`pnr-meta-${idx}`}
            name={meta.name}
            property={meta.property}
            content={meta.content}
            httpEquiv={meta.httpEquiv}
            charSet={meta.charSet}
          />
        ))}
      </head>
      <body className="min-h-full flex flex-col bg-[#FDFCFB] text-stone-900 font-sans selection:bg-stone-200 overflow-x-hidden w-full">
        {parsedHeader.scripts.map((scr) =>
          scr.src ? (
            <Script
              key={scr.id}
              id={scr.id}
              src={scr.src}
              strategy="afterInteractive"
            />
          ) : scr.inlineCode ? (
            <Script
              key={scr.id}
              id={scr.id}
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{ __html: scr.inlineCode }}
            />
          ) : null
        )}
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
