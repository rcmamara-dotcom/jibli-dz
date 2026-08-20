import React from 'react';
import { Screen } from '../types';

interface Props {
  screen: Screen;
  setScreen: (s: Screen) => void;
}

const TABS: [Screen, string, string][] = [
  ['home',       '✈️',  'Trajets disponibles'],
  ['parcels',    '📦',  'Colis à transporter'],
  ['add-trip',   '🗺️', 'Je voyage'],
  ['add-parcel', '➕',  'Envoyer un colis'],
];

export default function NavTabs({ screen, setScreen }: Props) {
  return (
    <nav className="nav-tabs-bar">
      <div className="container-xxl">
        <ul className="nav px-2 px-lg-3" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
          {TABS.map(([id, icon, label]) => (
            <li key={id} className="nav-item">
              <button
                className={'nav-link' + (screen === id ? ' active' : '')}
                onClick={() => { setScreen(id); window.scrollTo({ top: 0 }); }}
              >
                <span className="me-2">{icon}</span>{label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
