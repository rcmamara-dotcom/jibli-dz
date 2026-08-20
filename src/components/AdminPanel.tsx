import React, { useCallback, useEffect, useState } from 'react';
import { GoService } from '../services/GoService';
import { Review, Trip, Parcel } from '../types';

interface User { id: number; email: string; is_admin: boolean; created_at: string; }
interface Stats { users: number; trips: number; parcels: number; reviews: number; }

type Tab = 'stats' | 'users' | 'trips' | 'parcels' | 'reviews';

function fmt(d: string) { return new Date(d).toLocaleDateString('fr-FR'); }

function ConfirmBtn({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  const [asked, setAsked] = useState(false);
  if (asked) return (
    <span className="d-inline-flex gap-1">
      <button className="btn btn-danger btn-sm" onClick={() => { onConfirm(); setAsked(false); }}>Confirmer</button>
      <button className="btn btn-outline-secondary btn-sm" onClick={() => setAsked(false)}>Annuler</button>
    </span>
  );
  return <button className="btn btn-outline-danger btn-sm" onClick={() => setAsked(true)}>{label}</button>;
}

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('stats');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback((t: Tab) => {
    setLoading(true); setError('');
    const map: Record<Tab, () => void> = {
      stats:   () => GoService.get<Stats>('/api/admin/stats').then(setStats).catch(() => setError('Erreur stats')),
      users:   () => GoService.get<User[]>('/api/admin/users').then(setUsers).catch(() => setError('Erreur users')),
      trips:   () => GoService.get<Trip[]>('/api/admin/trips').then(setTrips).catch(() => setError('Erreur trips')),
      parcels: () => GoService.get<Parcel[]>('/api/admin/parcels').then(setParcels).catch(() => setError('Erreur parcels')),
      reviews: () => GoService.get<Review[]>('/api/admin/reviews').then(setReviews).catch(() => setError('Erreur reviews')),
    };
    Promise.resolve(map[t]()).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  const del = (url: string, onDone: () => void) =>
    GoService.delete(url).then(onDone).catch(() => setError('Suppression impossible'));

  const TABS: [Tab, string, string][] = [
    ['stats',   '📊', 'Statistiques'],
    ['users',   '👤', 'Utilisateurs'],
    ['trips',   '✈️', 'Trajets'],
    ['parcels', '📦', 'Colis'],
    ['reviews', '⭐', 'Avis'],
  ];

  return (
    <div className="container-xxl py-4 px-3 px-lg-4">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div style={{ fontSize: 28 }}>🛡</div>
        <div>
          <h1 className="mb-0" style={{ fontFamily: "'Cairo', sans-serif", fontSize: 24, fontWeight: 800 }}>Administration</h1>
          <div className="text-muted" style={{ fontSize: 13 }}>Gestion des contenus et utilisateurs JIBLI DZ</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="nav-tabs-bar mb-4 rounded-3 overflow-hidden">
        <div className="d-flex">
          {TABS.map(([id, icon, label]) => (
            <button
              key={id}
              className={'nav-link flex-grow-1' + (tab === id ? ' active' : '')}
              onClick={() => setTab(id)}
              style={{ borderRadius: 0 }}
            >
              <span className="me-1">{icon}</span>
              <span className="d-none d-sm-inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
      {loading && <div className="text-muted text-center py-5">Chargement…</div>}

      {/* Stats */}
      {!loading && tab === 'stats' && stats && (
        <div className="row g-3">
          {([['👤 Utilisateurs', stats.users, '#0f5c32'],
             ['✈️ Trajets', stats.trips, '#1a6b3c'],
             ['📦 Colis', stats.parcels, '#f5a623'],
             ['⭐ Avis', stats.reviews, '#6b7280']] as [string, number, string][]).map(([label, val, color]) => (
            <div key={label} className="col-6 col-lg-3">
              <div className="card border-0 shadow-sm text-center p-4">
                <div style={{ fontSize: 36, fontWeight: 900, color, fontFamily: "'Cairo', sans-serif" }}>{val}</div>
                <div className="text-muted" style={{ fontSize: 13 }}>{label}</div>
              </div>
            </div>
          ))}
          <div className="col-12">
            <div className="alert alert-info py-2 mb-0" style={{ fontSize: 13 }}>
              💡 Pour passer un compte en admin : <code>UPDATE users SET is_admin = true WHERE email = 'email@exemple.com';</code>
            </div>
          </div>
        </div>
      )}

      {/* Users */}
      {!loading && tab === 'users' && (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr><th>#</th><th>Email</th><th>Rôle</th><th>Inscrit le</th><th></th></tr>
              </thead>
              <tbody>
                {users.length === 0 && <tr><td colSpan={5} className="text-muted text-center py-4">Aucun utilisateur</td></tr>}
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="text-muted" style={{ fontSize: 12 }}>{u.id}</td>
                    <td>
                      {u.email}
                      {u.is_admin && <span className="badge ms-2" style={{ background: 'var(--green-mid)', fontSize: 10 }}>ADMIN</span>}
                    </td>
                    <td><span className="text-muted" style={{ fontSize: 12 }}>{u.is_admin ? 'Administrateur' : 'Utilisateur'}</span></td>
                    <td className="text-muted" style={{ fontSize: 12 }}>{fmt(u.created_at)}</td>
                    <td>
                      {!u.is_admin && (
                        <ConfirmBtn
                          label="🗑 Bannir"
                          onConfirm={() => del(`/api/admin/users/${u.id}`, () => setUsers((p) => p.filter((x) => x.id !== u.id)))}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trips */}
      {!loading && tab === 'trips' && (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr><th>#</th><th>Trajet</th><th>Voyageur</th><th>Date</th><th>Publié le</th><th></th></tr>
              </thead>
              <tbody>
                {trips.length === 0 && <tr><td colSpan={6} className="text-muted text-center py-4">Aucun trajet</td></tr>}
                {trips.map((t) => (
                  <tr key={t.id}>
                    <td className="text-muted" style={{ fontSize: 12 }}>{t.id}</td>
                    <td style={{ fontWeight: 600 }}>{t.from_city} → {t.to_city}</td>
                    <td className="text-muted" style={{ fontSize: 13 }}>{t.name}</td>
                    <td className="text-muted" style={{ fontSize: 12 }}>{new Date(t.date + 'T12:00:00').toLocaleDateString('fr-FR')}</td>
                    <td className="text-muted" style={{ fontSize: 12 }}>{fmt(t.created_at)}</td>
                    <td>
                      <ConfirmBtn
                        label="🗑 Supprimer"
                        onConfirm={() => del(`/api/admin/trips/${t.id}`, () => setTrips((p) => p.filter((x) => x.id !== t.id)))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Parcels */}
      {!loading && tab === 'parcels' && (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr><th>#</th><th>Trajet</th><th>Description</th><th>Budget</th><th>Publié le</th><th></th></tr>
              </thead>
              <tbody>
                {parcels.length === 0 && <tr><td colSpan={6} className="text-muted text-center py-4">Aucun colis</td></tr>}
                {parcels.map((p) => (
                  <tr key={p.id}>
                    <td className="text-muted" style={{ fontSize: 12 }}>{p.id}</td>
                    <td style={{ fontWeight: 600 }}>{p.from_city} → {p.to_city}</td>
                    <td className="text-muted" style={{ fontSize: 12, maxWidth: 200 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</span>
                    </td>
                    <td><span className="budget-tag">{p.budget}€</span></td>
                    <td className="text-muted" style={{ fontSize: 12 }}>{fmt(p.created_at)}</td>
                    <td>
                      <ConfirmBtn
                        label="🗑 Supprimer"
                        onConfirm={() => del(`/api/admin/parcels/${p.id}`, () => setParcels((prev) => prev.filter((x) => x.id !== p.id)))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reviews */}
      {!loading && tab === 'reviews' && (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr><th>#</th><th>Trajet #</th><th>Auteur</th><th>Note</th><th>Commentaire</th><th>Date</th><th></th></tr>
              </thead>
              <tbody>
                {reviews.length === 0 && <tr><td colSpan={7} className="text-muted text-center py-4">Aucun avis</td></tr>}
                {reviews.map((r) => (
                  <tr key={r.id}>
                    <td className="text-muted" style={{ fontSize: 12 }}>{r.id}</td>
                    <td className="text-muted" style={{ fontSize: 12 }}>#{r.trip_id}</td>
                    <td style={{ fontSize: 13 }}>{r.reviewer_email.split('@')[0]}</td>
                    <td>
                      {[1,2,3,4,5].map((i) => (
                        <span key={i} style={{ color: i <= r.rating ? '#f5a623' : '#d1d5db', fontSize: 14 }}>★</span>
                      ))}
                    </td>
                    <td className="text-muted" style={{ fontSize: 12, maxWidth: 220 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.comment ?? <em>—</em>}
                      </span>
                    </td>
                    <td className="text-muted" style={{ fontSize: 12 }}>{fmt(r.created_at)}</td>
                    <td>
                      <ConfirmBtn
                        label="🗑 Supprimer"
                        onConfirm={() => del(`/api/admin/reviews/${r.id}`, () => setReviews((p) => p.filter((x) => x.id !== r.id)))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
