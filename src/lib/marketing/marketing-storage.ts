import fs from 'fs';
import path from 'path';
import { orderRepository } from '@/lib/db/order-repository';

export interface MarketingTagsConfig {
  globalMetaPixelId: string;
  globalGoogleAdsId: string;
  globalGtmId: string;
  tiktokPixelId: string;
  snapchatPixelId: string;
  metaCapiEnabled: boolean;
  metaCapiAccessToken: string;
  customHeaderScript: string;
  [key: string]: unknown;
}

const CONFIG_FILE_PATH = path.join(process.cwd(), 'src/lib/data/marketing-tags.json');

const DEFAULT_MARKETING_TAGS: MarketingTagsConfig = {
  globalMetaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.META_PIXEL_ID || '',
  globalGoogleAdsId: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || '',
  globalGtmId: process.env.NEXT_PUBLIC_GTM_ID || '',
  tiktokPixelId: '',
  snapchatPixelId: '',
  metaCapiEnabled: true,
  metaCapiAccessToken: process.env.META_CAPI_ACCESS_TOKEN || '',
  customHeaderScript: '',
};

/**
 * Reads marketing tags from disk fallback file (src/lib/data/marketing-tags.json)
 */
export function getPersistedMarketingTags(
  overrideConfig?: Partial<MarketingTagsConfig>
): MarketingTagsConfig {
  let fileConfig: Partial<MarketingTagsConfig> = {};
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      fileConfig = JSON.parse(raw);
    }
  } catch (err: any) {
    console.warn('[MarketingStorage] Failed to read marketing-tags.json:', err.message);
  }

  return {
    ...DEFAULT_MARKETING_TAGS,
    ...fileConfig,
    ...overrideConfig,
  };
}

/**
 * Saves marketing tags synchronously to disk file and updates environment cache
 */
export function savePersistedMarketingTags(
  updates: Partial<MarketingTagsConfig>,
  current?: Partial<MarketingTagsConfig>
): MarketingTagsConfig {
  const merged: MarketingTagsConfig = {
    ...DEFAULT_MARKETING_TAGS,
    ...getPersistedMarketingTags(),
    ...current,
    ...updates,
  };

  try {
    const dir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(merged, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn('[MarketingStorage] Failed to write marketing-tags.json:', err.message);
  }

  return merged;
}

/**
 * Saves marketing tags asynchronously to disk file AND awaits PostgreSQL persistence
 */
export async function savePersistedMarketingTagsAsync(
  updates: Partial<MarketingTagsConfig>,
  current?: Partial<MarketingTagsConfig>
): Promise<MarketingTagsConfig> {
  const merged = savePersistedMarketingTags(updates, current);

  try {
    await orderRepository.saveMarketingTags(merged);
  } catch (err: any) {
    console.warn('[MarketingStorage] Failed to save marketing tags to database:', err.message);
  }

  return merged;
}

/**
 * Reads marketing tags from PostgreSQL first, falling back to disk file
 */
export async function getPersistedMarketingTagsAsync(): Promise<MarketingTagsConfig> {
  let dbTags: Record<string, unknown> | null = null;
  try {
    dbTags = await orderRepository.getMarketingTags();
  } catch (err: any) {
    console.warn('[MarketingStorage] Failed to load marketing tags from database:', err.message);
  }

  return getPersistedMarketingTags(dbTags as Partial<MarketingTagsConfig> | undefined);
}
