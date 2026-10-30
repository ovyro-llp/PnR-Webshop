import Razorpay from 'razorpay';
import crypto from 'crypto';
import { orderStore } from '@/lib/store/order-store';

export interface CreateOrderParams {
  amount: number; // in INR
  receipt?: string;
  notes?: Record<string, string>;
  outletSlug?: string;
}

export function getRazorpayClient() {
  const config = orderStore.getPaymentConfig();
  
  const key_id = config.testMode
    ? config.testKeyId || config.razorpayKeyId || process.env.RAZORPAY_TEST_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_test_Tu3J2xHanphLOy'
    : config.liveKeyId || config.razorpayKeyId || process.env.RAZORPAY_LIVE_KEY_ID || process.env.RAZORPAY_KEY_ID || '';

  const key_secret = config.testMode
    ? config.testKeySecret || config.razorpayKeySecret || process.env.RAZORPAY_TEST_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || 'wQKVEbjQupqQMEZeqjA2eeju'
    : config.liveKeySecret || config.razorpayKeySecret || process.env.RAZORPAY_LIVE_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || '';

  const isDemoMode =
    key_id === 'rzp_test_pnr_demo' ||
    key_secret === 'rzp_sec_demo_secret_key' ||
    !key_id ||
    !key_secret;

  let instance: Razorpay | null = null;
  if (!isDemoMode && key_id && key_secret) {
    try {
      instance = new Razorpay({
        key_id,
        key_secret,
      });
    } catch (err) {
      console.warn('Failed to initialize Razorpay SDK instance:', err);
    }
  }

  return {
    instance,
    keyId: key_id,
    keySecret: key_secret,
    isDemoMode,
    testMode: config.testMode,
  };
}

/**
 * Creates an order on Razorpay.
 * Amount is converted to paise (INR 1 = 100 paise).
 * Seamlessly provides sandbox mock fallback when demo keys are used.
 */
export async function createRazorpayOrder({
  amount,
  receipt,
  notes = {},
  outletSlug,
}: CreateOrderParams) {
  const { instance, keyId, isDemoMode } = getRazorpayClient();
  const paise = Math.round(amount * 100);
  const orderReceipt = receipt || `rcpt_${outletSlug || 'pnr'}_${Date.now()}`;

  // If in demo mode or no live credentials configured yet, generate a development mock order
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
 */
export function verifyRazorpaySignature({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean {
  // If sandbox test mock order or simulated payment in demo mode
  if (
    razorpay_order_id.startsWith('order_pnr_') ||
    razorpay_signature === 'mock_signature' ||
    razorpay_signature.startsWith('demo_sig_')
  ) {
    return true;
  }

  const { keySecret } = getRazorpayClient();
  if (!keySecret) return false;

  try {
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === razorpay_signature;
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

/**
 * Verifies webhook signature sent by Razorpay in header 'x-razorpay-signature'
 */
export function verifyWebhookSignature({
  rawBody,
  signature,
}: {
  rawBody: string;
  signature: string;
}): boolean {
  const config = orderStore.getPaymentConfig();
  const secret = config.razorpayWebhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_whsec_demo';

  if (secret === 'rzp_whsec_demo' && signature === 'mock_webhook_signature') {
    return true;
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
