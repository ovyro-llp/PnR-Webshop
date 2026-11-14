import { NextRequest, NextResponse } from 'next/server';
import { b2bRepository } from '@/lib/b2b/b2b-repository';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required.' }, { status: 400 });
    }

    const items = await b2bRepository.getClientCatalog(clientId);
    return NextResponse.json({ items });
  } catch (err: any) {
    console.error('[API /api/b2b/admin/catalog GET Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch catalog.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, productId, productName, category, unit, b2bPrice, imageUrl } = body;

    if (!clientId || !productName) {
      return NextResponse.json(
        { error: 'Client ID and Product Name are required.' },
        { status: 400 }
      );
    }

    const parsedPrice = parseFloat(b2bPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { error: 'Valid B2B Price must be provided (0 or greater).' },
        { status: 400 }
      );
    }

    const item = await b2bRepository.upsertClientCatalogItem({
      clientId,
      productId,
      productName,
      category,
      unit,
      b2bPrice: parsedPrice,
      imageUrl,
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (err: any) {
    console.error('[API /api/b2b/admin/catalog POST Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to update catalog.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const itemId = searchParams.get('itemId');

    if (!clientId || !itemId) {
      return NextResponse.json({ error: 'Client ID and Item ID are required.' }, { status: 400 });
    }

    await b2bRepository.deleteClientCatalogItem(clientId, itemId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API /api/b2b/admin/catalog DELETE Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete item.' }, { status: 500 });
  }
}
