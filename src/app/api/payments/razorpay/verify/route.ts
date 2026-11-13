import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/payments/payment-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderPayload } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: 'Missing payment verification parameters' },
        { status: 400 }
      );
    }

    const settledOrder = await paymentService.verifyAndSettlePayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderPayload,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and order successfully confirmed',
      order: settledOrder,
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
