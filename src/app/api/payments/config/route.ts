import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';

export async function GET() {
  try {
    const config = orderStore.getPaymentConfig();
    return NextResponse.json({
      success: true,
      config: {
        razorpayKeyId: config.razorpayKeyId,
        // Mask secret for security
        razorpayKeySecretMasked: config.razorpayKeySecret
          ? `${config.razorpayKeySecret.slice(0, 6)}••••••••${config.razorpayKeySecret.slice(-4)}`
          : '',
        hasSecret: Boolean(config.razorpayKeySecret),
        hasWebhookSecret: Boolean(config.razorpayWebhookSecret),
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
    const { razorpayKeyId, razorpayKeySecret, razorpayWebhookSecret, isEnabled, testMode } = body;

    const updates: Record<string, unknown> = {};
    if (razorpayKeyId !== undefined) updates.razorpayKeyId = razorpayKeyId;
    if (razorpayKeySecret && !razorpayKeySecret.includes('••••')) {
      updates.razorpayKeySecret = razorpayKeySecret;
    }
    if (razorpayWebhookSecret && !razorpayWebhookSecret.includes('••••')) {
      updates.razorpayWebhookSecret = razorpayWebhookSecret;
    }
    if (isEnabled !== undefined) updates.isEnabled = Boolean(isEnabled);
    if (testMode !== undefined) updates.testMode = Boolean(testMode);

    const updated = orderStore.updatePaymentConfig(updates);

    return NextResponse.json({
      success: true,
      message: 'Payment Gateway settings updated successfully',
      config: {
        razorpayKeyId: updated.razorpayKeyId,
        hasSecret: Boolean(updated.razorpayKeySecret),
        isEnabled: updated.isEnabled,
        testMode: updated.testMode,
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
