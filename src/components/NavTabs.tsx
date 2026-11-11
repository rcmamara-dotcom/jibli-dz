import React from 'react';
import { Screen } from '../types';

interface Props {
  screen: Screen;
  setScreen: (s: Screen) => void;
  unreadMessages?: number;
  readonly?: boolean;
}

const TABS: [Screen, string, string, boolean?][] = [
  ['home',       '✈️',  'Trajets disponibles'],
  ['parcels',    '📦',  'Colis à transporter'],
  ['add-trip',   '🗺️', 'Je voyage',        true], // action uniquement
  ['add-parcel', '➕',  'Envoyer un colis', true], // action uniquement
  ['shipments',  '📍',  'Mes envois',       true], // action uniquement
  ['messages',   '💬',  'Messages',         true], // action uniquement
  ['pricing',    '💎',  'Abonnements'],
];

export default function NavTabs({ screen, setScreen, unreadMessages = 0, readonly = false }: Props) {
  const tabs = readonly ? TABS.filter(([,,,actionOnly]) => !actionOnly) : TABS;
  return (
    <nav className="nav-tabs-bar">
      <div className="container-xxl">
        <ul className="nav px-2 px-lg-3" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
          {tabs.map(([id, icon, label]) => (
            <li key={id} className="nav-item">
              <button
                className={'nav-link' + (screen === id ? ' active' : '')}
                onClick={() => { setScreen(id); window.scrollTo({ top: 0 }); }}
              >
                <span className="me-2">{icon}</span>{label}
                {id === 'messages' && unreadMessages > 0 && (
                  <span key={unreadMessages} className="tab-badge" aria-label={`${unreadMessages} non lu${unreadMessages > 1 ? 's' : ''}`}>
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
