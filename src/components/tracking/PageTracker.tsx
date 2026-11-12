'use client';

import { useEffect, useRef } from 'react';
import { useTracking } from './TrackingProvider';

export function PageTracker({
  outletSlug,
  campaignSlug,
  pixelId,
  googleAdsId,
}: {
  outletSlug?: string;
  campaignSlug?: string;
  pixelId?: string;
  googleAdsId?: string;
}) {
  const { setPageContext } = useTracking();
  const prevKeyRef = useRef<string>('');

  useEffect(() => {
    const key = `${outletSlug || ''}_${campaignSlug || ''}_${pixelId || ''}_${googleAdsId || ''}`;
    if (prevKeyRef.current !== key) {
      prevKeyRef.current = key;
      setPageContext({ outletSlug, campaignSlug, pixelId, googleAdsId });
    }
  }, [outletSlug, campaignSlug, pixelId, googleAdsId, setPageContext]);

  return null;
}
