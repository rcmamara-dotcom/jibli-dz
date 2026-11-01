import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Lang } from '../i18n/translations';
import { TRANSLATIONS } from '../i18n/translations';

const STORAGE_KEY = 'jibli_lang';

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof TRANSLATIONS.fr) => string;
}

const LangContext = createContext<LangCtx>({
  lang: 'fr',
  setLang: () => {},
  t: (k) => k,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem(STORAGE_KEY) as Lang) ?? 'fr'
  );

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const t = (key: keyof typeof TRANSLATIONS.fr): string =>
    TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.fr[key] ?? key;

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
