import React from 'react';

interface Props {
  isLoggedIn: boolean;
  search: string;
  onSearch: (v: string) => void;
  onAccount: () => void;
}

export default function Header({ isLoggedIn, search, onSearch, onAccount }: Props) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo">
          <div className="logo-icon">📦</div>
          <div className="logo-text">
            <strong>JIBLI DZ</strong>
            <span>France ⇄ Algérie · جيبلي</span>
          </div>
        </div>
        <div className="search-bar">
          <input type="text" placeholder="Rechercher ville, voyageur…" value={search} onChange={(e) => onSearch(e.target.value)} />
          <button>🔍</button>
        </div>
        <button className="account-btn" onClick={onAccount}>
          {isLoggedIn ? '👤 Mon compte' : 'Se connecter'}
        </button>
      </div>
    </header>
  );
}
