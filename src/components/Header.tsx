import React from 'react';

interface Props {
  isLoggedIn: boolean;
  search: string;
  onSearch: (v: string) => void;
  onAccount: () => void;
}

export default function Header({ isLoggedIn, search, onSearch, onAccount }: Props) {
  return (
    <header className="header sticky-top">
      <div className="container-xxl d-flex align-items-center gap-3 py-2 px-3 px-lg-4" style={{ height: 62 }}>
        <div className="logo d-flex align-items-center gap-2 flex-shrink-0">
          <div className="logo-icon">📦</div>
          <div className="logo-text">
            <strong>JIBLI DZ</strong>
            <span className="d-none d-sm-block">France ⇄ Algérie · جيبلي</span>
          </div>
        </div>
        <div className="input-group flex-grow-1" style={{ maxWidth: 460 }}>
          <input
            type="text"
            className="form-control search-bar-input"
            placeholder="Rechercher ville, voyageur…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
          <button className="btn search-bar-btn px-3">🔍</button>
        </div>
        <button className="btn account-btn flex-shrink-0 ms-auto" onClick={onAccount}>
          {isLoggedIn ? '👤 Mon compte' : 'Se connecter'}
        </button>
      </div>
    </header>
  );
}
