import React, { useMemo, useState } from 'react';
import { Screen, Trip } from './types';
import { DEST_FILTERS } from './constants/locations';
import { useAppData } from './hooks/useAppData';
import { LangProvider, useLang } from './contexts/LangContext';
import Header from './components/Header';
import NavTabs from './components/NavTabs';
import TripCard from './components/TripCard';
import ParcelCard from './components/ParcelCard';
import TripModal from './components/TripModal';
import AddTrip from './components/AddTrip';
import AddParcel from './components/AddParcel';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';

const PAGE_SIZE = 20;

function getResetToken(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('reset');
}

function AppInner() {
  const { t } = useLang();
  const [screen, setScreen] = useState<Screen>('home');
  const [search, setSearch] = useState('');
  const [dest, setDest] = useState('all');
  const [tripModal, setTripModal] = useState<Trip | null>(null);
  const [authOpen, setAuthOpen] = useState(() => !!getResetToken());
  const [tripPage, setTripPage] = useState(1);
  const [parcelPage, setParcelPage] = useState(1);
  const resetToken = getResetToken();

  const {
    trips, parcels, userId, isAdmin, toast, showToast,
    canDelete, publishTrip, publishParcel, removeTrip, removeParcel, login, logout,
  } = useAppData();

  const isLoggedIn = userId !== null;
  const needLogin = !isLoggedIn;

  const filteredTrips = useMemo(() => {
    setTripPage(1);
    let list = [...trips];
    const s = search.toLowerCase();
    if (s) list = list.filter((t) => [t.from_city, t.to_city, t.name].some((v) => (v ?? '').toLowerCase().includes(s)));
    if (dest !== 'all') list = list.filter((t) => t.to_city === dest);
    return list.sort((a, b) => +new Date(a.date) - +new Date(b.date));
  }, [trips, search, dest]);

  const visibleTrips = useMemo(() => filteredTrips.slice(0, tripPage * PAGE_SIZE), [filteredTrips, tripPage]);
  const hasMoreTrips = visibleTrips.length < filteredTrips.length;

  const filteredParcels = useMemo(() => {
    setParcelPage(1);
    const s = search.toLowerCase();
    if (!s) return parcels;
    return parcels.filter((p) => [p.from_city, p.to_city, p.description].some((v) => (v ?? '').toLowerCase().includes(s)));
  }, [parcels, search]);

  const visibleParcels = useMemo(() => filteredParcels.slice(0, parcelPage * PAGE_SIZE), [filteredParcels, parcelPage]);
  const hasMoreParcels = visibleParcels.length < filteredParcels.length;

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
                  <h2>{t('heroTitle')}</h2>
                  <p className="mb-0">{t('heroDesc')}</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="row g-3 h-100">
                <div className="col-4 col-lg-12">
                  <div className="card border-0 shadow-sm text-center p-3 h-100">
                    <div className="stat-num">{trips.length}</div>
                    <div className="stat-label">{t('statsTrips')}</div>
                  </div>
                </div>
                <div className="col-4 col-lg-12">
                  <div className="card border-0 shadow-sm text-center p-3 h-100">
                    <div className="stat-num">{parcels.length}</div>
                    <div className="stat-label">{t('statsParcels')}</div>
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
                {d === 'all' ? t('filterAll') : '→ ' + d}
              </button>
            ))}
          </div>

          {/* Section title */}
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="section-title">{t('sectionTrips')}</div>
            <span className="badge rounded-pill" style={{ background: 'var(--green-bright)', fontSize: 13, padding: '4px 12px' }}>{visibleTrips.length}</span>
          </div>

          {filteredTrips.length === 0
            ? <div className="empty-state"><div className="icon">✈️</div><p>{t('emptyTrips').split('\\n').join('\n')}</p></div>
            : <>
                <div className="row g-3">
                  {visibleTrips.map((tr) => (
                    <div key={tr.id} className="col-12 col-md-6 col-xl-4">
                      <TripCard trip={tr} mine={canDelete(tr)} onOpen={() => setTripModal(tr)} onDelete={() => removeTrip(tr.id)} />
                    </div>
                  ))}
                </div>
                {hasMoreTrips && (
                  <div className="text-center mt-4">
                    <button className="btn btn-outline-secondary px-5" onClick={() => setTripPage((p) => p + 1)}>
                      {t('loadMore')} ({filteredTrips.length - visibleTrips.length} {t('remaining')})
                    </button>
                  </div>
                )}
              </>
          }
        </div>
      )}

      {screen === 'parcels' && (
        <div className="container-xxl py-4 px-3 px-lg-4">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="section-title">{t('sectionParcels')}</div>
            <span className="badge rounded-pill" style={{ background: 'var(--green-bright)', fontSize: 13, padding: '4px 12px' }}>{visibleParcels.length}</span>
          </div>
          <p className="text-muted mb-4" style={{ fontSize: 14 }}>{t('parcelsDesc')}</p>
          {filteredParcels.length === 0
            ? <div className="empty-state"><div className="icon">📦</div><p>{t('emptyParcels').split('\\n').join('\n')}</p></div>
            : <>
                <div className="row g-3">
                  {visibleParcels.map((p) => (
                    <div key={p.id} className="col-12 col-md-6 col-xl-4">
                      <ParcelCard parcel={p} mine={canDelete(p)} onDelete={() => removeParcel(p.id)} />
                    </div>
                  ))}
                </div>
                {hasMoreParcels && (
                  <div className="text-center mt-4">
                    <button className="btn btn-outline-secondary px-5" onClick={() => setParcelPage((p) => p + 1)}>
                      {t('loadMore')} ({filteredParcels.length - visibleParcels.length} {t('remaining')})
                    </button>
                  </div>
                )}
              </>
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
          onClose={() => {
            setAuthOpen(false);
            if (resetToken) {
              const url = new URL(window.location.href);
              url.searchParams.delete('reset');
              window.history.replaceState({}, '', url.toString());
            }
          }}
          onLogin={login}
          onLogout={logout}
          showToast={showToast}
          initialToken={resetToken}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AppInner />
    </LangProvider>
  );
}
