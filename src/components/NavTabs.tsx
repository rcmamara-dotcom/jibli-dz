import React from 'react';
import { Screen } from '../types';

interface Props {
  screen: Screen;
  setScreen: (s: Screen) => void;
}

const TABS: [Screen, string, string][] = [
  ['home', '🏠', 'Trajets'],
  ['parcels', '📦', 'Colis'],
  ['add-trip', '✈️', 'Je voyage'],
  ['add-parcel', '➕', 'Envoyer'],
];

export default function NavTabs({ screen, setScreen }: Props) {
  return (
    <nav className="nav-tabs">
      {TABS.map(([id, icon, label]) => (
        <button
          key={id}
          className={'tab-btn' + (screen === id ? ' active' : '')}
          onClick={() => { setScreen(id); window.scrollTo({ top: 0 }); }}
        >
          <span className="tab-icon">{icon}</span>{label}
        </button>
      ))}
    </nav>
  );
}
