import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const KEY = 'jibli_theme';

export function getTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* stockage indisponible */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Bootstrap 5.3 bascule ses couleurs avec data-bs-theme ; styles.css suit le même attribut.
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.bsTheme = theme;
}

const listeners = new Set<(t: Theme) => void>();

export function setTheme(theme: Theme): void {
  try { localStorage.setItem(KEY, theme); } catch { /* ignore */ }
  applyTheme(theme);
  listeners.forEach((l) => l(theme));
}

// Garde l'interrupteur des Paramètres et le bouton du header synchronisés
export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setState] = useState<Theme>(getTheme);
  useEffect(() => {
    listeners.add(setState);
    return () => { listeners.delete(setState); };
  }, []);
  return [theme, setTheme];
}
