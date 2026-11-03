import { TrackingEventPayload } from '@/types';

/**
 * Client-Side Meta Pixel & Google Ads Event Dispatcher
 * Passes { eventID } as 4th parameter for 100% Meta Pixel & CAPI deduplication!
 */
export function fireClientPixel(
  eventName: string,
  data: Record<string, unknown> = {},
  pixelId?: string,
  eventId?: string
) {
  if (typeof window === 'undefined') return;

  const win = window as unknown as {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  };

  try {
    // Meta Pixel Client Dispatch with eventID for deduplication
    if (typeof win.fbq === 'function') {
      const options = eventId ? { eventID: eventId } : undefined;
      if (pixelId) {
        if (options) {
          win.fbq('trackSingle', pixelId, eventName, data, options);
        } else {
          win.fbq('trackSingle', pixelId, eventName, data);
        }
      } else {
        if (options) {
          win.fbq('track', eventName, data, options);
        } else {
          win.fbq('track', eventName, data);
        }
      }
      console.log(`[Meta Pixel Client] ${eventName} (eventID: ${eventId || 'none'})`, { pixelId, data });
    }

    // Google Ads / Analytics Dispatch
    if (typeof win.gtag === 'function') {
      win.gtag('event', eventName, { ...data, transaction_id: eventId });
      console.log(`[Google Tag] ${eventName}`, data);
    }
  } catch (err) {
    console.warn('[Pixel Tracker] Tracking error:', err);
  }
}

/**
 * Server-Side Meta Conversions API (CAPI) Shim for backward compatibility
 */
export async function sendMetaCAPI(payload: TrackingEventPayload) {
  if (typeof window !== 'undefined') {
    return { success: true, clientSkipped: true };
  }
  const { sendMetaCAPI: serverSend } = await import('@/lib/tracking/meta-capi');
  return serverSend(payload);
}
