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
  const [globalPixelId, setGlobalPixelId] = useState<string>(initialPixelId || '');
  const [overridePixelId, setOverridePixelId] = useState<string | undefined>(undefined);
  const [globalGoogleAdsId, setGlobalGoogleAdsId] = useState<string>(initialGoogleAdsId || '');
  const [overrideGoogleAdsId, setOverrideGoogleAdsId] = useState<string | undefined>(undefined);
  const [outletSlug, setOutletSlug] = useState<string | undefined>(initialOutletSlug);
  const [campaignSlug, setCampaignSlug] = useState<string | undefined>(initialCampaignSlug);

  const activePixelId = (overridePixelId && overridePixelId.trim()) || globalPixelId || '';
  const activeGoogleAdsId = (overrideGoogleAdsId && overrideGoogleAdsId.trim()) || globalGoogleAdsId || '';

  // Synchronize if initial server props update
  useEffect(() => {
    if (initialPixelId) setGlobalPixelId(initialPixelId);
    if (initialGoogleAdsId) setGlobalGoogleAdsId(initialGoogleAdsId);
  }, [initialPixelId, initialGoogleAdsId]);

  // Fetch global marketing tags configured directly from the Front-End Admin Panel
  useEffect(() => {
    fetch('/api/marketing')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.tags) {
          if (typeof data.tags.globalMetaPixelId === 'string') {
            setGlobalPixelId(data.tags.globalMetaPixelId);
          }
          if (typeof data.tags.globalGoogleAdsId === 'string') {
            setGlobalGoogleAdsId(data.tags.globalGoogleAdsId);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Track single PageView on route or parameter changes (deduplicated)
  useEffect(() => {
    if (!activePixelId) return;

    ensureMetaPixelInitialized(activePixelId);
    fireClientPixel(
      'PageView',
      {
        outlet: outletSlug,
        campaign: campaignSlug,
      },
      activePixelId,
      `pv_${outletSlug || 'home'}_${campaignSlug || 'main'}`
    );
  }, [activePixelId, outletSlug, campaignSlug]);

  const setPageContext = useCallback(
    (ctx: {
      outletSlug?: string;
      campaignSlug?: string;
      pixelId?: string;
      googleAdsId?: string;
    }) => {
      if (ctx.pixelId !== undefined) {
        setOverridePixelId(ctx.pixelId.trim() ? ctx.pixelId.trim() : undefined);
      }
      if (ctx.googleAdsId !== undefined) {
        setOverrideGoogleAdsId(ctx.googleAdsId.trim() ? ctx.googleAdsId.trim() : undefined);
      }
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
        activePixelId
      );
    },
    [outletSlug, campaignSlug, activePixelId]
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
        activePixelId,
        eventId
      );
    },
    [outletSlug, campaignSlug, activePixelId]
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
        activePixelId,
        eventId
      );
    },
    [outletSlug, campaignSlug, activePixelId]
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
      fireClientPixel('Purchase', payload, activePixelId, orderId);

      // Complementary Sale event in marketing ledger
      fireClientPixel('Sale', payload, activePixelId, `sale_${orderId}`);
    },
    [outletSlug, campaignSlug, activePixelId]
  );

  const contextValue = useMemo(
    () => ({
      pixelId: activePixelId,
      googleAdsId: activeGoogleAdsId,
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
      activeGoogleAdsId,
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
          <Script
            id={`meta-pixel-${activePixelId}`}
            strategy="afterInteractive"
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
                fbq('track', 'PageView');
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
      {activeGoogleAdsId && (
        <>
          <Script
            id={`gtag-src-${activeGoogleAdsId}`}
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${activeGoogleAdsId}`}
          />
          <Script
            id={`gtag-init-${activeGoogleAdsId}`}
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${activeGoogleAdsId}');
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
