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
      // CRITICAL: NEVER overwrite an existing live credential in process.env with a test/empty fallback!
      const currentEnvVal = process.env[key];
      const isExistingLiveCred = Boolean(
        currentEnvVal &&
          (currentEnvVal.startsWith('rzp_live_') || (key === 'RAZORPAY_ENV' && currentEnvVal === 'live'))
      );
      const isNewValueTestOrEmpty = !value || value.startsWith('rzp_test_') || value === 'test';

      if (!isExistingLiveCred || !isNewValueTestOrEmpty) {
        process.env[key] = value;
      }
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

  // 1. Detect live credentials from environment variables (Railway / Vercel / host sovereign variables)
  const envLiveKeyId = (
    process.env.RAZORPAY_LIVE_KEY_ID ||
    (process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? process.env.RAZORPAY_KEY_ID : '') ||
    (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith('rzp_live_')
      ? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      : '') ||
    ''
  ).trim();

  const envLiveSecret = (
    process.env.RAZORPAY_LIVE_KEY_SECRET ||
    (process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? process.env.RAZORPAY_KEY_SECRET : '') ||
    (process.env.RAZORPAY_LIVE_KEY_ID?.startsWith('rzp_live_') ? process.env.RAZORPAY_KEY_SECRET : '') ||
    ''
  ).trim();

  const envLiveWebhook = (
    process.env.RAZORPAY_LIVE_WEBHOOK_SECRET ||
    (process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? process.env.RAZORPAY_WEBHOOK_SECRET : '') ||
    ''
  ).trim();

  const hasEnvLiveCreds = Boolean(envLiveKeyId.startsWith('rzp_live_') && envLiveSecret);

  // Live keys resolution: environment variables take sovereignty over fileConfig
  const liveKeyId = envLiveKeyId || fileConfig.liveKeyId || '';
  const liveKeySecret = envLiveSecret || fileConfig.liveKeySecret || '';
  const liveWebhookSecret = envLiveWebhook || fileConfig.liveWebhookSecret || '';
  const hasValidLiveCreds = Boolean(liveKeyId.startsWith('rzp_live_') && liveKeySecret);

  // Test keys resolution
  const testKeyId =
    fileConfig.testKeyId ||
    process.env.RAZORPAY_TEST_KEY_ID ||
    (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith('rzp_live_')
      ? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      : '') ||
    (!process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? process.env.RAZORPAY_KEY_ID : '') ||
    'rzp_test_Tu3J2xHanphLOy';

  const testKeySecret =
    fileConfig.testKeySecret ||
    process.env.RAZORPAY_TEST_KEY_SECRET ||
    (!process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? process.env.RAZORPAY_KEY_SECRET : '') ||
    'wQKVEbjQupqQMEZeqjA2eeju';

  const testWebhookSecret =
    fileConfig.testWebhookSecret ||
    process.env.RAZORPAY_TEST_WEBHOOK_SECRET ||
    (!process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? process.env.RAZORPAY_WEBHOOK_SECRET : '') ||
    'rzp_whsec_demo';

  // Determine testMode:
  // If host environment has live credentials OR explicitly sets RAZORPAY_ENV=live, lock to live mode (testMode = false)!
  let testMode: boolean;
  if (process.env.RAZORPAY_ENV === 'live' || hasEnvLiveCreds) {
    testMode = false;
  } else if (process.env.RAZORPAY_ENV === 'test') {
    testMode = true;
  } else if (typeof fileConfig.testMode === 'boolean') {
    testMode = fileConfig.testMode;
  } else {
    testMode = !hasValidLiveCreds;
  }

  // Safety: If testMode is false but no live creds exist anywhere, fallback gracefully to test
  if (!testMode && !hasValidLiveCreds) {
    testMode = true;
  }

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

  // 2. Sync to .env.local (without clobbering host environment variables)
  const envUpdates: Record<string, string> = {
    RAZORPAY_ENV: merged.testMode ? 'test' : 'live',
  };

  if (merged.liveKeyId) envUpdates.RAZORPAY_LIVE_KEY_ID = merged.liveKeyId;
  if (merged.liveKeySecret) envUpdates.RAZORPAY_LIVE_KEY_SECRET = merged.liveKeySecret;
  if (merged.liveWebhookSecret) envUpdates.RAZORPAY_LIVE_WEBHOOK_SECRET = merged.liveWebhookSecret;

  if (merged.testKeyId) envUpdates.RAZORPAY_TEST_KEY_ID = merged.testKeyId;
  if (merged.testKeySecret) envUpdates.RAZORPAY_TEST_KEY_SECRET = merged.testKeySecret;
  if (merged.testWebhookSecret) envUpdates.RAZORPAY_TEST_WEBHOOK_SECRET = merged.testWebhookSecret;

  if (!merged.testMode && merged.liveKeyId) {
    envUpdates.RAZORPAY_KEY_ID = merged.liveKeyId;
    envUpdates.NEXT_PUBLIC_RAZORPAY_KEY_ID = merged.liveKeyId;
    if (merged.liveKeySecret) envUpdates.RAZORPAY_KEY_SECRET = merged.liveKeySecret;
  } else if (merged.testMode) {
    envUpdates.RAZORPAY_KEY_ID = merged.testKeyId || '';
    envUpdates.NEXT_PUBLIC_RAZORPAY_KEY_ID = merged.testKeyId || '';
    if (merged.testKeySecret) envUpdates.RAZORPAY_KEY_SECRET = merged.testKeySecret;
  }

  updateEnvLocalFile(envUpdates);

  // 3. Update global memory reference
  globalThis.__PNR_PAYMENT_CONFIG__ = merged;

  return merged;
}
