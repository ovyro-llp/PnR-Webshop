import { NextRequest, NextResponse } from 'next/server';
import { b2bRepository } from '@/lib/b2b/b2b-repository';

export async function GET() {
  try {
    const clients = await b2bRepository.getClients();
    return NextResponse.json({ clients });
  } catch (err: any) {
    console.error('[API /api/b2b/admin/clients GET Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch clients.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, contactPerson, phone, email, billingAddress, fulfillingOutletSlug } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Client Name and URL Slug are required.' }, { status: 400 });
    }

    const client = await b2bRepository.createClient({
      name,
      slug,
      contactPerson,
      phone,
      email,
      billingAddress,
      fulfillingOutletSlug,
    });

    return NextResponse.json({ success: true, client }, { status: 201 });
  } catch (err: any) {
    console.error('[API /api/b2b/admin/clients POST Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to create client.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, slug, contactPerson, phone, email, billingAddress, fulfillingOutletSlug, isActive } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'Client ID and Name are required.' }, { status: 400 });
    }

    const updated = await b2bRepository.updateClient(id, {
      name,
      slug,
      contactPerson,
      phone,
      email,
      billingAddress,
      fulfillingOutletSlug,
      isActive,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Client not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, client: updated });
  } catch (err: any) {
    console.error('[API /api/b2b/admin/clients PATCH Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to update client.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required.' }, { status: 400 });
    }

    await b2bRepository.deleteClient(clientId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API /api/b2b/admin/clients DELETE Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete client.' }, { status: 500 });
  }
}
