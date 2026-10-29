import { NextRequest, NextResponse } from 'next/server';
import { getMediaUploads, createMediaUpload } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const media = await getMediaUploads(limit);
    return NextResponse.json({ success: true, media });
  } catch (err: any) {
    console.error('Error in GET /api/media:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let filename = `pnr-asset-${Date.now()}.jpg`;
    let mimeType = 'image/jpeg';
    let dataUrl = '';
    let byteSize = 0;
    let title = '';
    let category = 'bakery';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      title = (formData.get('title') as string) || '';
      category = (formData.get('category') as string) || 'bakery';

      if (!file) {
        return NextResponse.json({ success: false, error: 'No file uploaded in form data' }, { status: 400 });
      }

      filename = file.name || filename;
      mimeType = file.type || mimeType;
      byteSize = file.size;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    } else {
      const body = await request.json();
      if (!body.dataUrl) {
        return NextResponse.json({ success: false, error: 'dataUrl is required' }, { status: 400 });
      }

      filename = body.filename || filename;
      mimeType = body.mimeType || mimeType;
      dataUrl = body.dataUrl;
      title = body.title || '';
      category = body.category || 'bakery';

      // Estimate byte size from base64 string
      const base64Index = dataUrl.indexOf('base64,');
      const base64Part = base64Index !== -1 ? dataUrl.slice(base64Index + 7) : dataUrl;
      byteSize = body.byteSize || Math.floor((base64Part.length * 3) / 4);
    }

    const media = await createMediaUpload({
      filename,
      mimeType,
      byteSize,
      dataUrl,
      title,
      category,
    });

    return NextResponse.json({
      success: true,
      message: 'Media uploaded and persisted to Supabase database successfully',
      media,
    });
  } catch (err: any) {
    console.error('Error in POST /api/media:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
