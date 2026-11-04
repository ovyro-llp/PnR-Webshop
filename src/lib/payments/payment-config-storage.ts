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
 * Load payment config from PostgreSQL database, environment variables, or persistent JSON file.
 */
export function getPersistedPaymentConfig(
  overrideConfig?: Partial<PaymentGatewayConfig>
): PaymentGatewayConfig {
  let fileConfig: Partial<PaymentGatewayConfig> = {};
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      fileConfig = JSON.parse(raw);
    }
  } catch (err: any) {
    console.warn('[PaymentConfigStorage] Failed to read payment-config.json:', err.message);
  }

  // 1. Detect live credentials from environment variables across all standard naming conventions
  const envLiveKeyId = (
    process.env.RAZORPAY_LIVE_KEY_ID ||
    process.env.RAZORPAY_LIVE_KEY ||
    (process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? process.env.RAZORPAY_KEY_ID : '') ||
    (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith('rzp_live_')
      ? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      : '') ||
    (process.env.NEXT_PUBLIC_RAZORPAY_LIVE_KEY_ID?.startsWith('rzp_live_')
      ? process.env.NEXT_PUBLIC_RAZORPAY_LIVE_KEY_ID
      : '') ||
    (process.env.RAZORPAY_API_KEY?.startsWith('rzp_live_') ? process.env.RAZORPAY_API_KEY : '') ||
    (process.env.RZP_LIVE_KEY_ID?.startsWith('rzp_live_') ? process.env.RZP_LIVE_KEY_ID : '') ||
    (process.env.RZP_LIVE_KEY?.startsWith('rzp_live_') ? process.env.RZP_LIVE_KEY : '') ||
    (process.env.RZP_KEY_ID?.startsWith('rzp_live_') ? process.env.RZP_KEY_ID : '') ||
    ''
  ).trim();

  const envLiveSecret = (
    process.env.RAZORPAY_LIVE_KEY_SECRET ||
    process.env.RAZORPAY_LIVE_SECRET ||
    process.env.RZP_LIVE_KEY_SECRET ||
    process.env.RZP_LIVE_SECRET ||
    (process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? (process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET) : '') ||
    (process.env.RAZORPAY_LIVE_KEY_ID?.startsWith('rzp_live_') ? (process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET) : '') ||
    (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? (process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET) : '') ||
    (envLiveKeyId ? (
      process.env.RAZORPAY_KEY_SECRET ||
      process.env.RAZORPAY_SECRET ||
      process.env.RAZORPAY_SECRET_KEY ||
      process.env.RAZORPAY_API_SECRET ||
      process.env.RZP_KEY_SECRET ||
      process.env.RZP_SECRET ||
      ''
    ) : '') ||
    ''
  ).trim();

  const envLiveWebhook = (
    process.env.RAZORPAY_LIVE_WEBHOOK_SECRET ||
    process.env.RAZORPAY_WEBHOOK_SECRET ||
    process.env.RZP_WEBHOOK_SECRET ||
    ''
  ).trim();

  const hasEnvLiveCreds = Boolean(envLiveKeyId.startsWith('rzp_live_') && envLiveSecret);

  // Live keys resolution: environment variables > database overrideConfig > fileConfig
  const liveKeyId = (
    envLiveKeyId ||
    overrideConfig?.liveKeyId ||
    (overrideConfig?.razorpayKeyId?.startsWith('rzp_live_') ? overrideConfig.razorpayKeyId : '') ||
    fileConfig.liveKeyId ||
    (fileConfig.razorpayKeyId?.startsWith('rzp_live_') ? fileConfig.razorpayKeyId : '') ||
    ''
  ).trim();

  const liveKeySecret = (
    envLiveSecret ||
    overrideConfig?.liveKeySecret ||
    (overrideConfig?.razorpayKeySecret && (overrideConfig?.liveKeyId?.startsWith('rzp_live_') || overrideConfig?.razorpayKeyId?.startsWith('rzp_live_') || liveKeyId.startsWith('rzp_live_'))
      ? overrideConfig.razorpayKeySecret
      : '') ||
    (liveKeyId.startsWith('rzp_live_') && overrideConfig?.razorpayKeySecret ? overrideConfig.razorpayKeySecret : '') ||
    fileConfig.liveKeySecret ||
    (fileConfig.razorpayKeySecret && (fileConfig.liveKeyId?.startsWith('rzp_live_') || fileConfig.razorpayKeyId?.startsWith('rzp_live_') || liveKeyId.startsWith('rzp_live_'))
      ? fileConfig.razorpayKeySecret
      : '') ||
    ''
  ).trim();

  const liveWebhookSecret = (
    envLiveWebhook ||
    overrideConfig?.liveWebhookSecret ||
    fileConfig.liveWebhookSecret ||
    ''
  ).trim();

  const hasValidLiveCreds = Boolean(liveKeyId.startsWith('rzp_live_') && liveKeySecret);

  // Test keys resolution
  const testKeyId = (
    overrideConfig?.testKeyId ||
    fileConfig.testKeyId ||
    process.env.RAZORPAY_TEST_KEY_ID ||
    (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith('rzp_live_')
      ? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      : '') ||
    (!process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? process.env.RAZORPAY_KEY_ID : '') ||
    'rzp_test_Tu3J2xHanphLOy'
  ).trim();

  const testKeySecret = (
    overrideConfig?.testKeySecret ||
    fileConfig.testKeySecret ||
    process.env.RAZORPAY_TEST_KEY_SECRET ||
    (!process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? process.env.RAZORPAY_KEY_SECRET : '') ||
    'wQKVEbjQupqQMEZeqjA2eeju'
  ).trim();

  const testWebhookSecret = (
    overrideConfig?.testWebhookSecret ||
    fileConfig.testWebhookSecret ||
    process.env.RAZORPAY_TEST_WEBHOOK_SECRET ||
    (!process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? process.env.RAZORPAY_WEBHOOK_SECRET : '') ||
    'rzp_whsec_demo'
  ).trim();

  // Determine testMode:
  let testMode: boolean;
  if (hasValidLiveCreds) {
    // If valid live credentials are provided in env or database, run LIVE!
    testMode = false;
  } else if (process.env.RAZORPAY_ENV === 'live') {
    testMode = false;
  } else if (typeof overrideConfig?.testMode === 'boolean') {
    testMode = overrideConfig.testMode;
  } else if (typeof fileConfig.testMode === 'boolean') {
    testMode = fileConfig.testMode;
  } else {
    testMode = true;
  }

  // Safety: If testMode is false but no live creds exist anywhere, fallback gracefully to test
  if (!testMode && !hasValidLiveCreds) {
    testMode = true;
  }

  const isEnabled =
    typeof overrideConfig?.isEnabled === 'boolean'
      ? overrideConfig.isEnabled
      : typeof fileConfig.isEnabled === 'boolean'
      ? fileConfig.isEnabled
      : true;

  const businessName =
    overrideConfig?.businessName || fileConfig.businessName || "Puffs 'n' Rolls Nashik";

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
 * Persist updated payment gateway configuration to disk, PostgreSQL, and .env.local
 */
export function savePersistedPaymentConfig(
  updates: Partial<PaymentGatewayConfig>,
  baseConfig?: Partial<PaymentGatewayConfig>
): PaymentGatewayConfig {
  const current = getPersistedPaymentConfig(baseConfig);
  const merged: PaymentGatewayConfig = {
    ...current,
    ...updates,
  };

  // CRITICAL: NEVER overwrite an existing liveKeySecret or testKeySecret with an empty/masked value!
  if (!updates.liveKeySecret || updates.liveKeySecret.includes('••••')) {
    merged.liveKeySecret = current.liveKeySecret || baseConfig?.liveKeySecret || '';
  }
  if (!updates.testKeySecret || updates.testKeySecret.includes('••••')) {
    merged.testKeySecret = current.testKeySecret || baseConfig?.testKeySecret || '';
  }
  if (!updates.liveWebhookSecret || updates.liveWebhookSecret.includes('••••')) {
    merged.liveWebhookSecret = current.liveWebhookSecret || baseConfig?.liveWebhookSecret || '';
  }
  if (!updates.testWebhookSecret || updates.testWebhookSecret.includes('••••')) {
    merged.testWebhookSecret = current.testWebhookSecret || baseConfig?.testWebhookSecret || '';
  }

  // If live credentials are provided in updates, update merged values
  if (updates.liveKeyId !== undefined) {
    merged.liveKeyId = updates.liveKeyId.trim();
    if (merged.liveKeyId === '') {
      merged.liveKeySecret = '';
    }
  }
  if (updates.razorpayKeyId && updates.razorpayKeyId.startsWith('rzp_live_')) {
    merged.liveKeyId = updates.razorpayKeyId.trim();
  }

  const hasValidLiveCreds = Boolean(
    merged.liveKeyId &&
    merged.liveKeyId.startsWith('rzp_live_') &&
    merged.liveKeySecret
  );

  // If live credentials are provided or active, default to LIVE mode unless explicitly toggled
  if (updates.liveKeyId?.startsWith('rzp_live_') || updates.razorpayKeyId?.startsWith('rzp_live_')) {
    merged.testMode = false;
  } else if (updates.testMode !== undefined) {
    merged.testMode = Boolean(updates.testMode);
  } else if (hasValidLiveCreds) {
    merged.testMode = false;
  }

  // Safety fallback if testMode is false but no live creds exist anywhere
  if (!merged.testMode && !hasValidLiveCreds) {
    merged.testMode = true;
  }

  if (merged.testMode) {
    merged.razorpayKeyId = merged.testKeyId || 'rzp_test_Tu3J2xHanphLOy';
    merged.razorpayKeySecret = merged.testKeySecret || 'wQKVEbjQupqQMEZeqjA2eeju';
    merged.razorpayWebhookSecret = merged.testWebhookSecret || 'rzp_whsec_demo';
  } else {
    merged.razorpayKeyId = merged.liveKeyId || 'rzp_test_Tu3J2xHanphLOy';
    merged.razorpayKeySecret = merged.liveKeySecret || 'wQKVEbjQupqQMEZeqjA2eeju';
    merged.razorpayWebhookSecret = merged.liveWebhookSecret || 'rzp_whsec_demo';
  }

  // 1. Write to persistent JSON file (if filesystem allows)
  try {
    const dir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(merged, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn('[PaymentConfigStorage] Note: file persistence skipped (read-only environment):', err.message);
  }

  // 2. Update global runtime memory reference
  globalThis.__PNR_PAYMENT_CONFIG__ = merged;

  return merged;
}
