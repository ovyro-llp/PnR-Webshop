import { NextRequest, NextResponse } from 'next/server';
import { b2bRepository } from '@/lib/b2b/b2b-repository';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'Client slug is required.' }, { status: 400 });
    }

    const client = await b2bRepository.getClientBySlug(slug);
    if (!client) {
      return NextResponse.json({ error: `Client "${slug}" not found.` }, { status: 404 });
    }

    const catalog = await b2bRepository.getClientCatalog(client.id);

    return NextResponse.json({
      client: {
        id: client.id,
        slug: client.slug,
        name: client.name,
        contactPerson: client.contactPerson,
        fulfillingOutletSlug: client.fulfillingOutletSlug,
        billingAddress: client.billingAddress,
      },
      catalog,
    });
  } catch (err: any) {
    console.error('[API /api/b2b/client/[slug] Error]:', err);
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}
