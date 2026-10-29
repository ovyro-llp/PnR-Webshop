import { TrackingEventPayload } from '@/types';

/**
 * Client-Side Meta Pixel & Google Ads Event Dispatcher
 */
export function fireClientPixel(
  eventName: string,
  data: Record<string, unknown> = {},
  pixelId?: string
) {
  if (typeof window === 'undefined') return;

  // Window with fbq / gtag extensions
  const win = window as unknown as {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  };

  try {
    // Meta Pixel Client Dispatch
    if (typeof win.fbq === 'function') {
      if (pixelId) {
        win.fbq('trackSingle', pixelId, eventName, data);
      } else {
        win.fbq('track', eventName, data);
      }
      console.log(`[Meta Pixel] Event: ${eventName}`, { pixelId, data });
    }

    // Google Ads / Analytics Dispatch
    if (typeof win.gtag === 'function') {
      win.gtag('event', eventName, data);
      console.log(`[Google Tag] Event: ${eventName}`, data);
    }
  } catch (err) {
    console.warn('[Pixel Tracker] Tracking error:', err);
  }
}

/**
 * Server-Side Meta Conversions API (CAPI) Sender
 * Sends events directly to Meta Graph API, bypassing browser ad-blockers and iOS restrictions.
 */
export async function sendMetaCAPI(payload: TrackingEventPayload) {
  const pixelId = payload.pixelId || process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.log('[Meta CAPI] Skipped: No Pixel ID or CAPI Access Token configured (Simulated)');
    return { success: true, simulated: true };
  }

  const endpoint = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;

  const currentTimestamp = Math.floor(Date.now() / 1000);

  const eventData = {
    data: [
      {
        event_name: payload.eventName,
        event_time: currentTimestamp,
        event_id: payload.orderId || `evt-${Date.now()}`,
        action_source: 'website',
        user_data: {
          client_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'P&R Server',
          // Meta requires SHA256 hashed phone/email for real CAPI match
          ph: payload.userData?.phone ? [payload.userData.phone] : undefined,
          em: payload.userData?.email ? [payload.userData.email] : undefined,
        },
        custom_data: {
          currency: payload.currency || 'INR',
          value: payload.value || 0,
          content_name: payload.contentName,
          content_ids: payload.contentIds,
          outlet_slug: payload.outletSlug,
          campaign_slug: payload.campaignSlug,
        },
      },
    ],
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });

    const resJson = await res.json();
    return { success: res.ok, data: resJson };
  } catch (error) {
    console.error('[Meta CAPI] Error dispatching event:', error);
    return { success: false, error };
  }
}
