import { TrackingEventPayload } from '@/types';

// In-Memory registry for current session
const inMemoryTrackedEvents = new Set<string>();

/**
 * Ensures Meta Pixel stub is initialized on window immediately
 */
export function ensureMetaPixelInitialized(pixelId: string) {
  if (typeof window === 'undefined') return;

  const win = window as any;
  if (!win.fbq) {
    const n: any = (win.fbq = function (...args: unknown[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
    });
    if (!win._fbq) win._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else if (document.head) {
      document.head.appendChild(script);
    }
  }

  if (pixelId && (!win._initializedPixels || !win._initializedPixels.has(pixelId))) {
    if (!win._initializedPixels) win._initializedPixels = new Set<string>();
    win._initializedPixels.add(pixelId);
    win.fbq('init', pixelId);
    console.log(`[Meta Pixel Initialized] Pixel ID: ${pixelId}`);
  }
}

/**
 * Check if event has already been dispatched in the current session
 */
export function isClientEventTracked(dedupKey: string): boolean {
  if (typeof window === 'undefined') return false;
  if (inMemoryTrackedEvents.has(dedupKey)) return true;

  try {
    const raw = sessionStorage.getItem('pnr_tracked_events');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.includes(dedupKey)) {
        inMemoryTrackedEvents.add(dedupKey);
        return true;
      }
    }
  } catch {}

  return false;
}

/**
 * Mark event as tracked to prevent duplicates
 */
export function markClientEventTracked(dedupKey: string) {
  if (typeof window === 'undefined') return;
  inMemoryTrackedEvents.add(dedupKey);

  try {
    const raw = sessionStorage.getItem('pnr_tracked_events');
    const list = raw ? JSON.parse(raw) : [];
    if (!list.includes(dedupKey)) {
      list.push(dedupKey);
      sessionStorage.setItem('pnr_tracked_events', JSON.stringify(list.slice(-100)));
    }
  } catch {}
}

/**
 * Client-Side Meta Pixel & Google Ads Event Dispatcher
 * Passes { eventID } as 4th parameter for 100% Meta Pixel & CAPI deduplication!
 * Asynchronously persists event into backend ledger via /api/marketing/events.
 */
export function fireClientPixel(
  eventName: string,
  data: Record<string, unknown> = {},
  pixelId?: string,
  eventId?: string
) {
  if (typeof window === 'undefined') return;

  // Compute unique deduplication key
  const uniqueKey = eventId || (data.order_id as string) || (data.orderNumber as string);
  const dedupKey = uniqueKey ? `${eventName}_${uniqueKey}` : '';

  // Prevent duplicate firing if already tracked
  if (dedupKey && isClientEventTracked(dedupKey)) {
    console.log(`[Pixel Tracker Deduplicated] Skipping duplicate client event: ${dedupKey}`);
    return;
  }
  if (dedupKey) {
    markClientEventTracked(dedupKey);
  }

  const win = window as unknown as {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  };

  const activePixel = pixelId || '999888777666555';
  ensureMetaPixelInitialized(activePixel);

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

  // Asynchronously record event to backend marketing ledger
  try {
    const finalEventId = eventId || `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    fetch('/api/marketing/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName,
        eventId: finalEventId,
        orderId: (data.order_id as string) || (data.orderNumber as string) || undefined,
        pixelId,
        outletSlug: data.outlet as string,
        campaignSlug: data.campaign as string,
        value: typeof data.value === 'number' ? data.value : 0,
        currency: (data.currency as string) || 'INR',
        customData: data,
      }),
    }).catch(() => {});
  } catch {}
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
