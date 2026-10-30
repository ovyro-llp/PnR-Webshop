import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { orderStore } from '@/lib/store/order-store';
import { getRazorpayClient } from '@/lib/payments/razorpay';

export async function POST(req: NextRequest) {
  try {
    const clientInfo = getRazorpayClient();
    const key_secret =
      clientInfo.keySecret ||
      process.env.RAZORPAY_KEY_SECRET ||
      process.env.RAZORPAY_LIVE_KEY_SECRET ||
      process.env.RAZORPAY_TEST_KEY_SECRET;

    if (!key_secret) {
      return NextResponse.json(
        { error: 'Razorpay secret key not configured on server' },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const orderId = body.razorpay_order_id || body.order_id;
    const paymentId = body.razorpay_payment_id || body.payment_id;
    const signature = body.razorpay_signature || body.signature;

    // Validate all required parameters are present
    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: order_id, payment_id, and signature are all required',
        },
        { status: 400 }
      );
    }

    // HMAC SHA-256 algorithm: order_id + "|" + payment_id signed with KEY_SECRET
    const payload = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(payload)
      .digest('hex');

    // Signature mismatch: return 400, do NOT mark as paid
    if (generatedSignature !== signature) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment verification failed: Signature mismatch',
        },
        { status: 400 }
      );
    }

    // Mark as paid in orderStore if matching order exists
    try {
      orderStore.updatePaymentStatus(orderId, 'COMPLETED', paymentId);
    } catch (e) {
      console.warn('Could not update order status in store:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      order_id: orderId,
      payment_id: paymentId,
    });
  } catch (error: unknown) {
    console.error('Razorpay verify-payment error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal Server Error during verification';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
