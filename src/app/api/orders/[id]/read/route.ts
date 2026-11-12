import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let readBy: string | undefined;
    let outletSlug: string | undefined;

    try {
      const body = await req.json();
      readBy = body?.readBy;
      outletSlug = body?.outletSlug;
    } catch {
      // Body may be empty
    }

    if (id === 'all' || id === 'dismiss-all') {
      await orderStore.markAllOrdersAsRead(outletSlug, readBy);
      return NextResponse.json({
        success: true,
        message: 'All unread orders marked as read',
      });
    }

    const updated = await orderStore.markOrderAsRead(id, readBy);

    return NextResponse.json({
      success: true,
      message: 'Order marked as read',
      order: updated || { id, isRead: true },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to mark order as read';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
