import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';
import { CartSessionItem, FunnelStage } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      visitorId,
      sessionId,
      outletSlug = 'gangapur-road',
      items = [],
      total = 0,
      itemCount = 0,
      funnelStage = 'ADDED_TO_CART',
      customerName,
      customerPhone,
      customerAddress,
      utmSource,
      utmMedium,
      utmCampaign,
      metadata = {},
    } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const sanitizedItems: CartSessionItem[] = Array.isArray(items)
      ? items.map((i: any) => ({
          id: String(i.id || i.menuItemId || ''),
          name: String(i.name || ''),
          price: Number(i.price) || 0,
          quantity: Math.max(1, Number(i.quantity) || 1),
          total: Number(i.total) || (Number(i.price) || 0) * (Math.max(1, Number(i.quantity) || 1)),
          image: i.image ? String(i.image) : undefined,
          variant: i.variant ? String(i.variant) : undefined,
        }))
      : [];

    const calculatedTotal = sanitizedItems.length > 0
      ? sanitizedItems.reduce((acc, item) => acc + (item.total || (item.price * item.quantity)), 0)
      : Number(total) || 0;

    const calculatedCount = sanitizedItems.length > 0
      ? sanitizedItems.reduce((acc, item) => acc + item.quantity, 0)
      : Number(itemCount) || 0;

    const normalizedStage: FunnelStage = [
      'VISITOR',
      'OUTLET_SELECTED',
      'PRODUCT_VIEWED',
      'ADDED_TO_CART',
      'CART_VIEWED',
      'CHECKOUT_STARTED',
      'PAYMENT_ATTEMPTED',
      'PAID_ORDER',
    ].includes(funnelStage)
      ? funnelStage
      : 'ADDED_TO_CART';

    const session = await orderStore.upsertCartSession({
      visitorId: visitorId ? String(visitorId) : '',
      sessionId: String(sessionId),
      outletSlug: String(outletSlug),
      items: sanitizedItems,
      total: calculatedTotal,
      itemCount: calculatedCount,
      funnelStage: normalizedStage,
      status: sanitizedItems.length > 0 ? 'ACTIVE' : 'ABANDONED',
      customerName: customerName ? String(customerName).trim() : undefined,
      customerPhone: customerPhone ? String(customerPhone).replace(/\D/g, '').slice(-10) : undefined,
      customerAddress: customerAddress ? String(customerAddress).trim() : undefined,
      utmSource: utmSource ? String(utmSource) : undefined,
      utmMedium: utmMedium ? String(utmMedium) : undefined,
      utmCampaign: utmCampaign ? String(utmCampaign) : undefined,
      metadata: typeof metadata === 'object' && metadata !== null ? metadata : {},
    });

    return NextResponse.json({ success: true, session });
  } catch (error: any) {
    console.error('[CartSession Route Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const outletSlug = searchParams.get('outletSlug') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = Number(searchParams.get('limit')) || 100;

    const sessions = await orderStore.getCartSessions({ outletSlug, status, limit });
    return NextResponse.json({ success: true, count: sessions.length, sessions });
  } catch (error: any) {
    console.error('[CartSession GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
