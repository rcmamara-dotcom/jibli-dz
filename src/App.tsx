import React, { useMemo, useState } from 'react';
import { Screen } from './types';
import { DEST_FILTERS } from './constants/locations';
import { useAppData } from './hooks/useAppData';
import Header from './components/Header';
import NavTabs from './components/NavTabs';
import TripCard from './components/TripCard';
import ParcelCard from './components/ParcelCard';
import TripModal from './components/TripModal';
import AddTrip from './components/AddTrip';
import AddParcel from './components/AddParcel';
import AuthModal from './components/AuthModal';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [search, setSearch] = useState('');
  const [dest, setDest] = useState('all');
  const [tripModal, setTripModal] = useState<import('./types').Trip | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const {
    mode, trips, parcels, user, toast, showToast,
    canDelete, publishTrip, publishParcel, removeTrip, removeParcel, logout,
  } = useAppData();

  const visibleTrips = useMemo(() => {
    let list = [...trips];
    const s = search.toLowerCase();
    if (s) list = list.filter((t) => [t.from, t.to, t.name].some((v) => (v || '').toLowerCase().includes(s)));
    if (dest !== 'all') list = list.filter((t) => t.to === dest);
    return list.sort((a, b) => +new Date(a.date) - +new Date(b.date));
  }, [trips, search, dest]);

  const visibleParcels = useMemo(() => {
    const s = search.toLowerCase();
    if (!s) return parcels;
    return parcels.filter((p) => [p.from, p.to, p.desc].some((v) => (v || '').toLowerCase().includes(s)));
  }, [parcels, search]);

  const needLogin = mode === 'cloud' && !user;

  const handleLogout = async () => {
    await logout();
    setAuthOpen(false);
  };

  return (
    <>
      <Header user={user} mode={mode} search={search} onSearch={setSearch} onAccount={() => setAuthOpen(true)} />

      {mode === 'cloud'
        ? <div className="mode-bar show cloud">🌐 Mode partagé — tout le monde voit les mêmes annonces</div>
        : <div className="mode-bar show local">🧪 Mode démo — données visibles sur ce navigateur uniquement</div>}

      <NavTabs screen={screen} setScreen={setScreen} />

      {screen === 'home' && (
        <div className="screen active">
          <div className="hero-banner">
            <div className="icon">🌍</div>
            <div>
              <h2>Trouvez un voyageur de confiance</h2>
              <p>Des particuliers font le trajet France ⇄ Algérie — ils transportent vos colis à prix réduit.</p>
            </div>
          </div>
          <div className="stats-row">
            <div className="stat-card"><div className="stat-num">{trips.length}</div><div className="stat-label">Trajets actifs</div></div>
            <div className="stat-card"><div className="stat-num">{parcels.length}</div><div className="stat-label">Colis en attente</div></div>
            <div className="stat-card"><div className="stat-num">🇩🇿</div><div className="stat-label">Destinations</div></div>
          </div>
          <div className="filter-row">
            {DEST_FILTERS.map((d) => (
              <button key={d} className={'chip' + (dest === d ? ' active' : '')} onClick={() => setDest(d)}>
                {d === 'all' ? 'Tous' : '→ ' + d}
              </button>
            ))}
          </div>
          <div className="section-title">
            Voyageurs disponibles <span className="badge">{visibleTrips.length}</span>
          </div>
          {visibleTrips.length === 0
            ? <div className="empty"><div className="empty-icon">✈️</div><p>Aucun trajet disponible.<br />Soyez le premier à publier !</p></div>
            : visibleTrips.map((t) => (
              <TripCard key={t.id} trip={t} mine={canDelete(t)} onOpen={() => setTripModal(t)} onDelete={() => removeTrip(t.id)} />
            ))}
        </div>
      )}

      {screen === 'parcels' && (
        <div className="screen active">
          <div className="section-title">Colis à transporter <span className="badge">{visibleParcels.length}</span></div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>Des gens cherchent un voyageur — contactez-les si vous faites le trajet !</p>
          {visibleParcels.length === 0
            ? <div className="empty"><div className="empty-icon">📦</div><p>Aucun colis publié.<br />Quelqu'un a besoin de vous !</p></div>
            : visibleParcels.map((p) => (
              <ParcelCard key={p.id} parcel={p} mine={canDelete(p)} onDelete={() => removeParcel(p.id)} />
            ))}
        </div>
      )}

      {screen === 'add-trip' && (
        <AddTrip
          needLogin={needLogin}
          onLogin={() => setAuthOpen(true)}
          onPublish={publishTrip}
          onNavigate={() => setScreen('home')}
        />
      )}

      {screen === 'add-parcel' && (
        <AddParcel
          needLogin={needLogin}
          onLogin={() => setAuthOpen(true)}
          onPublish={publishParcel}
          onNavigate={() => setScreen('parcels')}
        />
      )}

      {toast && <div className="toast show">{toast}</div>}

      {tripModal && (
        <TripModal
          trip={tripModal}
          canDelete={canDelete(tripModal)}
          onClose={() => setTripModal(null)}
          onDelete={() => removeTrip(tripModal.id, () => setTripModal(null))}
        />
      )}

      {authOpen && (
        <AuthModal mode={mode} user={user} onClose={() => setAuthOpen(false)} onLogout={handleLogout} showToast={showToast} />
      )}
    </>
  );
}
