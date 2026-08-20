import React from 'react';
import { useLang } from '../contexts/LangContext';
import type { Lang } from '../i18n/translations';

const LANG_OPTIONS: { value: Lang; label: string; flag: string }[] = [
  { value: 'fr', label: 'FR', flag: '🇫🇷' },
  { value: 'ar', label: 'عر', flag: '🇩🇿' },
  { value: 'en', label: 'EN', flag: '🇬🇧' },
];

interface Props {
  isLoggedIn: boolean;
  isAdmin: boolean;
  search: string;
  onSearch: (v: string) => void;
  onAccount: () => void;
  onAdmin: () => void;
}

export default function Header({ isLoggedIn, isAdmin, search, onSearch, onAccount, onAdmin }: Props) {
  const { lang, setLang, t } = useLang();

  const langBtnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
    color: '#fff',
    border: active ? '1.5px solid rgba(255,255,255,0.6)' : '1.5px solid transparent',
    borderRadius: 16,
    fontSize: 12,
    fontWeight: 700,
    padding: '5px 8px',
    cursor: 'pointer',
    transition: 'all .15s',
    lineHeight: 1,
  });

  return (
    <header className="header sticky-top">
      {/* Row 1: logo + right actions */}
      <div className="container-xxl d-flex align-items-center gap-2 px-3 px-lg-4 header-row1">
        <div className="logo d-flex align-items-center gap-2 flex-shrink-0">
          <div className="logo-icon">📦</div>
          <div className="logo-text">
            <strong>JIBLI DZ</strong>
            <span className="d-none d-sm-block">France ⇄ Algérie · جيبلي</span>
          </div>
        </div>

        {/* Search — hidden on xs, visible from sm */}
        <div className="input-group flex-grow-1 d-none d-sm-flex" style={{ maxWidth: 460 }}>
          <input
            type="text"
            className="form-control search-bar-input"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
          <button className="btn search-bar-btn px-3">🔍</button>
        </div>

        <div className="ms-auto d-flex align-items-center gap-1 flex-shrink-0">
          {/* Language switcher */}
          <div className="d-flex gap-1">
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLang(opt.value)}
                title={opt.flag + ' ' + opt.label}
                style={langBtnStyle(lang === opt.value)}
              >
                <span>{opt.flag}</span>
                <span className="d-none d-md-inline"> {opt.label}</span>
              </button>
            ))}
          </div>

          {isAdmin && (
            <button className="btn d-none d-sm-inline-flex flex-shrink-0" onClick={onAdmin}
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 20, fontSize: 13, fontWeight: 600, padding: '7px 12px' }}>
              {t('admin')}
            </button>
          )}
          <button className="btn account-btn flex-shrink-0" onClick={onAccount}>
            {isLoggedIn ? '👤' : '🔑'}
            <span className="d-none d-sm-inline"> {isLoggedIn ? t('myAccount') : t('signIn')}</span>
          </button>
        </div>
      </div>

      {/* Row 2: search bar — only on xs screens */}
      <div className="container-xxl d-sm-none px-3 pb-2">
        <div className="input-group">
          <input
            type="text"
            className="form-control search-bar-input"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
          <button className="btn search-bar-btn px-3">🔍</button>
        </div>
      </div>
    </header>
  );
}
