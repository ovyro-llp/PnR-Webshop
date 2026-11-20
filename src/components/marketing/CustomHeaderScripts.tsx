'use client';

import React, { useEffect } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { ParsedScriptTag } from '@/lib/marketing/parse-header-scripts';

interface CustomHeaderScriptsProps {
  scripts: ParsedScriptTag[];
}

/**
 * Renders custom marketing and analytics scripts (such as Microsoft Clarity, Hotjar, etc.)
 * exclusively on customer-facing pages.
 *
 * All `/admin` and `/admin/*` routes are strictly excluded:
 * 1. Script tags are not injected when on /admin routes.
 * 2. If a customer session already loaded Clarity and subsequently navigates to /admin,
 *    Clarity tracking is immediately stopped and consent is revoked.
 */
export function CustomHeaderScripts({ scripts }: CustomHeaderScriptsProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  // Immediately halt tracking and revoke consent if navigating into any /admin/* route
  useEffect(() => {
    if (isAdmin && typeof window !== 'undefined') {
      try {
        const win = window as unknown as { clarity?: (...args: unknown[]) => void };
        if (typeof win.clarity === 'function') {
          win.clarity('stop');
          win.clarity('consent', false);
        }
      } catch (err) {
        console.warn('[Clarity] Failed to halt tracking on admin route:', err);
      }
    }
  }, [isAdmin, pathname]);

  // NEVER render or inject custom tracking scripts on /admin/* pages
  if (isAdmin || !scripts || scripts.length === 0) {
    return null;
  }

  return (
    <>
      {scripts.map((scr) =>
        scr.src ? (
          <Script
            key={scr.id}
            id={scr.id}
            src={scr.src}
            strategy="afterInteractive"
          />
        ) : scr.inlineCode ? (
          <Script
            key={scr.id}
            id={scr.id}
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: scr.inlineCode }}
          />
        ) : null
      )}
    </>
  );
}
