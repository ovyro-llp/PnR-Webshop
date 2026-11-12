import crypto from 'crypto';
import { TrackingEventPayload } from '@/types';
import { orderRepository } from '@/lib/db/order-repository';
import { orderStore } from '@/lib/store/order-store';

declare global {
  // eslint-disable-next-line no-var
  var __PNR_SENT_CAPI_EVENTS__: Set<string> | undefined;
}

if (!globalThis.__PNR_SENT_CAPI_EVENTS__) {
  globalThis.__PNR_SENT_CAPI_EVENTS__ = new Set<string>();
}

/**
 * Normalizes and computes SHA-256 hash for Meta CAPI parameters
 */
export function hashForMeta(value: string): string {
  if (!value || typeof value !== 'string') return '';
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

/**
 * Normalizes Indian mobile number to E.164 (without +) and SHA-256 hashes
 * Example: "98220 11234" -> "919822011234" -> hash
 */
export function hashPhoneForMeta(rawPhone: string): string | undefined {
  if (!rawPhone) return undefined;
  const digits = rawPhone.replace(/\D/g, '');
  let normalized = digits;
  if (digits.length === 10) {
    normalized = `91${digits}`;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    normalized = `91${digits.slice(1)}`;
  } else if (digits.length === 12 && digits.startsWith('91')) {
    normalized = digits;
  }
  return hashForMeta(normalized);
}

/**
 * Server-Side Meta Conversions API (CAPI) Sender
 * Strictly normalizes and hashes user PII per Meta v19.0 specification.
 * Enforces server-side deduplication using event_name and orderId/eventId.
 */
export async function sendMetaCAPI(payload: TrackingEventPayload) {
  const pixelId = payload.pixelId || process.env.META_PIXEL_ID || '999888777666555';
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  const eventId = payload.orderId || payload.eventId || `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Strict Server-Side Deduplication Guard
  const dedupKey = `${payload.eventName}_${eventId}`;
  if (globalThis.__PNR_SENT_CAPI_EVENTS__?.has(dedupKey)) {
    console.log(`[Meta CAPI Deduplicated] Skipping duplicate CAPI event for ${dedupKey}`);
    return { success: true, deduplicated: true, eventId };
  }
  globalThis.__PNR_SENT_CAPI_EVENTS__?.add(dedupKey);

  // SHA-256 Hashing of user data
  const hashedPhone = payload.userData?.phone ? hashPhoneForMeta(payload.userData.phone) : undefined;
  const hashedEmail = payload.userData?.email ? hashForMeta(payload.userData.email) : undefined;

  let hashedFirstName: string | undefined = undefined;
  let hashedLastName: string | undefined = undefined;
  if (payload.userData?.name) {
    const parts = payload.userData.name.trim().split(/\s+/);
    if (parts[0]) hashedFirstName = hashForMeta(parts[0]);
    if (parts.length > 1) hashedLastName = hashForMeta(parts[parts.length - 1]);
  }

  const hashedCity = hashForMeta('nashik');
  const hashedCountry = hashForMeta('in');

  const userDataPayload: Record<string, unknown> = {
    client_user_agent: 'P&R Enterprise Backend / Next.js',
    ct: [hashedCity],
    country: [hashedCountry],
  };

  if (hashedPhone) userDataPayload.ph = [hashedPhone];
  if (hashedEmail) userDataPayload.em = [hashedEmail];
  if (hashedFirstName) userDataPayload.fn = [hashedFirstName];
  if (hashedLastName) userDataPayload.ln = [hashedLastName];

  const customDataPayload: Record<string, unknown> = {
    currency: payload.currency || 'INR',
    value: payload.value || 0,
    content_name: payload.contentName,
    content_ids: payload.contentIds,
    contents: payload.contents,
    content_type: 'product',
    outlet_slug: payload.outletSlug,
    campaign_slug: payload.campaignSlug,
  };

  const currentTimestamp = Math.floor(Date.now() / 1000);

  const eventData = {
    data: [
      {
        event_name: payload.eventName,
        event_time: currentTimestamp,
        event_id: eventId,
        action_source: 'website',
        user_data: userDataPayload,
        custom_data: customDataPayload,
      },
    ],
  };

  const eventRecord = {
    orderId: payload.orderId,
    eventName: payload.eventName,
    eventId,
    pixelId,
    outletSlug: payload.outletSlug,
    campaignSlug: payload.campaignSlug,
    value: payload.value,
    currency: payload.currency || 'INR',
    userHash: { phoneHashed: Boolean(hashedPhone), emailHashed: Boolean(hashedEmail) },
  };

  // If no live access token, simulate gracefully and audit log to DB and memory store
  if (!accessToken || accessToken === 'mock_token' || accessToken === 'test_capi_token') {
    console.log(`[Meta CAPI Simulated] ${payload.eventName} for Order ${eventId} (Pixel: ${pixelId})`, {
      event_id: eventId,
      hashedPhone: hashedPhone ? 'sha256_hashed' : 'none',
      value: payload.value,
    });

    try {
      const fullRecord = {
        ...eventRecord,
        capiStatus: 'SIMULATED',
        capiResponse: { status: 'simulated_success', timestamp: currentTimestamp },
      };
      orderStore.recordMarketingEvent(fullRecord);
      await orderRepository.recordMarketingEvent(fullRecord);
    } catch {}

    return { success: true, simulated: true, eventId };
  }

  const endpoint = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });

    const resJson = await res.json().catch(() => ({}));

    try {
      const fullRecord = {
        ...eventRecord,
        capiStatus: res.ok ? 'SENT' : 'FAILED',
        capiResponse: resJson,
      };
      orderStore.recordMarketingEvent(fullRecord);
      await orderRepository.recordMarketingEvent(fullRecord);
    } catch {}

    return { success: res.ok, data: resJson, eventId };
  } catch (error: any) {
    console.error('[Meta CAPI Dispatch Error]:', error.message);
    try {
      const fullRecord = {
        ...eventRecord,
        capiStatus: 'FAILED',
        capiResponse: { error: error.message },
      };
      orderStore.recordMarketingEvent(fullRecord);
      await orderRepository.recordMarketingEvent(fullRecord);
    } catch {}
    return { success: false, error: error.message, eventId };
  }
}
