import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { GoService } from './services/GoService';
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
import AdSlot, { ADS_ENABLED } from './components/AdSlot';
import Pricing from './components/Pricing';
import Settings from './components/Settings';
import Shipments from './components/Shipments';
import Messaging from './components/Messaging';
import { DEMO_PARCELS, DEMO_TRIPS } from './mocks/demo';
import { PARCEL_TYPE_LABELS } from './constants/parcelTypes';
import { ParcelType } from './types';

const READONLY_MODE = true; // Site en développement — lecture seule (sauf admins)

const PAGE_SIZE = 20;
const AD_EVERY = 6;

const showAdAfter = (i: number) => ADS_ENABLED && (i + 1) % AD_EVERY === 0;

function getResetToken(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('reset');
}

function getPaymentStatus(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('payment');
}

function getSubscriptionStatus(): { status: string | null; plan: string | null } {
  const params = new URLSearchParams(window.location.search);
  return { status: params.get('subscription'), plan: params.get('plan') };
}

function cleanUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('payment');
  url.searchParams.delete('session_id');
  url.searchParams.delete('subscription');
  url.searchParams.delete('plan');
  window.history.replaceState({}, '', url.toString());
}

function AppInner() {
  const { t, lang } = useLang();
  const [screen, setScreen] = useState<Screen>('home');
  const [search, setSearch] = useState('');
  const [dest, setDest] = useState('all');
  const [tripModal, setTripModal] = useState<Trip | null>(null);
  const [authOpen, setAuthOpen] = useState(() => !!getResetToken());
  const [tripPage, setTripPage] = useState(1);
  const [parcelPage, setParcelPage] = useState(1);
  const resetToken = getResetToken();

  const {
    trips, parcels, userId, isAdmin, role, toast, showToast,
    canDelete, publishTrip, publishParcel, removeTrip, removeParcel, login, logout,
  } = useAppData();

  // Handle Stripe redirect
  React.useEffect(() => {
    const payment = getPaymentStatus();
    const { status: subStatus, plan } = getSubscriptionStatus();
    if (payment === 'success') {
      showToast('✅ Paiement confirmé ! Votre annonce est en ligne.');
      cleanUrl();
    } else if (payment === 'cancelled') {
      showToast('❌ Paiement annulé.');
      cleanUrl();
    } else if (subStatus === 'success') {
      showToast(`✅ Abonnement ${plan ?? ''} activé !`);
      setScreen('pricing');
      cleanUrl();
    } else if (subStatus === 'cancelled') {
      showToast('❌ Abonnement annulé.');
      cleanUrl();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoggedIn = userId !== null;
  const needLogin = !isLoggedIn;
  const readonly = READONLY_MODE && !isAdmin;

  const [unreadMessages, setUnreadMessages] = useState(0);
  const fetchUnread = useCallback(() => {
    GoService.get<{ count: number }>('/api/conversations/unread').then((r) => setUnreadMessages(r.count)).catch(() => {});
  }, []);
  useEffect(() => {
    if (!userId) { setUnreadMessages(0); return; }
    fetchUnread();
    const id = setInterval(fetchUnread, 15000);
    // Retour sur l'onglet du navigateur : compteur à jour tout de suite
    const onVisible = () => { if (document.visibilityState === 'visible') fetchUnread(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [userId, fetchUnread]);

  // Compteur aussi dans le titre de l'onglet du navigateur : « (2) JIBLI DZ… »
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) /, '');
    document.title = unreadMessages > 0 ? `(${unreadMessages}) ${base}` : base;
  }, [unreadMessages]);

  // Conversation à ouvrir directement après un « Contacter » ou depuis le lien d'un e-mail (?messages=12)
  const [openConvId, setOpenConvId] = useState<number | null>(null);
  const openMessages = (convId?: number) => { setOpenConvId(convId ?? null); setScreen('messages'); };
  useEffect(() => { if (screen !== 'messages') setOpenConvId(null); }, [screen]);
  useEffect(() => {
    const url = new URL(window.location.href);
    const conv = url.searchParams.get('messages');
    if (conv === null) return;
    url.searchParams.delete('messages');
    window.history.replaceState({}, '', url.toString());
    if (userId) openMessages(Number(conv) || undefined);
    else setAuthOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Annonces de démo : admins uniquement, choix gardé dans le navigateur
  const [demoOn, setDemoOn] = useState(() => { try { return localStorage.getItem('jibli_demo') === '1'; } catch { return false; } });
  const toggleDemo = (on: boolean) => { setDemoOn(on); try { localStorage.setItem('jibli_demo', on ? '1' : '0'); } catch { /* ignore */ } };
  const showDemo = role === 'admin' && demoOn;
  const allTrips = useMemo(() => (showDemo ? [...trips, ...DEMO_TRIPS] : trips), [trips, showDemo]);
  const allParcels = useMemo(() => (showDemo ? [...parcels, ...DEMO_PARCELS] : parcels), [parcels, showDemo]);

  const filteredTrips = useMemo(() => {
    setTripPage(1);
    let list = [...allTrips];
    const s = search.toLowerCase();
    if (s) list = list.filter((t) => [t.from_city, t.to_city, t.name].some((v) => (v ?? '').toLowerCase().includes(s)));
    if (dest !== 'all') list = list.filter((t) => t.to_city === dest);
    return list.sort((a, b) => +new Date(a.date) - +new Date(b.date));
  }, [allTrips, search, dest]);

  const visibleTrips = useMemo(() => filteredTrips.slice(0, tripPage * PAGE_SIZE), [filteredTrips, tripPage]);
  const hasMoreTrips = visibleTrips.length < filteredTrips.length;

  const [parcelDest, setParcelDest] = useState('all');
  const [parcelType, setParcelType] = useState<ParcelType | 'all'>('all');
  const [parcelSort, setParcelSort] = useState<'recent' | 'budget' | 'light'>('recent');

  const filteredParcels = useMemo(() => {
    setParcelPage(1);
    const s = search.toLowerCase();
    const list = allParcels.filter((p) =>
      (!s || [p.from_city, p.to_city, p.description].some((v) => (v ?? '').toLowerCase().includes(s)))
      && (parcelDest === 'all' || p.to_city === parcelDest)
      && (parcelType === 'all' || p.parcel_type === parcelType));
    const sorters = {
      recent: (a: typeof list[0], b: typeof list[0]) => +new Date(b.created_at) - +new Date(a.created_at),
      budget: (a: typeof list[0], b: typeof list[0]) => b.budget - a.budget,
      // sans poids renseigné : en fin de liste
      light: (a: typeof list[0], b: typeof list[0]) => (a.weight ?? Infinity) - (b.weight ?? Infinity),
    };
    return [...list].sort(sorters[parcelSort]);
  }, [allParcels, search, parcelDest, parcelType, parcelSort]);

  const visibleParcels = useMemo(() => filteredParcels.slice(0, parcelPage * PAGE_SIZE), [filteredParcels, parcelPage]);
  const hasMoreParcels = visibleParcels.length < filteredParcels.length;

  return (
    <>
      <Header isLoggedIn={isLoggedIn && !readonly} isAdmin={isAdmin} search={search} onSearch={setSearch} onAccount={() => (isLoggedIn ? setScreen('settings') : setAuthOpen(true))} onAdmin={() => setScreen('admin')} />
      {readonly && (
        <div style={{ background: '#1a6b3c', color: '#fff', textAlign: 'center', padding: '10px 16px', fontSize: 14 }}>
          🚧 Site en cours de développement — consultation uniquement, les fonctionnalités seront bientôt disponibles.
        </div>
      )}
      <NavTabs screen={screen} setScreen={setScreen} unreadMessages={unreadMessages} readonly={readonly} />

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
                    <div className="stat-num">{allTrips.length}</div>
                    <div className="stat-label">{t('statsTrips')}</div>
                  </div>
                </div>
                <div className="col-4 col-lg-12">
                  <div className="card border-0 shadow-sm text-center p-3 h-100">
                    <div className="stat-num">{allParcels.length}</div>
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

          {role === 'admin' && (
            <div className="form-check form-switch mb-3">
              <input className="form-check-input" type="checkbox" role="switch" id="demo-switch"
                checked={demoOn} onChange={(e) => toggleDemo(e.target.checked)} />
              <label className="form-check-label" htmlFor="demo-switch" style={{ fontSize: 14 }}>{t('demoToggle')}</label>
            </div>
          )}

          {/* Filter chips */}
          <div className="d-flex flex-wrap gap-2 mb-4 chips-row">
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
                  {visibleTrips.map((tr, i) => (
                    <React.Fragment key={tr.id}>
                      <div className="col-12 col-md-6 col-xl-4">
                        <TripCard trip={tr} mine={canDelete(tr)} userId={userId} onOpen={() => setTripModal(tr)} onDelete={() => removeTrip(tr.id)} onLogin={() => setAuthOpen(true)} onMessagesOpen={openMessages} readonly={readonly} />
                      </div>
                      {showAdAfter(i) && <div className="col-12"><AdSlot /></div>}
                    </React.Fragment>
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
          <p className="text-muted mb-3" style={{ fontSize: 14 }}>{t('parcelsDesc')}</p>

          <div className="d-flex flex-wrap gap-2 mb-2 chips-row">
            {DEST_FILTERS.map((d) => (
              <button key={d} className={'chip' + (parcelDest === d ? ' active' : '')} onClick={() => setParcelDest(d)}>
                {d === 'all' ? t('filterAll') : '→ ' + d}
              </button>
            ))}
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
            <div className="d-flex flex-wrap gap-2 chips-row flex-grow-1">
              <button className={'chip' + (parcelType === 'all' ? ' active' : '')} onClick={() => setParcelType('all')}>{t('filterAllTypes')}</button>
              {(Object.keys(PARCEL_TYPE_LABELS) as ParcelType[]).map((pt) => (
                <button key={pt} className={'chip' + (parcelType === pt ? ' active' : '')} onClick={() => setParcelType(pt)}>
                  {PARCEL_TYPE_LABELS[pt].icon} {PARCEL_TYPE_LABELS[pt][lang]}
                </button>
              ))}
            </div>
            <select className="form-select form-select-sm" style={{ width: 'auto' }} aria-label={t('sortLabel')}
              value={parcelSort} onChange={(e) => setParcelSort(e.target.value as typeof parcelSort)}>
              <option value="recent">{t('sortRecent')}</option>
              <option value="budget">{t('sortBudget')}</option>
              <option value="light">{t('sortLight')}</option>
            </select>
          </div>
          {filteredParcels.length === 0
            ? <div className="empty-state"><div className="icon">📦</div><p>{t('emptyParcels').split('\\n').join('\n')}</p></div>
            : <>
                <div className="row g-3">
                  {visibleParcels.map((p, i) => (
                    <React.Fragment key={p.id}>
                      <div className="col-12 col-md-6 col-xl-4">
                        <ParcelCard parcel={p} mine={canDelete(p)} userId={userId} onDelete={() => removeParcel(p.id)} onLogin={() => setAuthOpen(true)} onMessagesOpen={openMessages} readonly={readonly} />
                      </div>
                      {showAdAfter(i) && <div className="col-12"><AdSlot /></div>}
                    </React.Fragment>
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

      {screen === 'shipments' && (
        <Shipments isLoggedIn={isLoggedIn} onLogin={() => setAuthOpen(true)} showToast={showToast} />
      )}

      {screen === 'settings' && isLoggedIn && (
        <Settings showToast={showToast} onLogout={() => { logout(); setScreen('home'); }} onPricing={() => setScreen('pricing')} />
      )}

      {screen === 'pricing' && (
        <Pricing isLoggedIn={isLoggedIn} onLogin={() => setAuthOpen(true)} showToast={showToast} />
      )}

      {screen === 'messages' && (
        <Messaging userId={userId} trips={trips} parcels={parcels} initialConvId={openConvId} onLogin={() => setAuthOpen(true)} onRead={fetchUnread} />
      )}

      {screen === 'admin' && isAdmin && <AdminPanel myId={userId} canManageUsers={role === 'admin'} />}

      <footer className="text-center text-muted py-4" style={{ fontSize: 13 }}>
        <a href="/confidentialite.html" className="text-muted">Politique de confidentialité</a>
        {' · '}
        <a href="/cgu.html" className="text-muted">CGU</a>
      </footer>

      {toast && <div className="app-toast show">{toast}</div>}

      {tripModal && (
        <TripModal
          trip={tripModal}
          userId={userId}
          canDelete={canDelete(tripModal)}
          onClose={() => setTripModal(null)}
          onDelete={() => removeTrip(tripModal.id, () => setTripModal(null))}
          onShipmentCreated={() => { setTripModal(null); setScreen('shipments'); showToast(t('toastShipmentCreated')); }}
          onLogin={() => setAuthOpen(true)}
          onMessagesOpen={(id) => { setTripModal(null); openMessages(id); }}
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
