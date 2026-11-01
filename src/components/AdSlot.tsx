import React, { useEffect } from 'react';

const CLIENT = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
const SLOT = import.meta.env.VITE_ADSENSE_SLOT as string | undefined;

export const ADS_ENABLED = !!(CLIENT && SLOT);

declare global {
  interface Window { adsbygoogle?: unknown[] }
}

// Rien n'est affiché tant que VITE_ADSENSE_CLIENT / VITE_ADSENSE_SLOT ne sont pas définis.
export default function AdSlot() {
  useEffect(() => {
    if (!CLIENT || !SLOT) return;
    if (!document.querySelector('script[data-adsense]')) {
      const s = document.createElement('script');
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`;
      s.dataset.adsense = '';
      document.head.appendChild(s);
    }
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // bloqueur de pub ou script pas encore prêt : on ignore
    }
  }, []);

  if (!CLIENT || !SLOT) return null;

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={CLIENT}
      data-ad-slot={SLOT}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
