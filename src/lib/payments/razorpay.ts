import Razorpay from 'razorpay';
import crypto from 'crypto';
import { orderStore } from '@/lib/store/order-store';
import { PaymentGatewayConfig } from '@/types';

export interface CreateOrderParams {
  amount: number; // in INR
  receipt?: string;
  notes?: Record<string, string>;
  outletSlug?: string;
}

export function buildRazorpayClient(config: PaymentGatewayConfig) {
  // 1. Resolve live keys across all environment variable variations and database/storage config
  const liveKey = (
    process.env.RAZORPAY_LIVE_KEY_ID ||
    process.env.RAZORPAY_LIVE_KEY ||
    (process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? process.env.RAZORPAY_KEY_ID : '') ||
    (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID : '') ||
    (process.env.NEXT_PUBLIC_RAZORPAY_LIVE_KEY_ID?.startsWith('rzp_live_') ? process.env.NEXT_PUBLIC_RAZORPAY_LIVE_KEY_ID : '') ||
    (process.env.RAZORPAY_API_KEY?.startsWith('rzp_live_') ? process.env.RAZORPAY_API_KEY : '') ||
    (process.env.RZP_LIVE_KEY_ID?.startsWith('rzp_live_') ? process.env.RZP_LIVE_KEY_ID : '') ||
    (process.env.RZP_LIVE_KEY?.startsWith('rzp_live_') ? process.env.RZP_LIVE_KEY : '') ||
    (process.env.RZP_KEY_ID?.startsWith('rzp_live_') ? process.env.RZP_KEY_ID : '') ||
    config.liveKeyId ||
    (config.razorpayKeyId?.startsWith('rzp_live_') ? config.razorpayKeyId : '') ||
    ''
  ).trim();

  const envSecretFound = (
    process.env.RAZORPAY_LIVE_KEY_SECRET ||
    process.env.RAZORPAY_LIVE_SECRET ||
    process.env.RZP_LIVE_KEY_SECRET ||
    process.env.RZP_LIVE_SECRET ||
    (liveKey.startsWith('rzp_live_') ? (
      process.env.RAZORPAY_KEY_SECRET ||
      process.env.RAZORPAY_SECRET ||
      process.env.RAZORPAY_SECRET_KEY ||
      process.env.RAZORPAY_API_SECRET ||
      process.env.RZP_KEY_SECRET ||
      process.env.RZP_SECRET ||
      ''
    ) : '')
  ).trim();

  const liveSecret = (
    envSecretFound ||
    config.liveKeySecret ||
    (config.razorpayKeySecret && (config.liveKeyId?.startsWith('rzp_live_') || config.razorpayKeyId?.startsWith('rzp_live_') || liveKey.startsWith('rzp_live_'))
      ? config.razorpayKeySecret
      : '') ||
    (liveKey.startsWith('rzp_live_') && config.razorpayKeySecret ? config.razorpayKeySecret : '') ||
    ''
  ).trim();

  const hasValidLiveCreds = Boolean(liveKey.startsWith('rzp_live_') && liveSecret);

  // 2. Resolve test keys with fallbacks
  const testKey = (
    config.testKeyId ||
    process.env.RAZORPAY_TEST_KEY_ID ||
    (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID : '') ||
    (!process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? process.env.RAZORPAY_KEY_ID : '') ||
    'rzp_test_Tu3J2xHanphLOy'
  ).trim();

  const testSecret = (
    config.testKeySecret ||
    process.env.RAZORPAY_TEST_KEY_SECRET ||
    (!process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? process.env.RAZORPAY_KEY_SECRET : '') ||
    'wQKVEbjQupqQMEZeqjA2eeju'
  ).trim();

  // Determine mode: testMode === true ONLY if explicitly configured by Admin in Admin Control!
  const isExplicitTestMode = config.testMode === true;
  const isLive = !isExplicitTestMode;

  // In Live mode, strictly use live credentials. NEVER fall back to test credentials!
  const activeKeyId = isLive ? (liveKey || '') : testKey;
  const activeKeySecret = isLive ? (liveSecret || '') : testSecret;

  if (isLive) {
    if (hasValidLiveCreds) {
      console.log(`[Razorpay Gateway] Active Mode: LIVE PRODUCTION (Key: ${activeKeyId.slice(0, 12)}...)`);
    } else {
      console.warn(`[Razorpay Gateway] Active Mode: LIVE PRODUCTION (Pending Live Credentials)`);
    }
  } else {
    console.log(`[Razorpay Gateway] Active Mode: SANDBOX TEST (Key: ${activeKeyId})`);
  }

  const isDemoMode =
    isExplicitTestMode &&
    (activeKeyId === 'rzp_test_pnr_demo' ||
      activeKeySecret === 'rzp_sec_demo_secret_key' ||
      !activeKeyId ||
      !activeKeySecret);

  let instance: Razorpay | null = null;
  if (!isDemoMode && activeKeyId && activeKeySecret) {
    try {
      instance = new Razorpay({
        key_id: activeKeyId,
        key_secret: activeKeySecret,
      });
    } catch (err) {
      console.warn('Failed to initialize Razorpay SDK instance:', err);
    }
  }

  return {
    instance,
    keyId: activeKeyId,
    keySecret: activeKeySecret,
    isDemoMode,
    testMode: config.testMode,
    isLive,
    hasValidLiveCreds,
  };
}

export function getRazorpayClient() {
  const config = orderStore.getPaymentConfig();
  return buildRazorpayClient(config);
}

export async function getRazorpayClientAsync() {
  const config = await orderStore.getPaymentConfigAsync();
  return buildRazorpayClient(config);
}

/**
 * Creates an order on Razorpay.
 * Amount is converted to paise (INR 1 = 100 paise).
 * Seamlessly loads persisted database credentials across deployments.
 */
export async function createRazorpayOrder({
  amount,
  receipt,
  notes = {},
  outletSlug,
}: CreateOrderParams) {
  const { instance, keyId, isDemoMode, testMode, hasValidLiveCreds } =
    await getRazorpayClientAsync();
  const paise = Math.round(amount * 100);
  const orderReceipt = receipt || `rcpt_${outletSlug || 'pnr'}_${Date.now()}`;

  // STRICT PRODUCTION INTEGRITY:
  // If in Live Production Mode, NEVER fall back to test credentials or demo mock orders!
  if (testMode !== true) {
    if (!hasValidLiveCreds || !instance || !keyId || !keyId.startsWith('rzp_live_')) {
      throw new Error(
        'Razorpay is set to Live Production Mode, but live credentials (rzp_live_...) are not configured or incomplete. The system will not fall back to test credentials. Please configure live credentials in Admin Control (or explicitly enable Sandbox Test Mode in Admin Control).'
      );
    }
  }

  // If in demo mode (ONLY allowed when explicitly in test mode), generate a development mock order
  if (isDemoMode || !instance) {
    return {
      id: `order_pnr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      amount: paise,
      currency: 'INR',
      receipt: orderReceipt,
      status: 'created',
      keyId,
      mock: true,
    };
  }

  try {
    const order = await instance.orders.create({
      amount: paise,
      currency: 'INR',
      receipt: orderReceipt,
      notes: {
        outletSlug: outletSlug || 'all',
        ...notes,
      },
    });

    return {
      id: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      receipt: order.receipt || orderReceipt,
      status: order.status,
      keyId,
      mock: false,
    };
  } catch (error) {
    console.error('Razorpay API orders.create failed:', error);
    if (!isDemoMode) {
      throw error;
    }
    // Graceful fallback only if explicitly in local demo mode
    return {
      id: `order_pnr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      amount: paise,
      currency: 'INR',
      receipt: orderReceipt,
      status: 'created',
      keyId,
      mock: true,
    };
  }
}

/**
 * Verifies Razorpay payment signature via HMAC SHA256.
 * Hydrates database-persisted keys asynchronously to ensure signatures are verified against real live keys.
 */
export async function verifyRazorpaySignature({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<boolean> {
  const client = await getRazorpayClientAsync();

  // STRICT PRODUCTION INTEGRITY:
  // In Live mode, mock signatures and demo signatures are strictly forbidden!
  if (client.testMode !== true) {
    if (
      razorpay_order_id.startsWith('order_pnr_') ||
      razorpay_signature === 'mock_signature' ||
      razorpay_signature.startsWith('demo_sig_')
    ) {
      console.error('[Razorpay Security Alert] Mock signature rejected in Live Production Mode.');
      return false;
    }
  } else {
    // Sandbox test mode allowance only
    if (
      razorpay_order_id.startsWith('order_pnr_') ||
      razorpay_signature === 'mock_signature' ||
      razorpay_signature.startsWith('demo_sig_')
    ) {
      return true;
    }
  }

  const { keySecret } = client;
  if (!keySecret) return false;

  try {
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body.toString())
      .digest('hex');

    return (
      expectedSignature === razorpay_signature ||
      (expectedSignature.length === razorpay_signature.length &&
        crypto.timingSafeEqual(Buffer.from(expectedSignature, 'utf8'), Buffer.from(razorpay_signature, 'utf8')))
    );
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

/**
 * Verifies webhook signature sent by Razorpay in header 'x-razorpay-signature'
 */
export async function verifyWebhookSignature({
  rawBody,
  signature,
}: {
  rawBody: string;
  signature: string;
}): Promise<boolean> {
  const config = await orderStore.getPaymentConfigAsync();
  const secret =
    config.razorpayWebhookSecret ||
    (config.testMode ? config.testWebhookSecret : config.liveWebhookSecret) ||
    process.env.RAZORPAY_WEBHOOK_SECRET ||
    'rzp_whsec_demo';

  // In Live mode, never accept mock webhook signatures
  if (config.testMode !== true) {
    if (signature === 'mock_webhook_signature') {
      console.error('[Razorpay Security Alert] Mock webhook signature rejected in Live Production Mode.');
      return false;
    }
  } else {
    if (secret === 'rzp_whsec_demo' && signature === 'mock_webhook_signature') {
      return true;
    }
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    return expectedSignature === signature;
  } catch (err) {
    console.error('Webhook signature verification error:', err);
    return false;
  }
}
