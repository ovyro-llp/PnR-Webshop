import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/payments/payment-service';
import { MetaAttributionContext } from '@/types';

function extractAttributionFromRequest(req: NextRequest, bodyMeta?: MetaAttributionContext): MetaAttributionContext {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const clientIp =
    forwardedFor?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip')?.trim() ||
    bodyMeta?.clientIp ||
    undefined;
  const clientUserAgent = req.headers.get('user-agent')?.trim() || bodyMeta?.clientUserAgent || undefined;
  const fbc = bodyMeta?.fbc || req.cookies.get('_fbc')?.value || undefined;
  const fbp = bodyMeta?.fbp || req.cookies.get('_fbp')?.value || undefined;
  const eventSourceUrl = bodyMeta?.eventSourceUrl || req.headers.get('referer') || undefined;

  return { fbc, fbp, clientIp, clientUserAgent, eventSourceUrl };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const metaAttribution = extractAttributionFromRequest(req, body?.metaAttribution);
    const result = await paymentService.createPaymentOrder({
      ...body,
      metaAttribution,
    });
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Razorpay create-order route error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create payment order';
    return NextResponse.json(
      { success: false, message },
      { status: 400 }
    );
  }
}
