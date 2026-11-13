/**
 * Utility functions for Meta Pixel and conversion tracking
 */

export function extractMetaPixelId(input?: string): string {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  // Direct numeric pixel ID (typically 12-16 digits)
  if (/^\d{10,20}$/.test(trimmed)) {
    return trimmed;
  }
  // Check fbq('init', '1234567890') or fbq("init", "1234567890")
  const initMatch = trimmed.match(/fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d+)['"]/i);
  if (initMatch && initMatch[1]) {
    return initMatch[1];
  }
  // Check id=1234567890 or tr?id=1234567890
  const idMatch = trimmed.match(/[?&]id=(\d+)/i);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }
  const trMatch = trimmed.match(/tr\?id=(\d+)/i);
  if (trMatch && trMatch[1]) {
    return trMatch[1];
  }
  // Check any 12-18 digit sequence
  const digitMatch = trimmed.match(/\b\d{12,18}\b/);
  if (digitMatch && digitMatch[0]) {
    return digitMatch[0];
  }
  return trimmed;
}
