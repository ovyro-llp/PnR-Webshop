import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: NextRequest) {
  try {
    const key_id =
      process.env.RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_TEST_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret =
      process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_TEST_KEY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json(
        { error: 'Razorpay credentials not configured on server' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { amount, currency = 'INR', receipt, notes } = body;

    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'amount is required (in paise, min: 100)' },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    // Validate amount is a positive number and at least 100 paise (₹1.00)
    if (isNaN(numAmount) || numAmount < 100) {
      return NextResponse.json(
        { error: 'Amount must be at least 100 paise (₹1.00)' },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const orderOptions = {
      amount: Math.round(numAmount),
      currency: currency || 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    };

    const order = await razorpay.orders.create(orderOptions);

    return NextResponse.json({
      order_id: order.id,
      orderId: order.id,
      id: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      key_id,
    });
  } catch (error: unknown) {
    console.error('Razorpay create-order error:', error);
    const err = error as {
      statusCode?: number;
      error?: { code?: string; description?: string };
      message?: string;
    };

    if (
      err?.statusCode === 401 ||
      (err?.error?.code === 'BAD_REQUEST_ERROR' &&
        err?.error?.description?.toLowerCase().includes('auth'))
    ) {
      return NextResponse.json(
        { error: 'Razorpay authentication failed' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error:
          err?.error?.description ||
          err?.message ||
          'Failed to create Razorpay order',
      },
      { status: 500 }
    );
  }
}
