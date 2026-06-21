import React from 'react';
import { User } from 'firebase/auth';
import { Mode } from '../types';

interface Props {
  user: User | null;
  mode: Mode;
  search: string;
  onSearch: (v: string) => void;
  onAccount: () => void;
}

export default function Header({ user, mode, search, onSearch, onAccount }: Props) {
  const label = user ? '👤 ' + (user.email || '').split('@')[0].slice(0, 12) : 'Se connecter';
  return (
    <header className="header">
      <div className="header-top">
        <div className="logo">
          <div className="logo-icon">📦</div>
          <div className="logo-text">
            <strong>JIBLI DZ</strong>
            <span>France ⇄ Algérie · جيبلي</span>
          </div>
        </div>
        {mode === 'cloud' && <button className="account-btn" onClick={onAccount}>{label}</button>}
      </div>
      <div className="search-bar">
        <input type="text" placeholder="Ex: Paris, Alger, Oran…" value={search} onChange={(e) => onSearch(e.target.value)} />
        <button onClick={() => undefined}>🔍</button>
      </div>
    </header>
  );
}
