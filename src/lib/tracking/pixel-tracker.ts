import { TrackingEventPayload } from '@/types';
import { extractMetaPixelId } from '@/lib/tracking/pixel-utils';

// In-Memory registry for current session
const inMemoryTrackedEvents = new Set<string>();

interface MetaPixelStub {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: unknown;
  loaded: boolean;
  version: string;
}

interface CustomWindow extends Window {
  fbq?: MetaPixelStub;
  _fbq?: MetaPixelStub;
  _initializedPixels?: Set<string>;
}

/**
 * Ensures Meta Pixel stub is initialized on window immediately
 */
export function ensureMetaPixelInitialized(pixelId: string) {
  if (typeof window === 'undefined') return;

  const win = window as unknown as CustomWindow;
  if (!win.fbq) {
    const n = function (...args: unknown[]) {
      if (n.callMethod) {
        n.callMethod(...args);
      } else {
        n.queue.push(args);
      }
    } as MetaPixelStub;
    win.fbq = n;
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

  const cleanId = extractMetaPixelId(pixelId);
  if (cleanId && (!win._initializedPixels || !win._initializedPixels.has(cleanId))) {
    if (!win._initializedPixels) win._initializedPixels = new Set<string>();
    win._initializedPixels.add(cleanId);
    win.fbq('init', cleanId);
    console.log(`[Meta Pixel Initialized] Pixel ID: ${cleanId}`);
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

  const activePixel = extractMetaPixelId(pixelId);

  // Compute unique deduplication key scoped to active pixel
  const uniqueKey = eventId || (data.order_id as string) || (data.orderNumber as string);
  const dedupKey = uniqueKey ? `${eventName}_${uniqueKey}_${activePixel || 'default'}` : '';

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

  if (activePixel) {
    ensureMetaPixelInitialized(activePixel);
  }

  try {
    // Meta Pixel Client Dispatch with eventID for deduplication
    if (typeof win.fbq === 'function' && activePixel) {
      const options = eventId ? { eventID: eventId } : undefined;
      if (options) {
        win.fbq('trackSingle', activePixel, eventName, data, options);
      } else {
        win.fbq('trackSingle', activePixel, eventName, data);
      }
      console.log(`[Meta Pixel Client] ${eventName} (eventID: ${eventId || 'none'})`, { pixelId: activePixel, data });
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
