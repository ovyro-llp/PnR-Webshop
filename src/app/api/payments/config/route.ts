import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';

export async function GET() {
  try {
    const config = await orderStore.getPaymentConfigAsync();
    const hasLiveCreds = Boolean(
      config.liveKeyId?.startsWith('rzp_live_') && config.liveKeySecret
    );
    const isLiveReady = !config.testMode && hasLiveCreds;

    return NextResponse.json({
      success: true,
      config: {
        razorpayKeyId: config.razorpayKeyId,
        // Active secret masked
        razorpayKeySecretMasked: config.razorpayKeySecret
          ? `${config.razorpayKeySecret.slice(0, 6)}••••••••${config.razorpayKeySecret.slice(-4)}`
          : '',
        hasSecret: Boolean(config.razorpayKeySecret),
        hasWebhookSecret: Boolean(config.razorpayWebhookSecret),
        
        // Test Credentials
        testKeyId: config.testKeyId || '',
        testKeySecretMasked: config.testKeySecret
          ? `${config.testKeySecret.slice(0, 6)}••••••••${config.testKeySecret.slice(-4)}`
          : '',
        hasTestSecret: Boolean(config.testKeySecret),
        hasTestWebhookSecret: Boolean(config.testWebhookSecret),

        // Live Credentials
        liveKeyId: config.liveKeyId || '',
        liveKeySecretMasked: config.liveKeySecret
          ? `${config.liveKeySecret.slice(0, 6)}••••••••${config.liveKeySecret.slice(-4)}`
          : '',
        hasLiveSecret: Boolean(config.liveKeySecret),
        hasLiveWebhookSecret: Boolean(config.liveWebhookSecret),

        hasLiveCreds,
        isLiveReady,
        activeMode: config.testMode ? 'SANDBOX' : 'LIVE',
        isDatabaseConnected: Boolean(process.env.DATABASE_URL?.trim()),
        isEnabled: config.isEnabled,
        testMode: config.testMode,
        businessName: config.businessName,
      },
    });
  } catch (error) {
    console.error('Failed to get payment config:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpayKeyId,
      razorpayKeySecret,
      razorpayWebhookSecret,
      testKeyId,
      testKeySecret,
      testWebhookSecret,
      liveKeyId,
      liveKeySecret,
      liveWebhookSecret,
      isEnabled,
      testMode,
      businessName,
    } = body;

    const updates: Record<string, unknown> = {};
    if (razorpayKeyId !== undefined && razorpayKeyId.trim() !== '') {
      updates.razorpayKeyId = razorpayKeyId.trim();
    }
    if (razorpayKeySecret && razorpayKeySecret.trim() && !razorpayKeySecret.includes('••••')) {
      updates.razorpayKeySecret = razorpayKeySecret.trim();
    }
    if (razorpayWebhookSecret && razorpayWebhookSecret.trim() && !razorpayWebhookSecret.includes('••••')) {
      updates.razorpayWebhookSecret = razorpayWebhookSecret.trim();
    }

    // Test credentials
    if (testKeyId !== undefined && testKeyId.trim() !== '') {
      updates.testKeyId = testKeyId.trim();
    }
    if (testKeySecret && testKeySecret.trim() && !testKeySecret.includes('••••')) {
      updates.testKeySecret = testKeySecret.trim();
    }
    if (testWebhookSecret && testWebhookSecret.trim() && !testWebhookSecret.includes('••••')) {
      updates.testWebhookSecret = testWebhookSecret.trim();
    }

    // Live credentials
    if (liveKeyId !== undefined) {
      updates.liveKeyId = liveKeyId.trim();
    }
    if (liveKeySecret && liveKeySecret.trim() && !liveKeySecret.includes('••••')) {
      updates.liveKeySecret = liveKeySecret.trim();
    }
    if (liveWebhookSecret && liveWebhookSecret.trim() && !liveWebhookSecret.includes('••••')) {
      updates.liveWebhookSecret = liveWebhookSecret.trim();
    }

    if (isEnabled !== undefined) updates.isEnabled = Boolean(isEnabled);

    // If live credentials are provided or present, automatically activate LIVE mode!
    const isLiveInput = Boolean(
      (typeof updates.liveKeyId === 'string' && updates.liveKeyId.startsWith('rzp_live_')) ||
      (typeof updates.razorpayKeyId === 'string' && updates.razorpayKeyId.startsWith('rzp_live_')) ||
      (typeof liveKeyId === 'string' && liveKeyId.startsWith('rzp_live_')) ||
      (typeof razorpayKeyId === 'string' && razorpayKeyId.startsWith('rzp_live_'))
    );

    if (isLiveInput) {
      updates.testMode = false;
      if (updates.liveKeyId) {
        updates.razorpayKeyId = updates.liveKeyId;
      }
      if (updates.liveKeySecret) {
        updates.razorpayKeySecret = updates.liveKeySecret;
      }
    } else if (testMode !== undefined) {
      updates.testMode = Boolean(testMode);
    }

    if (businessName !== undefined && businessName.trim() !== '') {
      updates.businessName = businessName.trim();
    }

    const updated = await orderStore.updatePaymentConfigAsync(updates);
    const hasLiveCreds = Boolean(
      updated.liveKeyId?.startsWith('rzp_live_') && updated.liveKeySecret
    );

    return NextResponse.json({
      success: true,
      message: 'Payment Gateway settings updated and permanently persisted to PostgreSQL successfully',
      config: {
        razorpayKeyId: updated.razorpayKeyId,
        testMode: updated.testMode,
        activeMode: updated.testMode ? 'SANDBOX' : 'LIVE',
        isDatabaseConnected: Boolean(process.env.DATABASE_URL?.trim()),
        isEnabled: updated.isEnabled,
        hasSecret: Boolean(updated.razorpayKeySecret),
        hasLiveSecret: Boolean(updated.liveKeySecret),
        hasLiveCreds,
        isLiveReady: !updated.testMode && hasLiveCreds,
      },
    });
  } catch (error) {
    console.error('Failed to update payment config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update payment config' },
      { status: 500 }
    );
  }
}
