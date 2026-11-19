/**
 * URL-friendly slug generator for products and categories.
 * Converts names like "Dutch Chocolate Cake (1/2 KG)" to "dutch-chocolate-cake-1-2-kg"
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, '-and-')
    .replace(/[/\\+]/g, '-')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Finds a product matching a given slug from a list of products.
 */
export function findProductBySlug<T extends { name: string; slug?: string }>(
  products: T[],
  slug: string
): T | undefined {
  if (!slug) return undefined;
  const normalizedTarget = slug.toLowerCase().trim();
  return products.find(
    (p) => (p.slug && p.slug.toLowerCase() === normalizedTarget) || slugify(p.name) === normalizedTarget
  );
}
