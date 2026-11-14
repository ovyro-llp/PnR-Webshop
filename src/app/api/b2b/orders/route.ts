import { NextRequest, NextResponse } from 'next/server';
import { b2bRepository } from '@/lib/b2b/b2b-repository';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientSlug, departmentId, clientUserId, deliveryDate, deliveryTimeSlot, items, notes } = body;

    // Validate essential fields
    if (!clientSlug || !departmentId) {
      return NextResponse.json(
        { error: 'Client slug and pre-locked department ID are required.' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one product with a quantity greater than zero.' },
        { status: 400 }
      );
    }

    const validItems = items.filter((i: any) => Number(i.quantity) > 0);
    if (validItems.length === 0) {
      return NextResponse.json(
        { error: 'All item quantities are 0. Please specify quantity to order.' },
        { status: 400 }
      );
    }

    // Default to tomorrow if not specified
    const targetDate =
      deliveryDate ||
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const order = await b2bRepository.createB2BOrder({
      clientSlug,
      departmentId,
      clientUserId,
      deliveryDate: targetDate,
      deliveryTimeSlot: deliveryTimeSlot || 'Morning (08:30 AM - 10:00 AM)',
      items: validItems.map((i: any) => ({
        productId: i.productId,
        productName: i.productName,
        category: i.category,
        unit: i.unit,
        b2bPrice: Number(i.b2bPrice || 0),
        quantity: parseInt(i.quantity, 10),
      })),
      notes,
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (err: any) {
    console.error('[API /api/b2b/orders Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to place order.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || undefined;
    const clientId = searchParams.get('clientId') || undefined;
    const departmentId = searchParams.get('departmentId') || undefined;
    const status = searchParams.get('status') || undefined;

    const orders = await b2bRepository.getB2BOrders({
      date,
      clientId,
      departmentId,
      status,
    });

    return NextResponse.json({ orders });
  } catch (err: any) {
    console.error('[API /api/b2b/orders GET Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch orders.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status are required.' }, { status: 400 });
    }

    const updated = await b2bRepository.updateOrderStatus(orderId, status);
    if (!updated) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    console.error('[API /api/b2b/orders PATCH Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to update order status.' }, { status: 500 });
  }
}
