'use client';

/**
 * First-party visitor & session tracking utilities
 * Manages persistent visitor ID (1-year cookie + localStorage)
 * and session ID (sessionStorage with 30-min rolling activity window).
 */

const VISITOR_ID_KEY = 'pnr_vid';
const SESSION_ID_KEY = 'pnr_sid';
const SESSION_TIMESTAMP_KEY = 'pnr_sid_time';
const UTM_STORAGE_KEY = 'pnr_utm_params';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity

function generateId(prefix: string): string {
  const rand = Math.random().toString(36).substring(2, 9);
  const time = Date.now().toString(36);
  return `${prefix}_${time}_${rand}`;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Get or create a persistent Visitor ID (stored across 1 year in cookie and localStorage)
 */
export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'server_visitor';

  try {
    let vid = localStorage.getItem(VISITOR_ID_KEY) || getCookie(VISITOR_ID_KEY);
    if (!vid || vid.length < 10) {
      vid = generateId('vid');
      localStorage.setItem(VISITOR_ID_KEY, vid);
      setCookie(VISITOR_ID_KEY, vid);
    } else {
      // Keep cookie refreshed
      setCookie(VISITOR_ID_KEY, vid);
    }
    return vid;
  } catch {
    return 'fallback_visitor';
  }
}

/**
 * Get or create an ephemeral Session ID (stored in sessionStorage with 30min inactivity check)
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server_session';

  try {
    const now = Date.now();
    const lastTime = Number(sessionStorage.getItem(SESSION_TIMESTAMP_KEY) || 0);
    let sid = sessionStorage.getItem(SESSION_ID_KEY);

    // If session expired or doesn't exist, generate a new one
    if (!sid || !lastTime || now - lastTime > SESSION_TIMEOUT_MS) {
      sid = generateId('sid');
      sessionStorage.setItem(SESSION_ID_KEY, sid);
    }

    sessionStorage.setItem(SESSION_TIMESTAMP_KEY, String(now));
    return sid;
  } catch {
    return 'fallback_session';
  }
}

export interface UtmAttribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referrer?: string;
}

/**
 * Captures UTM parameters from current URL and preserves them for the session
 */
export function captureUtmAttribution(): UtmAttribution {
  if (typeof window === 'undefined') return {};

  try {
    const searchParams = new URLSearchParams(window.location.search);
    const utmSource = searchParams.get('utm_source') || undefined;
    const utmMedium = searchParams.get('utm_medium') || undefined;
    const utmCampaign = searchParams.get('utm_campaign') || undefined;
    const utmTerm = searchParams.get('utm_term') || undefined;
    const utmContent = searchParams.get('utm_content') || undefined;

    let existing: UtmAttribution = {};
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (raw) {
      try {
        existing = JSON.parse(raw);
      } catch {}
    }

    // Determine referrer if external
    let referrer = document.referrer || undefined;
    if (referrer && referrer.includes(window.location.hostname)) {
      referrer = existing.referrer || undefined;
    }

    const current: UtmAttribution = {
      utmSource: utmSource || existing.utmSource || (referrer ? getReferrerChannel(referrer) : 'direct'),
      utmMedium: utmMedium || existing.utmMedium || (utmSource ? 'cpc' : 'organic'),
      utmCampaign: utmCampaign || existing.utmCampaign,
      utmTerm: utmTerm || existing.utmTerm,
      utmContent: utmContent || existing.utmContent,
      referrer: referrer || existing.referrer,
    };

    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(current));
    return current;
  } catch {
    return {};
  }
}

function getReferrerChannel(referrer: string): string {
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes('instagram.com') || host.includes('facebook.com') || host.includes('fb.com')) {
      return 'meta';
    }
    if (host.includes('google.')) return 'google';
    if (host.includes('whatsapp') || host.includes('wa.me')) return 'whatsapp';
    if (host.includes('t.co') || host.includes('twitter.com') || host.includes('x.com')) return 'twitter';
    if (host.includes('youtube.com')) return 'youtube';
    return host;
  } catch {
    return 'referral';
  }
}
