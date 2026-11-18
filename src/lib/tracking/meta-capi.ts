import crypto from 'crypto';
import { TrackingEventPayload } from '@/types';
import { orderRepository } from '@/lib/db/order-repository';
import { orderStore } from '@/lib/store/order-store';

declare global {
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
  // Authoritatively load front-end configured marketing tags
  const tags = await orderStore.getMarketingTagsAsync();
  const pixelId = payload.pixelId || (tags.globalMetaPixelId as string) || '';
  const accessToken = (tags.metaCapiAccessToken as string) || process.env.META_CAPI_ACCESS_TOKEN;
  const eventId = payload.orderId || payload.eventId || `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  if (!pixelId) {
    console.log('[Meta CAPI] No Meta Pixel ID configured in front-end, skipping server CAPI dispatch');
    return { success: false, error: 'No Pixel ID configured', eventId };
  }

  // Strict Server-Side Deduplication Guard
  const dedupKey = `${payload.eventName}_${eventId}`;
  if (globalThis.__PNR_SENT_CAPI_EVENTS__?.has(dedupKey)) {
    console.log(`[Meta CAPI Deduplicated] Skipping duplicate CAPI event for ${dedupKey}`);
    return { success: true, deduplicated: true, eventId };
  }
  globalThis.__PNR_SENT_CAPI_EVENTS__?.add(dedupKey);

  // SHA-256 Hashing of validated customer PII per Meta CAPI v19.0 specification
  const rawPhone = payload.userData?.phone && /\d{10,}/.test(payload.userData.phone) ? payload.userData.phone : undefined;
  const rawEmail = payload.userData?.email && payload.userData.email.includes('@') ? payload.userData.email : undefined;
  const rawName =
    payload.userData?.name && payload.userData.name.trim().toLowerCase() !== 'valued customer'
      ? payload.userData.name
      : undefined;
  const rawPincode =
    payload.userData?.pincode && /^\d{6}$/.test(payload.userData.pincode.trim())
      ? payload.userData.pincode.trim()
      : undefined;

  const hashedPhone = rawPhone ? hashPhoneForMeta(rawPhone) : undefined;
  const hashedEmail = rawEmail ? hashForMeta(rawEmail) : undefined;

  let hashedFirstName: string | undefined = undefined;
  let hashedLastName: string | undefined = undefined;
  if (rawName) {
    const parts = rawName.trim().split(/\s+/);
    if (parts[0]) hashedFirstName = hashForMeta(parts[0]);
    if (parts.length > 1) hashedLastName = hashForMeta(parts[parts.length - 1]);
  }

  const hashedCity = hashForMeta(payload.userData?.city || 'nashik');
  const hashedState = hashForMeta(payload.userData?.state || 'mh');
  const hashedCountry = hashForMeta('in');
  const hashedZip = rawPincode ? hashForMeta(rawPincode) : undefined;

  // Stable external_id (hashed normalized phone or email) boosts cross-device attribution
  const externalIdSeed = payload.userData?.externalId || rawPhone || rawEmail;
  const hashedExternalId = externalIdSeed
    ? rawPhone && externalIdSeed === rawPhone
      ? hashPhoneForMeta(rawPhone)
      : hashForMeta(externalIdSeed)
    : undefined;

  const userDataPayload: Record<string, unknown> = {
    ct: [hashedCity],
    st: [hashedState],
    country: [hashedCountry],
  };

  // High-priority Meta Attribution & Event Match Quality (EMQ) browser signals (MUST NOT be hashed)
  if (payload.userData?.fbc) userDataPayload.fbc = payload.userData.fbc;
  if (payload.userData?.fbp) userDataPayload.fbp = payload.userData.fbp;
  if (payload.userData?.clientIp) userDataPayload.client_ip_address = payload.userData.clientIp;
  if (payload.userData?.clientUserAgent) userDataPayload.client_user_agent = payload.userData.clientUserAgent;

  // Hashed PII signals
  if (hashedPhone) userDataPayload.ph = [hashedPhone];
  if (hashedEmail) userDataPayload.em = [hashedEmail];
  if (hashedFirstName) userDataPayload.fn = [hashedFirstName];
  if (hashedLastName) userDataPayload.ln = [hashedLastName];
  if (hashedZip) userDataPayload.zp = [hashedZip];
  if (hashedExternalId) userDataPayload.external_id = [hashedExternalId];

  const cleanValue = Number.isFinite(Number(payload.value)) ? Number(Number(payload.value).toFixed(2)) : 0;
  const computedNumItems =
    payload.numItems ??
    (Array.isArray(payload.contents)
      ? payload.contents.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
      : undefined);

  const customDataPayload: Record<string, unknown> = {
    currency: payload.currency || 'INR',
    value: cleanValue,
    order_id: payload.orderId,
    content_name: payload.contentName,
    content_ids: payload.contentIds,
    contents: payload.contents,
    content_type: 'product',
    ...(computedNumItems !== undefined ? { num_items: computedNumItems } : {}),
    outlet_slug: payload.outletSlug,
    campaign_slug: payload.campaignSlug,
  };

  const baseAppUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://shop.puffsnrolls.com').replace(/\/$/, '');
  const eventSourceUrl =
    payload.eventSourceUrl ||
    (payload.outletSlug ? `${baseAppUrl}/${payload.outletSlug}` : baseAppUrl);

  const currentTimestamp = Math.floor(Date.now() / 1000);

  const eventData = {
    data: [
      {
        event_name: payload.eventName,
        event_time: currentTimestamp,
        event_id: eventId,
        event_source_url: eventSourceUrl,
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
    value: cleanValue,
    currency: payload.currency || 'INR',
    userHash: {
      phoneHashed: Boolean(hashedPhone),
      emailHashed: Boolean(hashedEmail),
      hasFbc: Boolean(payload.userData?.fbc),
      hasFbp: Boolean(payload.userData?.fbp),
      hasClientIp: Boolean(payload.userData?.clientIp),
    },
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
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Meta CAPI Dispatch Error]:', errorMsg);
    try {
      const fullRecord = {
        ...eventRecord,
        capiStatus: 'FAILED',
        capiResponse: { error: errorMsg },
      };
      orderStore.recordMarketingEvent(fullRecord);
      await orderRepository.recordMarketingEvent(fullRecord);
    } catch {}
    return { success: false, error: errorMsg, eventId };
  }
}
