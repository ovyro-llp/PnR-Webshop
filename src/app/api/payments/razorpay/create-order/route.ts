import { NextRequest, NextResponse } from 'next/server';
import { createRazorpayOrder, getRazorpayClient } from '@/lib/payments/razorpay';
import { orderStore } from '@/lib/store/order-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, outletSlug, campaignSlug, customer, items } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid order amount' },
        { status: 400 }
      );
    }

    if (!outletSlug) {
      return NextResponse.json(
        { success: false, message: 'Outlet slug is required' },
        { status: 400 }
      );
    }

    const outlet = orderStore.getOutletBySlug(outletSlug);
    if (!outlet) {
      return NextResponse.json(
        { success: false, message: `Outlet not found: ${outletSlug}` },
        { status: 404 }
      );
    }

    const receipt = `rcpt_${outletSlug}_${Date.now()}`;
    const notes: Record<string, string> = {
      outletSlug,
      campaignSlug: campaignSlug || 'direct',
      customerName: customer?.name || 'Guest',
      customerPhone: customer?.phone || '',
      itemCount: items ? String(items.length) : '1',
    };

    const rzpOrder = await createRazorpayOrder({
      amount: Number(amount),
      receipt,
      notes,
      outletSlug,
    });

    const { keyId, isDemoMode } = getRazorpayClient();

    return NextResponse.json({
      success: true,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      receipt: rzpOrder.receipt,
      keyId,
      isDemoMode,
      businessName: "Puffs 'n' Rolls Nashik",
      description: `Artisanal Bakery Order • ${outlet.name}`,
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
