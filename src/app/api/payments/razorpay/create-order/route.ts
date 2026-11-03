import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/payments/payment-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await paymentService.createPaymentOrder(body);
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Razorpay create-order route error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create payment order';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
