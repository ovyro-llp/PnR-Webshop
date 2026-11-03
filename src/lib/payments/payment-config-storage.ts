import fs from 'fs';
import path from 'path';
import { PaymentGatewayConfig } from '@/types';

const CONFIG_FILE_PATH = path.join(process.cwd(), 'src/lib/data/payment-config.json');
const ENV_LOCAL_PATH = path.join(process.cwd(), '.env.local');

/**
 * Updates or adds a key-value pair in .env.local while preserving comments and format.
 */
function updateEnvLocalFile(updates: Record<string, string>) {
  try {
    let content = '';
    if (fs.existsSync(ENV_LOCAL_PATH)) {
      content = fs.readFileSync(ENV_LOCAL_PATH, 'utf-8');
    }

    let modified = content;
    for (const [key, value] of Object.entries(updates)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(modified)) {
        modified = modified.replace(regex, `${key}=${value}`);
      } else {
        modified += `\n${key}=${value}`;
      }
      // Also update in-memory process.env
      process.env[key] = value;
    }

    fs.writeFileSync(ENV_LOCAL_PATH, modified, 'utf-8');
  } catch (err: any) {
    console.warn('[PaymentConfigStorage] Failed to update .env.local:', err.message);
  }
}

/**
 * Load payment config from persistent JSON file or environment variables.
 */
export function getPersistedPaymentConfig(): PaymentGatewayConfig {
  let fileConfig: Partial<PaymentGatewayConfig> = {};
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      fileConfig = JSON.parse(raw);
    }
  } catch (err: any) {
    console.warn('[PaymentConfigStorage] Failed to read payment-config.json:', err.message);
  }

  // Environment fallback
  const isEnvLive =
    process.env.RAZORPAY_ENV === 'live' ||
    Boolean(process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_')) ||
    Boolean(process.env.RAZORPAY_LIVE_KEY_ID?.startsWith('rzp_live_'));

  const testKeyId =
    fileConfig.testKeyId ||
    process.env.RAZORPAY_TEST_KEY_ID ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID ||
    'rzp_test_Tu3J2xHanphLOy';

  const testKeySecret =
    fileConfig.testKeySecret ||
    process.env.RAZORPAY_TEST_KEY_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    'wQKVEbjQupqQMEZeqjA2eeju';

  const testWebhookSecret =
    fileConfig.testWebhookSecret ||
    process.env.RAZORPAY_TEST_WEBHOOK_SECRET ||
    process.env.RAZORPAY_WEBHOOK_SECRET ||
    'rzp_whsec_demo';

  const liveKeyId =
    fileConfig.liveKeyId ||
    process.env.RAZORPAY_LIVE_KEY_ID ||
    (process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? process.env.RAZORPAY_KEY_ID : '') ||
    '';

  const liveKeySecret =
    fileConfig.liveKeySecret ||
    process.env.RAZORPAY_LIVE_KEY_SECRET ||
    (process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? process.env.RAZORPAY_KEY_SECRET : '') ||
    '';

  const liveWebhookSecret =
    fileConfig.liveWebhookSecret ||
    process.env.RAZORPAY_LIVE_WEBHOOK_SECRET ||
    '';

  // If fileConfig explicitly specifies testMode (true or false), honor it!
  const testMode =
    typeof fileConfig.testMode === 'boolean'
      ? fileConfig.testMode
      : !isEnvLive;

  const isEnabled =
    typeof fileConfig.isEnabled === 'boolean' ? fileConfig.isEnabled : true;

  const businessName = fileConfig.businessName || "Puffs 'n' Rolls Nashik";

  const razorpayKeyId = testMode ? testKeyId : (liveKeyId || testKeyId);
  const razorpayKeySecret = testMode ? testKeySecret : (liveKeySecret || testKeySecret);
  const razorpayWebhookSecret = testMode ? testWebhookSecret : (liveWebhookSecret || testWebhookSecret);

  return {
    testMode,
    isEnabled,
    businessName,
    testKeyId,
    testKeySecret,
    testWebhookSecret,
    liveKeyId,
    liveKeySecret,
    liveWebhookSecret,
    razorpayKeyId,
    razorpayKeySecret,
    razorpayWebhookSecret,
  };
}

/**
 * Persist updated payment gateway configuration to disk and .env.local
 */
export function savePersistedPaymentConfig(
  updates: Partial<PaymentGatewayConfig>
): PaymentGatewayConfig {
  const current = getPersistedPaymentConfig();
  const merged: PaymentGatewayConfig = {
    ...current,
    ...updates,
  };

  // If testMode was explicitly updated, sync active keys
  if (updates.testMode !== undefined) {
    merged.testMode = Boolean(updates.testMode);
  }

  if (merged.testMode) {
    merged.razorpayKeyId = merged.testKeyId || 'rzp_test_Tu3J2xHanphLOy';
    merged.razorpayKeySecret = merged.testKeySecret || 'wQKVEbjQupqQMEZeqjA2eeju';
    merged.razorpayWebhookSecret = merged.testWebhookSecret || 'rzp_whsec_demo';
  } else {
    // Live mode: use liveKeyId if available; fallback to testKeyId only if live is unconfigured
    merged.razorpayKeyId = merged.liveKeyId || merged.testKeyId || 'rzp_test_Tu3J2xHanphLOy';
    merged.razorpayKeySecret = merged.liveKeySecret || merged.testKeySecret || 'wQKVEbjQupqQMEZeqjA2eeju';
    merged.razorpayWebhookSecret = merged.liveWebhookSecret || merged.testWebhookSecret || 'rzp_whsec_demo';
  }

  // 1. Write to persistent JSON file
  try {
    const dir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(merged, null, 2), 'utf-8');
  } catch (err: any) {
    console.error('[PaymentConfigStorage] Failed writing payment-config.json:', err.message);
  }

  // 2. Sync to .env.local
  const envUpdates: Record<string, string> = {
    RAZORPAY_ENV: merged.testMode ? 'test' : 'live',
    RAZORPAY_LIVE_KEY_ID: merged.liveKeyId || '',
    RAZORPAY_LIVE_KEY_SECRET: merged.liveKeySecret || '',
    RAZORPAY_LIVE_WEBHOOK_SECRET: merged.liveWebhookSecret || '',
  };

  if (merged.testKeyId) envUpdates.RAZORPAY_TEST_KEY_ID = merged.testKeyId;
  if (merged.testKeySecret) envUpdates.RAZORPAY_TEST_KEY_SECRET = merged.testKeySecret;
  if (merged.testWebhookSecret) envUpdates.RAZORPAY_TEST_WEBHOOK_SECRET = merged.testWebhookSecret;

  if (merged.testMode || !merged.liveKeyId) {
    envUpdates.RAZORPAY_KEY_ID = merged.testKeyId || '';
    envUpdates.NEXT_PUBLIC_RAZORPAY_KEY_ID = merged.testKeyId || '';
    if (merged.testKeySecret) envUpdates.RAZORPAY_KEY_SECRET = merged.testKeySecret;
  } else {
    envUpdates.RAZORPAY_KEY_ID = merged.liveKeyId;
    envUpdates.NEXT_PUBLIC_RAZORPAY_KEY_ID = merged.liveKeyId;
    if (merged.liveKeySecret) envUpdates.RAZORPAY_KEY_SECRET = merged.liveKeySecret;
  }

  updateEnvLocalFile(envUpdates);

  // 3. Update global memory reference
  globalThis.__PNR_PAYMENT_CONFIG__ = merged;

  return merged;
}
