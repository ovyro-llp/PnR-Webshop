import { TrackingEventPayload, MetaAttributionContext } from '@/types';
import { extractMetaPixelId } from '@/lib/tracking/pixel-utils';
import { getOrCreateVisitorId, getOrCreateSessionId } from '@/lib/tracking/visitor-session';

// In-Memory registry for current session
const inMemoryTrackedEvents = new Set<string>();

// Official Meta Standard Events (must use trackSingle; everything else uses trackSingleCustom)
const META_STANDARD_EVENTS = new Set([
  'PageView',
  'ViewContent',
  'Search',
  'AddToCart',
  'AddToWishlist',
  'InitiateCheckout',
  'AddPaymentInfo',
  'Purchase',
  'Lead',
  'CompleteRegistration',
  'Contact',
  'CustomizeProduct',
  'Donate',
  'FindLocation',
  'Schedule',
  'StartTrial',
  'SubmitApplication',
  'Subscribe',
]);

// Map Meta standard event names to GA4 / Google Ads standard ecommerce event names
const GTAG_EVENT_MAP: Record<string, string> = {
  Purchase: 'purchase',
  AddToCart: 'add_to_cart',
  InitiateCheckout: 'begin_checkout',
  ViewContent: 'view_item',
  PageView: 'page_view',
};

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function writeCookie(name: string, value: string, days = 90) {
  if (typeof document === 'undefined') return;
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch {}
}

/**
 * Captures Meta Click ID (`fbclid`) on ad landing and persists official `_fbc` format
 * (`fb.1.<timestamp_ms>.<fbclid>`) in cookie + localStorage so attribution survives
 * navigation, iOS ITP, and Razorpay redirects.
 */
export function captureMetaAttributionParams(): void {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get('fbclid')?.trim();
    if (fbclid) {
      const existingFbc = readCookie('_fbc');
      const existingClickId = existingFbc ? existingFbc.split('.').slice(3).join('.') : '';
      if (!existingFbc || existingClickId !== fbclid) {
        const fbc = `fb.1.${Date.now()}.${fbclid}`;
        writeCookie('_fbc', fbc, 90);
        try {
          localStorage.setItem('pnr_meta_fbc', fbc);
        } catch {}
      }
    }

    // Mirror _fbp into localStorage if already set by Meta Pixel
    const fbp = readCookie('_fbp');
    if (fbp) {
      try {
        localStorage.setItem('pnr_meta_fbp', fbp);
      } catch {}
    }
  } catch {}
}

/**
 * Reads current browser Meta attribution context (`_fbc`, `_fbp`, `eventSourceUrl`)
 * to forward to server-side Meta Conversions API (CAPI) for 9+/10 Event Match Quality.
 */
export function getMetaTrackingContext(): MetaAttributionContext {
  if (typeof window === 'undefined') return {};
  captureMetaAttributionParams();

  let fbc = readCookie('_fbc');
  let fbp = readCookie('_fbp');

  try {
    if (!fbc) fbc = localStorage.getItem('pnr_meta_fbc') || undefined;
    if (!fbp) fbp = localStorage.getItem('pnr_meta_fbp') || undefined;
  } catch {}

  return {
    fbc: fbc || undefined,
    fbp: fbp || undefined,
    eventSourceUrl: window.location.href,
  };
}

/**
 * Sends Meta Pixel Manual Advanced Matching parameters (automatically SHA-256 hashed
 * by Meta's fbevents.js before transmission) to boost browser-side attribution.
 */
export function updateMetaPixelAdvancedMatching(
  pixelId: string | undefined,
  user: { phone?: string; email?: string; name?: string; pincode?: string }
) {
  if (typeof window === 'undefined' || !pixelId) return;
  const cleanId = extractMetaPixelId(pixelId);
  if (!cleanId) return;

  const win = window as unknown as CustomWindow;
  if (typeof win.fbq !== 'function') return;

  const matchData: Record<string, string> = {
    ct: 'nashik',
    st: 'mh',
    country: 'in',
  };

  if (user.phone) {
    const digits = user.phone.replace(/\D/g, '');
    if (digits.length === 10) {
      matchData.ph = `91${digits}`;
      matchData.external_id = `91${digits}`;
    } else if (digits.length === 12 && digits.startsWith('91')) {
      matchData.ph = digits;
      matchData.external_id = digits;
    }
  }
  if (user.email && user.email.includes('@')) {
    matchData.em = user.email.trim().toLowerCase();
  }
  if (user.name && user.name !== 'Valued Customer') {
    const parts = user.name.trim().toLowerCase().split(/\s+/);
    if (parts[0]) matchData.fn = parts[0];
    if (parts.length > 1) matchData.ln = parts[parts.length - 1];
  }
  if (user.pincode && /^\d{6}$/.test(user.pincode.trim())) {
    matchData.zp = user.pincode.trim();
  }

  try {
    win.fbq('init', cleanId, matchData);
  } catch {}
}

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

  // Normalize numeric ROAS value to clean 2-decimal number (prevents string/NaN issues in Meta Ads Manager)
  const cleanData: Record<string, unknown> = { ...data };
  if (cleanData.value !== undefined && cleanData.value !== null) {
    const parsedVal = Number(cleanData.value);
    if (Number.isFinite(parsedVal)) {
      cleanData.value = Number(parsedVal.toFixed(2));
    }
  }

  try {
    // Meta Pixel Client Dispatch with eventID for 100% Pixel + CAPI deduplication
    if (typeof win.fbq === 'function' && activePixel) {
      const trackMethod = META_STANDARD_EVENTS.has(eventName) ? 'trackSingle' : 'trackSingleCustom';
      const options = eventId ? { eventID: eventId } : undefined;
      if (options) {
        win.fbq(trackMethod, activePixel, eventName, cleanData, options);
      } else {
        win.fbq(trackMethod, activePixel, eventName, cleanData);
      }
      console.log(`[Meta Pixel Client] ${trackMethod}:${eventName} (eventID: ${eventId || 'none'})`, {
        pixelId: activePixel,
        data: cleanData,
      });
    }

    // Google Ads / GA4 Dispatch (uses standard lowercase GA4 ecommerce event names)
    if (typeof win.gtag === 'function') {
      const gtagEventName = GTAG_EVENT_MAP[eventName] || eventName;
      win.gtag('event', gtagEventName, { ...cleanData, transaction_id: eventId });
      console.log(`[Google Tag] ${gtagEventName}`, cleanData);
    }
  } catch (err) {
    console.warn('[Pixel Tracker] Tracking error:', err);
  }

  // Asynchronously record event to backend marketing ledger
  try {
    const finalEventId = eventId || `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const visitorId = getOrCreateVisitorId();
    const sessionId = getOrCreateSessionId();
    const rawCustomerName = (cleanData.customerName || cleanData.name) as string | undefined;
    const rawCustomerPhone = (cleanData.customerPhone || cleanData.phone) as string | undefined;

    fetch('/api/marketing/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName,
        eventId: finalEventId,
        orderId: (cleanData.order_id as string) || (cleanData.orderNumber as string) || undefined,
        pixelId,
        outletSlug: cleanData.outlet as string,
        campaignSlug: cleanData.campaign as string,
        value: typeof cleanData.value === 'number' ? cleanData.value : 0,
        currency: (cleanData.currency as string) || 'INR',
        visitorId,
        sessionId,
        customerName: rawCustomerName,
        customerPhone: rawCustomerPhone,
        metadata: cleanData,
        customData: cleanData,
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
