import { NextRequest, NextResponse } from 'next/server';
import { getMediaUploadById, deleteMediaUpload } from '@/lib/db';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const media = await getMediaUploadById(id);

    if (!media) {
      return new NextResponse('Media asset not found', { status: 404 });
    }

    // Extract base64 part
    const dataUrl = media.dataUrl;
    const base64Index = dataUrl.indexOf('base64,');
    if (base64Index === -1) {
      return new NextResponse('Invalid media format stored', { status: 500 });
    }

    const base64Data = dataUrl.slice(base64Index + 7);
    const buffer = Buffer.from(base64Data, 'base64');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': media.mimeType || 'image/jpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    console.error('Error serving media [id]:', err.message);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const success = await deleteMediaUpload(id);

    if (!success) {
      return NextResponse.json({ success: false, error: 'Asset not found or failed to delete' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Media asset deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting media [id]:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
