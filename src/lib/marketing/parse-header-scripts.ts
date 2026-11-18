export interface ParsedMetaTag {
  name?: string;
  property?: string;
  content?: string;
  httpEquiv?: string;
  charSet?: string;
}

export interface ParsedScriptTag {
  id: string;
  src?: string;
  inlineCode?: string;
  async?: boolean;
  defer?: boolean;
}

export interface ParsedHeaderSnippets {
  metaTags: ParsedMetaTag[];
  scripts: ParsedScriptTag[];
}

function parseHtmlAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /([a-zA-Z0-9:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(attrString)) !== null) {
    const key = match[1].toLowerCase();
    const val = match[2] ?? match[3] ?? match[4] ?? 'true';
    attrs[key] = val;
  }
  return attrs;
}

/**
 * Safely extracts <meta> and <script> tags from admin-configured customHeaderScript
 * so they can be rendered as valid HTML (<meta> in <head> and next/script for scripts)
 * without injecting an invalid <div> inside <head> (which breaks Clarity DOM snapshots).
 */
export function parseCustomHeaderScripts(rawHtml: string | undefined | null): ParsedHeaderSnippets {
  if (!rawHtml || typeof rawHtml !== 'string' || !rawHtml.trim()) {
    return { metaTags: [], scripts: [] };
  }

  const trimmed = rawHtml.trim();
  const metaTags: ParsedMetaTag[] = [];
  const scripts: ParsedScriptTag[] = [];

  // 1. Extract <meta ...> tags
  const metaRegex = /<meta\b([^>]*?)\/?>/gi;
  let metaMatch: RegExpExecArray | null;
  while ((metaMatch = metaRegex.exec(trimmed)) !== null) {
    const attrs = parseHtmlAttributes(metaMatch[1] || '');
    metaTags.push({
      name: attrs.name,
      property: attrs.property,
      content: attrs.content,
      httpEquiv: attrs['http-equiv'],
      charSet: attrs.charset,
    });
  }

  // 2. Extract <script ...>...</script> blocks
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let scriptMatch: RegExpExecArray | null;
  let scriptIdx = 0;
  while ((scriptMatch = scriptRegex.exec(trimmed)) !== null) {
    const attrs = parseHtmlAttributes(scriptMatch[1] || '');
    const inlineCode = (scriptMatch[2] || '').trim();
    const src = attrs.src?.trim();

    if (src || inlineCode) {
      scripts.push({
        id: attrs.id || `pnr-custom-header-script-${scriptIdx++}`,
        src: src || undefined,
        inlineCode: inlineCode || undefined,
        async: 'async' in attrs,
        defer: 'defer' in attrs,
      });
    }
  }

  // 3. Fallback: if admin pasted raw JS without wrapping <script> tags (and no HTML tags)
  if (scripts.length === 0 && metaTags.length === 0 && !trimmed.startsWith('<')) {
    scripts.push({
      id: 'pnr-custom-header-script-raw',
      inlineCode: trimmed,
    });
  }

  return { metaTags, scripts };
}
