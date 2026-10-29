'use client';

import React, { createContext, useContext, useEffect } from 'react';
import Script from 'next/script';
import { fireClientPixel } from '@/lib/tracking/pixel-tracker';

interface TrackingContextType {
  pixelId?: string;
  googleAdsId?: string;
  outletSlug?: string;
  campaignSlug?: string;
  trackCustomEvent: (eventName: string, data?: Record<string, unknown>) => void;
  trackAddToCart: (item: { id: string; name: string; price: number; quantity: number }) => void;
  trackInitiateCheckout: (value: number, itemCount: number) => void;
  trackPurchase: (orderId: string, value: number, items: unknown[]) => void;
}

const TrackingContext = createContext<TrackingContextType>({
  trackCustomEvent: () => {},
  trackAddToCart: () => {},
  trackInitiateCheckout: () => {},
  trackPurchase: () => {},
});

export const useTracking = () => useContext(TrackingContext);

interface TrackingProviderProps {
  children: React.ReactNode;
  pixelId?: string;
  googleAdsId?: string;
  outletSlug?: string;
  campaignSlug?: string;
}

export function TrackingProvider({
  children,
  pixelId,
  googleAdsId,
  outletSlug,
  campaignSlug,
}: TrackingProviderProps) {
  useEffect(() => {
    if (pixelId) {
      fireClientPixel('PageView', {
        outlet: outletSlug,
        campaign: campaignSlug,
      }, pixelId);
    }
  }, [pixelId, outletSlug, campaignSlug]);

  const trackCustomEvent = (eventName: string, data: Record<string, unknown> = {}) => {
    fireClientPixel(eventName, {
      outlet: outletSlug,
      campaign: campaignSlug,
      ...data,
    }, pixelId);
  };

  const trackAddToCart = (item: { id: string; name: string; price: number; quantity: number }) => {
    fireClientPixel('AddToCart', {
      content_name: item.name,
      content_ids: [item.id],
      content_type: 'product',
      value: item.price * item.quantity,
      currency: 'INR',
      outlet: outletSlug,
      campaign: campaignSlug,
    }, pixelId);
  };

  const trackInitiateCheckout = (value: number, itemCount: number) => {
    fireClientPixel('InitiateCheckout', {
      value,
      currency: 'INR',
      num_items: itemCount,
      outlet: outletSlug,
      campaign: campaignSlug,
    }, pixelId);
  };

  const trackPurchase = (orderId: string, value: number, items: unknown[]) => {
    fireClientPixel('Purchase', {
      order_id: orderId,
      value,
      currency: 'INR',
      items,
      outlet: outletSlug,
      campaign: campaignSlug,
    }, pixelId);
  };

  return (
    <TrackingContext.Provider
      value={{
        pixelId,
        googleAdsId,
        outletSlug,
        campaignSlug,
        trackCustomEvent,
        trackAddToCart,
        trackInitiateCheckout,
        trackPurchase,
      }}
    >
      {/* Dynamic Meta Pixel Script */}
      {pixelId && (
        <>
          <Script
            id={`meta-pixel-${pixelId}`}
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
                fbq('init', '${pixelId}');
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
              src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
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
