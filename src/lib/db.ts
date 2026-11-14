import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { MediaUpload } from '@/types';
import { ensureCoreTables } from '@/lib/db/init-schema';

export { ensureCoreTables };

function getLocalCakeMedia(): MediaUpload[] {
  try {
    const dir = path.join(process.cwd(), 'public/images/cakes');
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.webp'));
    return files.map((f) => {
      const stat = fs.statSync(path.join(dir, f));
      const cleanName = f
        .replace(/\.webp$/, '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        id: `local-cake-${f.replace(/\.webp$/, '')}`,
        filename: f,
        mimeType: 'image/webp',
        byteSize: stat.size,
        url: `/images/cakes/${f}`,
        title: `${cleanName} (Celebration Cake)`,
        altText: cleanName,
        category: 'cakes',
        createdAt: stat.birthtime ? new Date(stat.birthtime).toISOString() : new Date().toISOString(),
        updatedAt: stat.mtime ? new Date(stat.mtime).toISOString() : new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __PNR_PG_POOL__: Pool | undefined;
  // eslint-disable-next-line no-var
  var __PNR_PG_INIT_PROMISE__: Promise<void> | undefined;
}

export function getDbPool(): Pool {
  if (!globalThis.__PNR_PG_POOL__) {
    const connectionString = (process.env.DATABASE_URL || '').trim();

    const isRailwayPublicProxy =
      connectionString.includes('rlwy.net') ||
      connectionString.includes('railway.app');

    const isSslRequired =
      isRailwayPublicProxy ||
      (process.env.NODE_ENV === 'production' && !connectionString.includes('railway.internal'));

    globalThis.__PNR_PG_POOL__ = new Pool({
      connectionString: connectionString || undefined,
      ssl: isSslRequired ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
    });

    globalThis.__PNR_PG_POOL__.on('error', (err) => {
      console.warn('[Railway PostgreSQL Pool Warning]:', err.message);
    });
  }
  return globalThis.__PNR_PG_POOL__;
}

export async function ensureMediaTable(): Promise<void> {
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
    return;
  }

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
        console.warn('[Railway PostgreSQL ensureMediaTable Warning]:', err.message);
      }
    })();
  }
  return globalThis.__PNR_PG_INIT_PROMISE__;
}

export async function getMediaUploads(limit = 100): Promise<MediaUpload[]> {
  const localCakes = getLocalCakeMedia();
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
    return localCakes.slice(0, limit);
  }
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

    const dbMedia: MediaUpload[] = res.rows.map((row) => ({
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

    return [...dbMedia, ...localCakes].slice(0, limit);
  } catch (err: any) {
    console.warn('[Railway PostgreSQL getMediaUploads Warning]:', err.message);
    return localCakes.slice(0, limit);
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
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
    return null;
  }
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
    console.warn('[Railway PostgreSQL getMediaUploadById Warning]:', err.message);
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

  try {
    const res = await pool.query(
      `INSERT INTO public.media_uploads (
        filename, mime_type, byte_size, data_url, url, title, alt_text, category, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, '', $5, $6, $7, NOW(), NOW())
      RETURNING id, filename, mime_type, byte_size, title, alt_text, category, created_at, updated_at`,
      [
        data.filename,
        data.mimeType,
        data.byteSize,
        data.dataUrl,
        data.title || null,
        data.altText || null,
        data.category || 'bakery',
      ]
    );

    const row = res.rows[0];
    const generatedUrl = `/api/media/${row.id}`;

    // Update with generated URL
    await pool.query(
      `UPDATE public.media_uploads SET url = $1, updated_at = NOW() WHERE id = $2`,
      [generatedUrl, row.id]
    );

    return {
      id: row.id,
      filename: row.filename,
      mimeType: row.mime_type,
      byteSize: row.byte_size,
      url: generatedUrl,
      title: row.title,
      altText: row.alt_text,
      category: row.category,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  } catch (err: any) {
    console.warn('[Railway PostgreSQL createMediaUpload Warning, returning mock]:', err.message);
    const mockId = `media-${Date.now()}`;
    return {
      id: mockId,
      filename: data.filename,
      mimeType: data.mimeType,
      byteSize: data.byteSize,
      url: data.dataUrl,
      title: data.title,
      altText: data.altText,
      category: data.category || 'bakery',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function deleteMediaUpload(id: string): Promise<boolean> {
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
    return true;
  }
  await ensureMediaTable();
  const pool = getDbPool();
  try {
    const res = await pool.query(
      `DELETE FROM public.media_uploads WHERE id = $1 RETURNING id`,
      [id]
    );
    return res.rows.length > 0;
  } catch (err: any) {
    console.warn('[Railway PostgreSQL deleteMediaUpload Warning]:', err.message);
    return false;
  }
}
