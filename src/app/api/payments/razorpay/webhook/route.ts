import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/payments/payment-service';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    const result = await paymentService.handlePaymentWebhook(rawBody, signature);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Razorpay webhook processing error:', error);
    const message = error instanceof Error ? error.message : 'Webhook processing failed';
    const status = message.includes('Invalid webhook signature') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
