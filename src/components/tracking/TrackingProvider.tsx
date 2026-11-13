'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import Script from 'next/script';
import { fireClientPixel, ensureMetaPixelInitialized } from '@/lib/tracking/pixel-tracker';

interface TrackingItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}

interface TrackingContextType {
  pixelId?: string;
  googleAdsId?: string;
  outletSlug?: string;
  campaignSlug?: string;
  setPageContext: (ctx: {
    outletSlug?: string;
    campaignSlug?: string;
    pixelId?: string;
    googleAdsId?: string;
  }) => void;
  trackCustomEvent: (eventName: string, data?: Record<string, unknown>) => void;
  trackAddToCart: (item: TrackingItem) => void;
  trackInitiateCheckout: (value: number, itemCount: number, items?: TrackingItem[]) => void;
  trackPurchase: (orderId: string, value: number, items: unknown[]) => void;
}

const TrackingContext = createContext<TrackingContextType>({
  setPageContext: () => {},
  trackCustomEvent: () => {},
  trackAddToCart: () => {},
  trackInitiateCheckout: () => {},
  trackPurchase: () => {},
});

export const useTracking = () => useContext(TrackingContext);

interface TrackingProviderProps {
  children: React.ReactNode;
  initialPixelId?: string;
  initialGoogleAdsId?: string;
  initialOutletSlug?: string;
  initialCampaignSlug?: string;
}

export function TrackingProvider({
  children,
  initialPixelId,
  initialGoogleAdsId,
  initialOutletSlug,
  initialCampaignSlug,
}: TrackingProviderProps) {
  const [pixelId, setPixelId] = useState<string | undefined>(initialPixelId);
  const [googleAdsId, setGoogleAdsId] = useState<string | undefined>(initialGoogleAdsId);
  const [outletSlug, setOutletSlug] = useState<string | undefined>(initialOutletSlug);
  const [campaignSlug, setCampaignSlug] = useState<string | undefined>(initialCampaignSlug);

  // If no initial pixel ID passed, fetch global marketing tags from API
  useEffect(() => {
    if (!pixelId) {
      fetch('/api/marketing')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.tags) {
            if (data.tags.globalMetaPixelId) {
              setPixelId((prev) => prev || data.tags.globalMetaPixelId);
            }
            if (data.tags.globalGoogleAdsId) {
              setGoogleAdsId((prev) => prev || data.tags.globalGoogleAdsId);
            }
          }
        })
        .catch(() => {});
    }
  }, [pixelId]);

  // Track single PageView on route or parameter changes (deduplicated)
  useEffect(() => {
    const activePixel = pixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID;
    if (!activePixel) return;

    ensureMetaPixelInitialized(activePixel);
    fireClientPixel(
      'PageView',
      {
        outlet: outletSlug,
        campaign: campaignSlug,
      },
      activePixel,
      `pv_${outletSlug || 'home'}_${campaignSlug || 'main'}`
    );
  }, [pixelId, outletSlug, campaignSlug]);

  const setPageContext = useCallback(
    (ctx: {
      outletSlug?: string;
      campaignSlug?: string;
      pixelId?: string;
      googleAdsId?: string;
    }) => {
      if (ctx.pixelId !== undefined) setPixelId(ctx.pixelId);
      if (ctx.googleAdsId !== undefined) setGoogleAdsId(ctx.googleAdsId);
      if (ctx.outletSlug !== undefined) setOutletSlug(ctx.outletSlug);
      if (ctx.campaignSlug !== undefined) setCampaignSlug(ctx.campaignSlug);
    },
    []
  );

  const trackCustomEvent = useCallback(
    (eventName: string, data: Record<string, unknown> = {}) => {
      fireClientPixel(
        eventName,
        {
          outlet: outletSlug,
          campaign: campaignSlug,
          ...data,
        },
        pixelId
      );
    },
    [outletSlug, campaignSlug, pixelId]
  );

  const trackAddToCart = useCallback(
    (item: TrackingItem) => {
      const eventId = `add_${item.id}_${Date.now()}`;
      fireClientPixel(
        'AddToCart',
        {
          content_name: item.name,
          content_category: item.category || 'Bakery Bakes',
          content_ids: [item.id],
          contents: [
            {
              id: item.id,
              quantity: item.quantity,
              item_price: item.price,
            },
          ],
          content_type: 'product',
          value: item.price * item.quantity,
          currency: 'INR',
          outlet: outletSlug,
          campaign: campaignSlug,
        },
        pixelId,
        eventId
      );
    },
    [outletSlug, campaignSlug, pixelId]
  );

  const trackInitiateCheckout = useCallback(
    (value: number, itemCount: number, items: TrackingItem[] = []) => {
      const eventId = `init_chk_${Date.now()}`;
      const contentIds = items.map((i) => i.id);
      const contents = items.map((i) => ({
        id: i.id,
        quantity: i.quantity,
        item_price: i.price,
      }));

      fireClientPixel(
        'InitiateCheckout',
        {
          value,
          currency: 'INR',
          num_items: itemCount,
          content_type: 'product',
          content_ids: contentIds,
          contents: contents.length > 0 ? contents : undefined,
          outlet: outletSlug,
          campaign: campaignSlug,
        },
        pixelId,
        eventId
      );
    },
    [outletSlug, campaignSlug, pixelId]
  );

  const trackPurchase = useCallback(
    (orderId: string, value: number, rawItems: unknown[] = []) => {
      const items = (rawItems || []) as Array<{
        id?: string;
        itemId?: string;
        name?: string;
        price?: number;
        quantity?: number;
        item?: { id?: string; name?: string; price?: number };
      }>;

      const contentIds = items.map((i) => i.itemId || i.item?.id || i.id || 'item');
      const contents = items.map((i) => ({
        id: i.itemId || i.item?.id || i.id || 'item',
        quantity: i.quantity || 1,
        item_price: i.price || i.item?.price || 0,
      }));
      const numItems = items.reduce((sum, i) => sum + (i.quantity || 1), 0);

      const payload = {
        order_id: orderId,
        value,
        currency: 'INR',
        num_items: numItems,
        content_type: 'product',
        content_ids: contentIds,
        contents,
        outlet: outletSlug,
        campaign: campaignSlug,
      };

      // Meta Standard Event: Purchase (Shared eventID with server CAPI for exact deduplication)
      fireClientPixel('Purchase', payload, pixelId, orderId);

      // Complementary Sale event in marketing ledger
      fireClientPixel('Sale', payload, pixelId, `sale_${orderId}`);
    },
    [outletSlug, campaignSlug, pixelId]
  );

  const activePixelId = pixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

  const contextValue = useMemo(
    () => ({
      pixelId: activePixelId,
      googleAdsId,
      outletSlug,
      campaignSlug,
      setPageContext,
      trackCustomEvent,
      trackAddToCart,
      trackInitiateCheckout,
      trackPurchase,
    }),
    [
      activePixelId,
      googleAdsId,
      outletSlug,
      campaignSlug,
      setPageContext,
      trackCustomEvent,
      trackAddToCart,
      trackInitiateCheckout,
      trackPurchase,
    ]
  );

  return (
    <TrackingContext.Provider value={contextValue}>
      {/* Dynamic Meta Pixel Script - Injected Once, Single PageView */}
      {activePixelId && (
        <>
          <script
            id={`meta-pixel-${activePixelId}`}
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${activePixelId}');
              `,
            }}
          />
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${activePixelId}&ev=PageView&noscript=1`}
              alt="pixel-beacon"
            />
          </noscript>
        </>
      )}

      {/* Dynamic Google Ads Tag Script */}
      {googleAdsId && (
        <>
          <Script
            id={`gtag-src-${googleAdsId}`}
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`}
          />
          <Script
            id={`gtag-init-${googleAdsId}`}
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${googleAdsId}');
              `,
            }}
          />
        </>
      )}

      {children}
    </TrackingContext.Provider>
  );
}

export { PageTracker } from './PageTracker';
