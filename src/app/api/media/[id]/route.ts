import { NextRequest, NextResponse } from 'next/server';
import { getMediaUploadById, deleteMediaUpload } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import mediaStaticMap from '@/lib/data/media-static-map.json';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const media = await getMediaUploadById(id);

    if (media && media.dataUrl) {
      // Extract base64 part
      const dataUrl = media.dataUrl;
      const base64Index = dataUrl.indexOf('base64,');
      if (base64Index !== -1) {
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
      }
    }

    // Static fallback lookup for local product images
    const staticRelPath = (mediaStaticMap as Record<string, string>)[id];
    if (staticRelPath) {
      const fullPath = path.join(process.cwd(), 'public', staticRelPath);
      if (fs.existsSync(fullPath)) {
        const fileBuffer = fs.readFileSync(fullPath);
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'image/jpeg',
            'Content-Length': fileBuffer.length.toString(),
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    }

    return new NextResponse('Media asset not found', { status: 404 });
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
