import React, { useMemo, useState } from 'react';
import { Screen, Trip } from './types';
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
import AdminPanel from './components/AdminPanel';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [search, setSearch] = useState('');
  const [dest, setDest] = useState('all');
  const [tripModal, setTripModal] = useState<Trip | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const {
    trips, parcels, userId, isAdmin, toast, showToast,
    canDelete, publishTrip, publishParcel, removeTrip, removeParcel, login, logout,
  } = useAppData();

  const isLoggedIn = userId !== null;
  const needLogin = !isLoggedIn;

  const visibleTrips = useMemo(() => {
    let list = [...trips];
    const s = search.toLowerCase();
    if (s) list = list.filter((t) => [t.from_city, t.to_city, t.name].some((v) => (v ?? '').toLowerCase().includes(s)));
    if (dest !== 'all') list = list.filter((t) => t.to_city === dest);
    return list.sort((a, b) => +new Date(a.date) - +new Date(b.date));
  }, [trips, search, dest]);

  const visibleParcels = useMemo(() => {
    const s = search.toLowerCase();
    if (!s) return parcels;
    return parcels.filter((p) => [p.from_city, p.to_city, p.description].some((v) => (v ?? '').toLowerCase().includes(s)));
  }, [parcels, search]);

  return (
    <>
      <Header isLoggedIn={isLoggedIn} isAdmin={isAdmin} search={search} onSearch={setSearch} onAccount={() => setAuthOpen(true)} onAdmin={() => setScreen('admin')} />
      <NavTabs screen={screen} setScreen={setScreen} />

      {screen === 'home' && (
        <div className="container-xxl py-4 px-3 px-lg-4">
          {/* Hero + Stats */}
          <div className="row g-4 mb-4">
            <div className="col-lg-8">
              <div className="hero-banner d-flex align-items-center gap-4 h-100">
                <div className="hero-icon">🌍</div>
                <div>
                  <h2>Trouvez un voyageur de confiance</h2>
                  <p className="mb-0">Des particuliers font le trajet France ⇄ Algérie — ils transportent vos colis à prix réduit. Contactez-les directement sur WhatsApp.</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="row g-3 h-100">
                <div className="col-4 col-lg-12">
                  <div className="card border-0 shadow-sm text-center p-3 h-100">
                    <div className="stat-num">{trips.length}</div>
                    <div className="stat-label">Trajets actifs</div>
                  </div>
                </div>
                <div className="col-4 col-lg-12">
                  <div className="card border-0 shadow-sm text-center p-3 h-100">
                    <div className="stat-num">{parcels.length}</div>
                    <div className="stat-label">Colis en attente</div>
                  </div>
                </div>
                <div className="col-4 col-lg-12">
                  <div className="card border-0 shadow-sm text-center p-3 h-100">
                    <div className="stat-num">🇩🇿</div>
                    <div className="stat-label">Algérie · France</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter chips */}
          <div className="d-flex flex-wrap gap-2 mb-4">
            {DEST_FILTERS.map((d) => (
              <button key={d} className={'chip' + (dest === d ? ' active' : '')} onClick={() => setDest(d)}>
                {d === 'all' ? 'Toutes destinations' : '→ ' + d}
              </button>
            ))}
          </div>

          {/* Section title */}
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="section-title">Voyageurs disponibles</div>
            <span className="badge rounded-pill" style={{ background: 'var(--green-bright)', fontSize: 13, padding: '4px 12px' }}>{visibleTrips.length}</span>
          </div>

          {/* Cards grid */}
          {visibleTrips.length === 0
            ? <div className="empty-state"><div className="icon">✈️</div><p>Aucun trajet disponible.<br />Soyez le premier à publier !</p></div>
            : <div className="row g-3">
                {visibleTrips.map((t) => (
                  <div key={t.id} className="col-12 col-md-6 col-xl-4">
                    <TripCard trip={t} mine={canDelete(t)} onOpen={() => setTripModal(t)} onDelete={() => removeTrip(t.id)} />
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {screen === 'parcels' && (
        <div className="container-xxl py-4 px-3 px-lg-4">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="section-title">Colis à transporter</div>
            <span className="badge rounded-pill" style={{ background: 'var(--green-bright)', fontSize: 13, padding: '4px 12px' }}>{visibleParcels.length}</span>
          </div>
          <p className="text-muted mb-4" style={{ fontSize: 14 }}>Des gens cherchent un voyageur — contactez-les si vous faites le trajet !</p>
          {visibleParcels.length === 0
            ? <div className="empty-state"><div className="icon">📦</div><p>Aucun colis publié.<br />Quelqu'un a besoin de vous !</p></div>
            : <div className="row g-3">
                {visibleParcels.map((p) => (
                  <div key={p.id} className="col-12 col-md-6 col-xl-4">
                    <ParcelCard parcel={p} mine={canDelete(p)} onDelete={() => removeParcel(p.id)} />
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {screen === 'add-trip' && (
        <AddTrip needLogin={needLogin} onLogin={() => setAuthOpen(true)} onPublish={publishTrip} onNavigate={() => setScreen('home')} />
      )}

      {screen === 'add-parcel' && (
        <AddParcel needLogin={needLogin} onLogin={() => setAuthOpen(true)} onPublish={publishParcel} onNavigate={() => setScreen('parcels')} />
      )}

      {screen === 'admin' && isAdmin && <AdminPanel />}

      {toast && <div className="app-toast show">{toast}</div>}

      {tripModal && (
        <TripModal
          trip={tripModal}
          userId={userId}
          canDelete={canDelete(tripModal)}
          onClose={() => setTripModal(null)}
          onDelete={() => removeTrip(tripModal.id, () => setTripModal(null))}
          onReviewPosted={(updated) => setTripModal((prev) => prev ? { ...prev, ...updated } : null)}
        />
      )}

      {authOpen && (
        <AuthModal
          isLoggedIn={isLoggedIn}
          onClose={() => setAuthOpen(false)}
          onLogin={login}
          onLogout={logout}
          showToast={showToast}
        />
      )}
    </>
  );
}
