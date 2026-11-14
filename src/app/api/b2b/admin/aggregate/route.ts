import { NextRequest, NextResponse } from 'next/server';
import { b2bRepository } from '@/lib/b2b/b2b-repository';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const clientId = searchParams.get('clientId') || undefined;

    const [kitchenSheet, packingSlips, billingSummary] = await Promise.all([
      b2bRepository.getAggregatedKitchenBakeSheet(date, clientId),
      b2bRepository.getDepartmentPackingSlips(date, clientId),
      b2bRepository.getBillingSummary(date, clientId),
    ]);

    return NextResponse.json({
      date,
      clientId,
      kitchenSheet,
      packingSlips,
      billingSummary,
    });
  } catch (err: any) {
    console.error('[API /api/b2b/admin/aggregate Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to aggregate kitchen data.' }, { status: 500 });
  }
}
