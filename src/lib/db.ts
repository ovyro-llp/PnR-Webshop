import { Pool } from 'pg';
import { MediaUpload } from '@/types';

// PostgreSQL pooler connection URL
const rawUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres.rfkzjxbasckvtipouclf:24Hrushi%4002@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';

// Ensure special characters in password are properly URL encoded if not already
function getSanitizedDbUrl(url: string): string {
  if (url.includes('24Hrushi@02')) {
    return url.replace('24Hrushi@02', '24Hrushi%4002');
  }
  return url;
}

declare global {
  // eslint-disable-next-line no-var
  var __PNR_PG_POOL__: Pool | undefined;
  // eslint-disable-next-line no-var
  var __PNR_PG_INIT_PROMISE__: Promise<void> | undefined;
}

export function getDbPool(): Pool {
  if (!globalThis.__PNR_PG_POOL__) {
    const connectionString = getSanitizedDbUrl(rawUrl);
    globalThis.__PNR_PG_POOL__ = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    globalThis.__PNR_PG_POOL__.on('error', (err) => {
      console.error('[PostgreSQL DB Pool Error]:', err.message);
    });
  }
  return globalThis.__PNR_PG_POOL__;
}

export async function ensureMediaTable(): Promise<void> {
  if (!globalThis.__PNR_PG_INIT_PROMISE__) {
    globalThis.__PNR_PG_INIT_PROMISE__ = (async () => {
      try {
        const pool = getDbPool();
        await pool.query(`
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

          CREATE TABLE IF NOT EXISTS public.media_uploads (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            filename VARCHAR(255) NOT NULL,
            mime_type VARCHAR(100) NOT NULL,
            byte_size INTEGER NOT NULL,
            data_url TEXT NOT NULL,
            url TEXT NOT NULL,
            title VARCHAR(255),
            alt_text TEXT,
            category VARCHAR(50) DEFAULT 'bakery',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_media_uploads_created_at ON public.media_uploads(created_at DESC);
          CREATE INDEX IF NOT EXISTS idx_media_uploads_category ON public.media_uploads(category);
        `);
      } catch (err: any) {
        console.error('[PostgreSQL ensureMediaTable Error]:', err.message);
      }
    })();
  }
  return globalThis.__PNR_PG_INIT_PROMISE__;
}

export async function getMediaUploads(limit = 50): Promise<MediaUpload[]> {
  await ensureMediaTable();
  const pool = getDbPool();
  try {
    const res = await pool.query(
      `SELECT id, filename, mime_type, byte_size, url, title, alt_text, category, created_at, updated_at
       FROM public.media_uploads
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    return res.rows.map((row) => ({
      id: row.id,
      filename: row.filename,
      mimeType: row.mime_type,
      byteSize: row.byte_size,
      url: row.url || `/api/media/${row.id}`,
      title: row.title,
      altText: row.alt_text,
      category: row.category,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    }));
  } catch (err: any) {
    console.error('[PostgreSQL getMediaUploads Error]:', err.message);
    return [];
  }
}

export async function getMediaUploadById(id: string): Promise<{
  id: string;
  filename: string;
  mimeType: string;
  byteSize: number;
  dataUrl: string;
  url: string;
} | null> {
  await ensureMediaTable();
  const pool = getDbPool();
  try {
    const res = await pool.query(
      `SELECT id, filename, mime_type, byte_size, data_url, url
       FROM public.media_uploads
       WHERE id = $1`,
      [id]
    );

    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      filename: row.filename,
      mimeType: row.mime_type,
      byteSize: row.byte_size,
      dataUrl: row.data_url,
      url: row.url || `/api/media/${row.id}`,
    };
  } catch (err: any) {
    console.error('[PostgreSQL getMediaUploadById Error]:', err.message);
    return null;
  }
}

export async function createMediaUpload(data: {
  filename: string;
  mimeType: string;
  byteSize: number;
  dataUrl: string;
  title?: string;
  altText?: string;
  category?: string;
}): Promise<MediaUpload> {
  await ensureMediaTable();
  const pool = getDbPool();

  // Generate temporary id to establish serving url
  const res = await pool.query(
    `INSERT INTO public.media_uploads (filename, mime_type, byte_size, data_url, url, title, alt_text, category)
     VALUES ($1, $2, $3, $4, '', $5, $6, $7)
     RETURNING id, filename, mime_type, byte_size, title, alt_text, category, created_at, updated_at`,
    [
      data.filename,
      data.mimeType,
      data.byteSize,
      data.dataUrl,
      data.title || data.filename,
      data.altText || data.filename,
      data.category || 'bakery',
    ]
  );

  const row = res.rows[0];
  const publicUrl = `/api/media/${row.id}`;

  await pool.query(`UPDATE public.media_uploads SET url = $1 WHERE id = $2`, [publicUrl, row.id]);

  return {
    id: row.id,
    filename: row.filename,
    mimeType: row.mime_type,
    byteSize: row.byte_size,
    dataUrl: data.dataUrl,
    url: publicUrl,
    title: row.title,
    altText: row.alt_text,
    category: row.category,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function deleteMediaUpload(id: string): Promise<boolean> {
  await ensureMediaTable();
  const pool = getDbPool();
  try {
    const res = await pool.query(`DELETE FROM public.media_uploads WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  } catch (err: any) {
    console.error('[PostgreSQL deleteMediaUpload Error]:', err.message);
    return false;
  }
}
