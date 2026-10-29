import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/payments/razorpay';
import { orderStore } from '@/lib/store/order-store';
import { RazorpayVerificationPayload } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: RazorpayVerificationPayload = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderPayload } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: 'Missing Razorpay payment verification parameters' },
        { status: 400 }
      );
    }

    if (!orderPayload || !orderPayload.outletSlug || !orderPayload.customer || !orderPayload.items) {
      return NextResponse.json(
        { success: false, message: 'Incomplete order payload' },
        { status: 400 }
      );
    }

    // Verify HMAC SHA256 Signature
    const isValid = verifyRazorpaySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Payment signature verification failed. Untrusted transaction.' },
        { status: 400 }
      );
    }

    // Create the order with verified payment status
    const order = await orderStore.createOrder({
      outletSlug: orderPayload.outletSlug,
      campaignSlug: orderPayload.campaignSlug,
      customer: orderPayload.customer,
      items: orderPayload.items,
      subtotal: Number(orderPayload.subtotal),
      discount: Number(orderPayload.discount || 0),
      deliveryFee: Number(orderPayload.deliveryFee || 0),
      total: Number(orderPayload.total),
      paymentMethod: orderPayload.paymentMethod || 'UPI',
      paymentStatus: 'COMPLETED',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and order successfully confirmed',
      order,
    });
  } catch (error) {
    console.error('Razorpay verification error:', error);
    const message = error instanceof Error ? error.message : 'Payment verification failed';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
