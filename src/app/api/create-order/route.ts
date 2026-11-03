import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/payments/payment-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { amount, currency = 'INR', receipt, notes, outletSlug = 'cycle-circle' } = body;

    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'amount is required (in paise, min: 100)' },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 100) {
      return NextResponse.json(
        { error: 'Amount must be at least 100 paise (₹1.00)' },
        { status: 400 }
      );
    }

    const amountInRupees = numAmount / 100;
    const result = await paymentService.createPaymentOrder({
      amount: amountInRupees,
      outletSlug: notes?.outletSlug || outletSlug,
      campaignSlug: notes?.campaignSlug || 'direct',
      customer: notes?.customerName ? {
        name: notes.customerName,
        phone: notes.customerPhone || '',
        address: 'Nashik',
        area: 'Cycle Circle',
        pincode: '422005',
      } : undefined,
    });

    return NextResponse.json({
      order_id: result.order_id,
      orderId: result.order_id,
      id: result.order_id,
      amount: result.amount,
      currency: result.currency,
      receipt: result.receipt || receipt,
      status: 'created',
      key_id: result.keyId,
    });
  } catch (error: unknown) {
    console.error('Razorpay create-order legacy endpoint error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create Razorpay order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
