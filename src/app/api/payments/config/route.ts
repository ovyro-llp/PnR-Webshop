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
    if (razorpayKeyId !== undefined) updates.razorpayKeyId = razorpayKeyId.trim();
    if (razorpayKeySecret && !razorpayKeySecret.includes('••••')) {
      updates.razorpayKeySecret = razorpayKeySecret.trim();
    }
    if (razorpayWebhookSecret && !razorpayWebhookSecret.includes('••••')) {
      updates.razorpayWebhookSecret = razorpayWebhookSecret.trim();
    }

    // Test credentials
    if (testKeyId !== undefined) updates.testKeyId = testKeyId.trim();
    if (testKeySecret !== undefined && !testKeySecret.includes('••••')) {
      updates.testKeySecret = testKeySecret.trim();
    }
    if (testWebhookSecret !== undefined && !testWebhookSecret.includes('••••')) {
      updates.testWebhookSecret = testWebhookSecret.trim();
    }

    // Live credentials
    if (liveKeyId !== undefined) updates.liveKeyId = liveKeyId.trim();
    if (liveKeySecret !== undefined && !liveKeySecret.includes('••••')) {
      updates.liveKeySecret = liveKeySecret.trim();
    }
    if (liveWebhookSecret !== undefined && !liveWebhookSecret.includes('••••')) {
      updates.liveWebhookSecret = liveWebhookSecret.trim();
    }

    if (isEnabled !== undefined) updates.isEnabled = Boolean(isEnabled);
    if (testMode !== undefined) updates.testMode = Boolean(testMode);
    if (businessName !== undefined) updates.businessName = businessName;

    const updated = orderStore.updatePaymentConfig(updates);
    const hasLiveCreds = Boolean(
      updated.liveKeyId?.startsWith('rzp_live_') && updated.liveKeySecret
    );

    return NextResponse.json({
      success: true,
      message: 'Payment Gateway settings updated and persisted successfully',
      config: {
        razorpayKeyId: updated.razorpayKeyId,
        testMode: updated.testMode,
        isEnabled: updated.isEnabled,
        hasSecret: Boolean(updated.razorpayKeySecret),
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
