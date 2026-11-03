import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/payments/payment-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = body.razorpay_order_id || body.order_id;
    const paymentId = body.razorpay_payment_id || body.payment_id;
    const signature = body.razorpay_signature || body.signature;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: order_id, payment_id, and signature are all required',
        },
        { status: 400 }
      );
    }

    const settledOrder = await paymentService.verifyAndSettlePayment({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      orderPayload: body.orderPayload,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      order_id: orderId,
      payment_id: paymentId,
      order: settledOrder,
    });
  } catch (error: unknown) {
    console.error('Razorpay verify-payment error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error during verification';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
