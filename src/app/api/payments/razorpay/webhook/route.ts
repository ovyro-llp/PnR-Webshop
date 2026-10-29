import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/payments/razorpay';
import { orderStore } from '@/lib/store/order-store';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    // Verify webhook signature
    const isValid = verifyWebhookSignature({ rawBody, signature });
    if (!isValid) {
      console.warn('Invalid Razorpay webhook signature received');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload;

    console.log(`Razorpay Webhook Event Received: ${eventType}`);

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = payload.payment?.entity;
      const orderEntity = payload.order?.entity;
      const rzpOrderId = paymentEntity?.order_id || orderEntity?.id;
      const rzpPaymentId = paymentEntity?.id;

      if (rzpOrderId) {
        orderStore.updatePaymentStatus(rzpOrderId, 'COMPLETED', rzpPaymentId);
        console.log(`Order with Razorpay ID ${rzpOrderId} marked as COMPLETED`);
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = payload.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id;
      const rzpPaymentId = paymentEntity?.id;

      if (rzpOrderId) {
        orderStore.updatePaymentStatus(rzpOrderId, 'FAILED', rzpPaymentId);
        console.log(`Order with Razorpay ID ${rzpOrderId} marked as FAILED`);
      }
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (error) {
    console.error('Razorpay webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
