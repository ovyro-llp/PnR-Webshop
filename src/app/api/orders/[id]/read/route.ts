import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let readBy: string | undefined;

    try {
      const body = await req.json();
      readBy = body?.readBy;
    } catch {
      // Body may be empty
    }

    const updated = await orderStore.markOrderAsRead(id, readBy);

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Order not found or could not be marked as read' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order marked as read',
      order: updated,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to mark order as read';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
