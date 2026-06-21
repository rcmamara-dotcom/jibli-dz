import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut, User,
} from 'firebase/auth';
import { db, auth, CONFIGURED } from './firebase';
import { Trip, Parcel, Mode, Screen } from './types';

/* ─── Données & helpers ─────────────────────────────────────────────────── */
type CityType = 'air' | 'port' | 'both';
const LOCATIONS: Record<string, { name: string; type: CityType }[]> = {
  France: [
    { name: 'Paris', type: 'air' }, { name: 'Lyon', type: 'air' },
    { name: 'Marseille', type: 'both' }, { name: 'Toulouse', type: 'air' },
    { name: 'Nice', type: 'air' }, { name: 'Lille', type: 'air' },
    { name: 'Bordeaux', type: 'air' }, { name: 'Nantes', type: 'air' },
    { name: 'Strasbourg', type: 'air' }, { name: 'Montpellier', type: 'air' },
    { name: 'Sète', type: 'port' }, { name: 'Toulon', type: 'port' },
  ],
  Algérie: [
    { name: 'Alger', type: 'both' }, { name: 'Oran', type: 'both' },
    { name: 'Constantine', type: 'air' }, { name: 'Annaba', type: 'both' },
    { name: 'Béjaïa', type: 'both' }, { name: 'Sétif', type: 'air' },
    { name: 'Tlemcen', type: 'air' }, { name: 'Batna', type: 'air' },
    { name: 'Chlef', type: 'air' }, { name: 'Skikda', type: 'port' },
    { name: 'Mostaganem', type: 'port' }, { name: 'Ghazaouet', type: 'port' },
  ],
};
const cityIcon = (t: CityType) => (t === 'both' ? '✈️ ⚓' : t === 'air' ? '✈️' : '⚓');

function waDigits(num: string): string {
  let d = String(num || '').replace(/[^\d+]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  else if (d.startsWith('00')) d = d.slice(2);
  return d;
}
function waValid(num: string): boolean {
  const raw = String(num || '').trim().replace(/\s/g, '');
  const intl = raw.startsWith('+') || raw.startsWith('00');
  const d = waDigits(num);
  return intl && d.length >= 8 && d.length <= 15 && !d.startsWith('0');
}
function formatWA(num: string, msg: string): string {
  return `https://wa.me/${waDigits(num)}?text=${encodeURIComponent(msg)}`;
}

const TRIPS_KEY = 'jibli_trips';
const PARCELS_KEY = 'jibli_parcels';
const lsGet = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k: string, v: string): void => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

const sampleTrips = (): Trip[] => ([
  { id: '1', name: 'Karim M.', from: 'Paris', to: 'Alger', date: '2026-06-18', capacity: '3', weight: 20, capDesc: 'Vêtements et petits cadeaux. Pas de liquides svp.', wa: '+33612345678' },
  { id: '2', name: 'Samira L.', from: 'Lyon', to: 'Oran', date: '2026-06-22', capacity: '2', weight: 15, capDesc: 'Médicaments et documents acceptés.', wa: '+33698765432' },
  { id: '3', name: 'Yacine B.', from: 'Marseille', to: 'Alger', date: '2026-07-01', capacity: '5+', weight: 40, capDesc: 'Je voyage en ferry (Algérie Ferries), grande capacité.', wa: '+33755443322' },
]);
const sampleParcels = (): Parcel[] => ([
  { id: '1', from: 'Paris', to: 'Alger', desc: 'Médicaments + quelques habits pour mes parents. ~3 kg.', budget: 25, wa: '+33611223344' },
  { id: '2', from: 'Lyon', to: 'Oran', desc: 'Téléphone portable (cadeau anniversaire), bien emballé.', budget: 40, wa: '+33677889900' },
]);

/* ─── Sélecteur Pays → Ville ────────────────────────────────────────────── */
function LocationPicker(props: {
  country: string; city: string;
  onCountry: (v: string) => void; onCity: (v: string) => void; legend?: boolean;
}) {
  const { country, city, onCountry, onCity, legend } = props;
  return (
    <div className="field">
      <div className="loc-group">
        <select value={country} onChange={(e) => onCountry(e.target.value)}>
          <option value="">Pays…</option>
          <option value="France">🇫🇷 France</option>
          <option value="Algérie">🇩🇿 Algérie</option>
        </select>
        <select value={city} onChange={(e) => onCity(e.target.value)} disabled={!country}>
          <option value="">Ville…</option>
          {country && LOCATIONS[country].map((c) => (
            <option key={c.name} value={c.name}>{c.name} {cityIcon(c.type)}</option>
          ))}
        </select>
      </div>
      {legend && <div className="loc-legend"><span>✈️ aéroport</span><span>⚓ port</span></div>}
    </div>
  );
}

/* ═══════════════════════════════════ APP ═══════════════════════════════════ */
export default function App() {
  const [mode] = useState<Mode>(CONFIGURED ? 'cloud' : 'local');
  const [screen, setScreen] = useState<Screen>('home');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [dest, setDest] = useState('all');
  const [toast, setToast] = useState('');
  const [tripModal, setTripModal] = useState<Trip | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const showToast = useCallback((m: string) => {
    setToast(m);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(''), 3000);
  }, []);

  /* Init : abonnements temps réel + auth (cloud) ou démo locale */
  useEffect(() => {
    if (CONFIGURED && db && auth) {
      const unsubT = onSnapshot(
        query(collection(db, 'trips'), orderBy('createdAt', 'desc')),
        (snap) => setTrips(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Trip, 'id'>) }))),
        (err) => { console.error(err); showToast('⚠️ Erreur de chargement des trajets'); },
      );
      const unsubP = onSnapshot(
        query(collection(db, 'parcels'), orderBy('createdAt', 'desc')),
        (snap) => setParcels(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Parcel, 'id'>) }))),
        (err) => { console.error(err); showToast('⚠️ Erreur de chargement des colis'); },
      );
      const unsubA = onAuthStateChanged(auth, (u) => setUser(u));
      return () => { unsubT(); unsubP(); unsubA(); };
    }
    try { setTrips(JSON.parse(lsGet(TRIPS_KEY) || 'null') || sampleTrips()); } catch { setTrips(sampleTrips()); }
    try { setParcels(JSON.parse(lsGet(PARCELS_KEY) || 'null') || sampleParcels()); } catch { setParcels(sampleParcels()); }
    return undefined;
  }, [showToast]);

  useEffect(() => { if (mode === 'local') lsSet(TRIPS_KEY, JSON.stringify(trips)); }, [trips, mode]);
  useEffect(() => { if (mode === 'local') lsSet(PARCELS_KEY, JSON.stringify(parcels)); }, [parcels, mode]);

  const canDelete = useCallback((item: { ownerUid?: string }) => {
    if (mode === 'local') return true;
    return !!(user && item.ownerUid && item.ownerUid === user.uid);
  }, [mode, user]);

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

  async function publishTrip(form: Omit<Trip, 'id'>, reset: () => void) {
    if (mode === 'cloud' && !user) { showToast('🔒 Connecte-toi pour publier'); setAuthOpen(true); return; }
    if (!form.name || !form.from || !form.to || !form.date || !form.wa) { showToast('⚠️ Remplissez tous les champs obligatoires'); return; }
    if (form.from === form.to) { showToast('⚠️ Départ et arrivée identiques'); return; }
    if (!waValid(form.wa)) { showToast('⚠️ Numéro WhatsApp au format international, ex : +33612345678'); return; }
    try {
      if (mode === 'cloud') {
        await addDoc(collection(db!, 'trips'), { ...form, ownerUid: user!.uid, createdAt: serverTimestamp() });
      } else {
        setTrips((prev) => [{ id: String(Date.now()), ...form }, ...prev]);
      }
      reset(); showToast('✅ Trajet publié avec succès !'); setScreen('home');
    } catch (e: any) { console.error(e); showToast('⚠️ Échec : ' + (e.code || e.message)); }
  }

  async function publishParcel(form: Omit<Parcel, 'id'>, reset: () => void) {
    if (mode === 'cloud' && !user) { showToast('🔒 Connecte-toi pour publier'); setAuthOpen(true); return; }
    if (!form.from || !form.to || !form.desc || !form.wa) { showToast('⚠️ Remplissez tous les champs'); return; }
    if (form.from === form.to) { showToast('⚠️ Départ et arrivée identiques'); return; }
    if (!waValid(form.wa)) { showToast('⚠️ Numéro WhatsApp au format international, ex : +33612345678'); return; }
    try {
      if (mode === 'cloud') {
        await addDoc(collection(db!, 'parcels'), { ...form, budget: form.budget || 0, ownerUid: user!.uid, createdAt: serverTimestamp() });
      } else {
        setParcels((prev) => [{ id: String(Date.now()), ...form, budget: form.budget || 0 }, ...prev]);
      }
      reset(); showToast('📦 Colis publié !'); setScreen('parcels');
    } catch (e: any) { console.error(e); showToast('⚠️ Échec : ' + (e.code || e.message)); }
  }

  async function removeTrip(id: string) {
    const t = trips.find((x) => String(x.id) === String(id));
    if (!t || !canDelete(t)) { showToast('⚠️ Action non autorisée'); return; }
    if (!window.confirm('Supprimer définitivement ce trajet ?')) return;
    try {
      if (mode === 'cloud') await deleteDoc(doc(db!, 'trips', id));
      else setTrips((prev) => prev.filter((x) => String(x.id) !== String(id)));
      showToast('🗑 Trajet supprimé'); setTripModal(null);
    } catch (e) { console.error(e); showToast('⚠️ Suppression impossible'); }
  }
  async function removeParcel(id: string) {
    const p = parcels.find((x) => String(x.id) === String(id));
    if (!p || !canDelete(p)) { showToast('⚠️ Action non autorisée'); return; }
    if (!window.confirm('Supprimer définitivement ce colis ?')) return;
    try {
      if (mode === 'cloud') await deleteDoc(doc(db!, 'parcels', id));
      else setParcels((prev) => prev.filter((x) => String(x.id) !== String(id)));
      showToast('🗑 Colis supprimé');
    } catch (e) { console.error(e); showToast('⚠️ Suppression impossible'); }
  }

  const needLogin = mode === 'cloud' && !user;

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
            {['all', 'Alger', 'Oran', 'Constantine', 'Annaba', 'Béjaïa'].map((d) => (
              <button key={d} className={'chip' + (dest === d ? ' active' : '')} onClick={() => setDest(d)}>
                {d === 'all' ? 'Tous' : '→ ' + d}
              </button>
            ))}
          </div>
          <div className="section-title">Voyageurs disponibles <span className="badge">{visibleTrips.length}</span></div>
          {visibleTrips.length === 0
            ? <Empty icon="✈️" text={<>Aucun trajet disponible.<br />Soyez le premier à publier !</>} />
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
            ? <Empty icon="📦" text={<>Aucun colis publié.<br />Quelqu'un a besoin de vous !</>} />
            : visibleParcels.map((p) => (
              <ParcelCard key={p.id} parcel={p} mine={canDelete(p)} onDelete={() => removeParcel(p.id)} />
            ))}
        </div>
      )}

      {screen === 'add-trip' && <AddTrip needLogin={needLogin} onLogin={() => setAuthOpen(true)} onPublish={publishTrip} />}
      {screen === 'add-parcel' && <AddParcel needLogin={needLogin} onLogin={() => setAuthOpen(true)} onPublish={publishParcel} />}

      {toast && <div className="toast show">{toast}</div>}

      {tripModal && (
        <TripModal trip={tripModal} canDelete={canDelete(tripModal)} onClose={() => setTripModal(null)} onDelete={() => removeTrip(tripModal.id)} />
      )}

      {authOpen && (
        <AuthModal mode={mode} user={user} onClose={() => setAuthOpen(false)} showToast={showToast} />
      )}
    </>
  );
}

/* ─── Header ─────────────────────────────────────────────────────────────── */
function Header(props: { user: User | null; mode: Mode; search: string; onSearch: (v: string) => void; onAccount: () => void; }) {
  const { user, mode, search, onSearch, onAccount } = props;
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

function NavTabs({ screen, setScreen }: { screen: Screen; setScreen: (s: Screen) => void; }) {
  const tabs: [Screen, string, string][] = [
    ['home', '🏠', 'Trajets'], ['parcels', '📦', 'Colis'],
    ['add-trip', '✈️', 'Je voyage'], ['add-parcel', '➕', 'Envoyer'],
  ];
  return (
    <nav className="nav-tabs">
      {tabs.map(([id, icon, label]) => (
        <button key={id} className={'tab-btn' + (screen === id ? ' active' : '')} onClick={() => { setScreen(id); window.scrollTo({ top: 0 }); }}>
          <span className="tab-icon">{icon}</span>{label}
        </button>
      ))}
    </nav>
  );
}

function Empty({ icon, text }: { icon: string; text: React.ReactNode; }) {
  return <div className="empty"><div className="empty-icon">{icon}</div><p>{text}</p></div>;
}

/* ─── Cartes ─────────────────────────────────────────────────────────────── */
function TripCard({ trip: t, mine, onOpen, onDelete }: { trip: Trip; mine: boolean; onOpen: () => void; onDelete: () => void; }) {
  const d = new Date(t.date);
  const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  const isUpcoming = d >= new Date(new Date().toDateString());
  const wa = formatWA(t.wa, `Bonjour ${t.name}, j'ai vu votre trajet ${t.from}→${t.to} sur JIBLI DZ. Est-ce que vous pouvez transporter mon colis ?`);
  return (
    <div className="trip-card" onClick={onOpen}>
      <div className="trip-route">
        <span>{t.from}</span><span className="trip-arrow">→</span><span>{t.to}</span>
        {mine ? <span className="mine-tag">MON ANNONCE</span>
          : (!isUpcoming && <span style={{ fontSize: 11, color: 'var(--red)', marginLeft: 'auto' }}>Passé</span>)}
      </div>
      <div className="trip-meta">
        <span>👤 {t.name}</span>
        <span>📅 {dateStr}</span>
        <span>📦 {t.capacity} colis</span>
        {t.weight ? <span>⚖️ {t.weight} kg</span> : null}
      </div>
      {t.capDesc && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>"{t.capDesc}"</div>}
      <div className="trip-actions" onClick={(e) => e.stopPropagation()}>
        <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-wa btn-sm">💬 WhatsApp</a>
        <button className="btn btn-outline btn-sm" onClick={onOpen}>Voir détails</button>
        {mine && <button className="btn btn-danger btn-sm" onClick={onDelete}>🗑 Supprimer</button>}
      </div>
    </div>
  );
}

function ParcelCard({ parcel: p, mine, onDelete }: { parcel: Parcel; mine: boolean; onDelete: () => void; }) {
  const wa = formatWA(p.wa, `Bonjour, j'ai vu votre colis ${p.from}→${p.to} sur JIBLI DZ. Je fais ce trajet et je peux vous aider !`);
  return (
    <div className="parcel-card">
      <div className="parcel-route">
        <span>{p.from}</span><span className="trip-arrow" style={{ color: 'var(--gold)' }}>→</span><span>{p.to}</span>
        {mine && <span className="mine-tag">MON ANNONCE</span>}
      </div>
      <div className="parcel-desc">{p.desc}</div>
      <div><span className="budget-tag">💶 Budget : {p.budget}€</span></div>
      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-wa btn-sm">💬 Contacter sur WhatsApp</a>
        {mine && <button className="btn btn-danger btn-sm" onClick={onDelete}>🗑 Supprimer</button>}
      </div>
    </div>
  );
}

/* ─── Modale détail trajet ──────────────────────────────────────────────── */
function TripModal({ trip, canDelete, onClose, onDelete }: { trip: Trip; canDelete: boolean; onClose: () => void; onDelete: () => void; }) {
  const d = new Date(trip.date);
  const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const wa = formatWA(trip.wa, `Bonjour ${trip.name}, j'ai vu votre trajet ${trip.from}→${trip.to} le ${dateStr} sur JIBLI DZ. Est-ce que vous pouvez transporter mon colis ?`);
  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{trip.from} → {trip.to}</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'var(--card)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>Voyageur</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{trip.name}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: 'var(--card)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Date départ</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{dateStr}</div>
            </div>
            <div style={{ flex: 1, background: 'var(--card)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Colis</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--green-mid)' }}>{trip.capacity}</div>
            </div>
            <div style={{ flex: 1, background: 'var(--card)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Poids max</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--green-mid)' }}>{trip.weight ? trip.weight + ' kg' : '—'}</div>
            </div>
          </div>
          {trip.capDesc && (
            <div style={{ background: 'var(--gold-light)', borderRadius: 10, padding: 14, fontSize: 13, lineHeight: 1.5 }}>
              <strong>Capacité &amp; conditions :</strong><br />{trip.capDesc}
            </div>
          )}
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-wa btn-full" style={{ fontSize: 15 }}>💬 Contacter sur WhatsApp</a>
          {canDelete && <button className="btn btn-danger btn-full" onClick={onDelete}>🗑 Supprimer mon trajet</button>}
          <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>Le contact se fait directement via WhatsApp. JIBLI DZ n'intervient pas dans la transaction.</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Formulaire trajet ─────────────────────────────────────────────────── */
function AddTrip({ needLogin, onLogin, onPublish }: {
  needLogin: boolean; onLogin: () => void;
  onPublish: (form: Omit<Trip, 'id'>, reset: () => void) => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const empty = { name: '', fromC: '', from: '', toC: '', to: '', date: today, capacity: '3', weight: '', capDesc: '', wa: '' };
  const [f, setF] = useState(empty);
  const up = (k: keyof typeof empty) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  return (
    <div className="screen active">
      <div className="form-card">
        <div className="form-title">✈️ Publier mon trajet</div>
        {needLogin && <div className="login-note show">🔒 <a onClick={onLogin}>Connecte-toi</a> pour publier — tu pourras aussi modifier ou supprimer ton annonce.</div>}
        <div className="field"><label>Votre prénom / nom</label>
          <input type="text" maxLength={50} placeholder="Ex: Ahmed B." value={f.name} onChange={(e) => up('name')(e.target.value)} /></div>
        <label style={{ fontSize: 13, fontWeight: 500 }}>Ville de départ</label>
        <LocationPicker country={f.fromC} city={f.from} onCountry={(v) => setF((s) => ({ ...s, fromC: v, from: '' }))} onCity={up('from')} />
        <label style={{ fontSize: 13, fontWeight: 500 }}>Ville d'arrivée</label>
        <LocationPicker country={f.toC} city={f.to} onCountry={(v) => setF((s) => ({ ...s, toC: v, to: '' }))} onCity={up('to')} legend />
        <div className="field-row">
          <div className="field"><label>Date de départ</label>
            <input type="date" value={f.date} onChange={(e) => up('date')(e.target.value)} /></div>
          <div className="field"><label>Nombre de colis</label>
            <select value={f.capacity} onChange={(e) => up('capacity')(e.target.value)}>
              <option>1</option><option>2</option><option>3</option><option>4</option><option>5+</option>
            </select></div>
        </div>
        <div className="field"><label>Poids total accepté (kg)</label>
          <input type="number" min={1} max={100} placeholder="Ex: 20" value={f.weight} onChange={(e) => up('weight')(e.target.value)} /></div>
        <div className="field"><label>Description de la capacité / conditions</label>
          <textarea placeholder="Ex: J'accepte vêtements, médicaments, petits cadeaux. Pas de liquides." value={f.capDesc} onChange={(e) => up('capDesc')(e.target.value)} /></div>
        <div className="field"><label>Votre numéro WhatsApp</label>
          <input type="tel" placeholder="+33 6 12 34 56 78" value={f.wa} onChange={(e) => up('wa')(e.target.value)} />
          <div className="wa-hint">📱 Les expéditeurs vous contacteront directement.</div></div>
        <button className="btn btn-green btn-full" onClick={() => onPublish(
          { name: f.name, from: f.from, to: f.to, date: f.date, capacity: f.capacity, weight: f.weight || '', capDesc: f.capDesc, wa: f.wa },
          () => setF({ ...empty, date: today }),
        )}>✅ Publier mon trajet</button>
      </div>
    </div>
  );
}

/* ─── Formulaire colis ──────────────────────────────────────────────────── */
function AddParcel({ needLogin, onLogin, onPublish }: {
  needLogin: boolean; onLogin: () => void;
  onPublish: (form: Omit<Parcel, 'id'>, reset: () => void) => void;
}) {
  const empty = { fromC: '', from: '', toC: '', to: '', desc: '', budget: '', wa: '' };
  const [f, setF] = useState(empty);
  const up = (k: keyof typeof empty) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  return (
    <div className="screen active">
      <div className="form-card">
        <div className="form-title">📦 Envoyer un colis</div>
        {needLogin && <div className="login-note show">🔒 <a onClick={onLogin}>Connecte-toi</a> pour publier — tu pourras aussi supprimer ton annonce ensuite.</div>}
        <label style={{ fontSize: 13, fontWeight: 500 }}>Ville de départ</label>
        <LocationPicker country={f.fromC} city={f.from} onCountry={(v) => setF((s) => ({ ...s, fromC: v, from: '' }))} onCity={up('from')} />
        <label style={{ fontSize: 13, fontWeight: 500 }}>Ville d'arrivée</label>
        <LocationPicker country={f.toC} city={f.to} onCountry={(v) => setF((s) => ({ ...s, toC: v, to: '' }))} onCity={up('to')} legend />
        <div className="field"><label>Description du colis</label>
          <textarea placeholder="Ex: Vêtements et médicaments pour ma famille. Environ 5 kg." value={f.desc} onChange={(e) => up('desc')(e.target.value)} /></div>
        <div className="field"><label>Budget proposé (€)</label>
          <input type="number" min={0} max={500} placeholder="Ex: 30" value={f.budget} onChange={(e) => up('budget')(e.target.value)} /></div>
        <div className="field"><label>Votre numéro WhatsApp</label>
          <input type="tel" placeholder="+33 6 12 34 56 78" value={f.wa} onChange={(e) => up('wa')(e.target.value)} />
          <div className="wa-hint">📱 Les voyageurs vous contacteront pour s'arranger.</div></div>
        <button className="btn btn-gold btn-full" onClick={() => onPublish(
          { from: f.from, to: f.to, desc: f.desc, budget: f.budget, wa: f.wa },
          () => setF(empty),
        )}>📦 Publier mon colis</button>
      </div>
    </div>
  );
}

/* ─── Modale authentification (e-mail) ──────────────────────────────────── */
function AuthModal({ mode, user, onClose, showToast }: {
  mode: Mode; user: User | null; onClose: () => void; showToast: (m: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState('');

  if (mode !== 'cloud' || !auth) return null;

  const errMsg = (e: any): string => {
    const map: Record<string, string> = {
      'auth/invalid-email': 'Adresse e-mail invalide',
      'auth/email-already-in-use': 'Cet e-mail a déjà un compte — utilise « Se connecter »',
      'auth/weak-password': 'Mot de passe trop court (6 caractères min)',
      'auth/wrong-password': 'Mot de passe incorrect',
      'auth/user-not-found': 'Aucun compte avec cet e-mail — utilise « Créer un compte »',
      'auth/invalid-credential': 'E-mail ou mot de passe incorrect',
      'auth/too-many-requests': 'Trop de tentatives, réessaie plus tard',
      'auth/network-request-failed': 'Problème de connexion réseau',
      'auth/operation-not-allowed': 'Active « E-mail/Mot de passe » dans Firebase',
    };
    console.error(e);
    return '⚠️ ' + (map[e.code] || e.code || e.message);
  };

  const doSignIn = async () => {
    if (!email || pass.length < 6) { showToast('⚠️ E-mail + mot de passe (6 caractères min)'); return; }
    setBusy('in');
    try { await signInWithEmailAndPassword(auth!, email, pass); showToast('✅ Connecté !'); onClose(); }
    catch (e) { showToast(errMsg(e)); } finally { setBusy(''); }
  };
  const doSignUp = async () => {
    if (!email || pass.length < 6) { showToast('⚠️ E-mail + mot de passe (6 caractères min)'); return; }
    setBusy('up');
    try { await createUserWithEmailAndPassword(auth!, email, pass); showToast('✅ Compte créé !'); onClose(); }
    catch (e) { showToast(errMsg(e)); } finally { setBusy(''); }
  };
  const doReset = async () => {
    if (!email) { showToast("⚠️ Entre d'abord ton e-mail"); return; }
    try { await sendPasswordResetEmail(auth!, email); showToast('📧 E-mail de réinitialisation envoyé'); }
    catch (e) { showToast(errMsg(e)); }
  };
  const doLogout = async () => {
    try { await signOut(auth!); showToast('À bientôt 👋'); onClose(); }
    catch { showToast('⚠️ Déconnexion impossible'); }
  };

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{user ? 'Mon compte' : 'Connexion'}</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        {user ? (
          <>
            <div style={{ background: 'var(--card)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Connecté en tant que</div>
              <div style={{ fontSize: 16, fontWeight: 700, wordBreak: 'break-all' }}>{user.email}</div>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 14 }}>Tes annonces affichent un bouton 🗑 pour les supprimer. Personne d'autre ne peut les modifier.</p>
            <button className="btn btn-danger btn-full" onClick={doLogout}>Se déconnecter</button>
          </>
        ) : (
          <>
            <div className="login-note show" style={{ display: 'block' }}>📧 Connecte-toi par e-mail pour publier et gérer tes annonces. Première fois ? Crée un compte.</div>
            <div className="field"><label>Adresse e-mail</label>
              <input type="email" autoComplete="email" placeholder="ton@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="field"><label>Mot de passe</label>
              <input type="password" autoComplete="current-password" placeholder="Au moins 6 caractères" value={pass} onChange={(e) => setPass(e.target.value)} /></div>
            <button className="btn btn-green btn-full" disabled={busy === 'in'} onClick={doSignIn}>{busy === 'in' ? '⏳ Connexion…' : 'Se connecter'}</button>
            <button className="btn btn-outline btn-full" style={{ marginTop: 8 }} disabled={busy === 'up'} onClick={doSignUp}>{busy === 'up' ? '⏳ Création…' : 'Créer un compte'}</button>
            <p style={{ textAlign: 'center', marginTop: 12 }}>
              <a onClick={doReset} style={{ fontSize: 12.5, color: 'var(--muted)', textDecoration: 'underline', cursor: 'pointer' }}>Mot de passe oublié ?</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
