import React, { useEffect, useState } from 'react';
import { GoService } from '../services/GoService';

interface SubInfo {
  plan: string | null;
  status: string | null;
  quota: number | null;
  used: number | null;
  remaining: number | null;
  period_end?: string;
}

interface Props {
  isLoggedIn: boolean;
  onLogin: () => void;
  showToast: (msg: string) => void;
}

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 9,
    quota: 5,
    features: ['5 publications / mois', 'Trajets & colis', 'Support email'],
    color: '#6c757d',
    badge: '',
  },
  {
    id: 'voyageur',
    name: 'Voyageur',
    price: 19,
    quota: 20,
    features: ['20 publications / mois', 'Trajets & colis', 'Badge Voyageur ✈️', 'Support prioritaire'],
    color: 'var(--green-dark)',
    badge: 'Populaire',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 39,
    quota: null,
    features: ['Publications illimitées', 'Trajets & colis', 'Badge Pro ⭐', 'Priorité dans les listes', 'Support dédié'],
    color: '#b8860b',
    badge: 'Meilleur',
  },
];

export default function Pricing({ isLoggedIn, onLogin, showToast }: Props) {
  const [subInfo, setSubInfo] = useState<SubInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    GoService.get<SubInfo>('/api/subscriptions/me')
      .then(setSubInfo)
      .catch(() => {});
  }, [isLoggedIn]);

  const subscribe = (planId: string) => {
    if (!isLoggedIn) { onLogin(); return; }
    setLoading(true);
    GoService.post<{ checkout_url: string }>('/api/subscriptions/create-checkout', { plan: planId })
      .then(({ checkout_url }) => { window.location.href = checkout_url; })
      .catch(() => { showToast('⚠️ Erreur, réessayez.'); setLoading(false); });
  };

  const openPortal = () => {
    setLoading(true);
    GoService.post<{ portal_url: string }>('/api/subscriptions/portal', {})
      .then(({ portal_url }) => { window.location.href = portal_url; })
      .catch(() => { showToast('⚠️ Erreur portail'); setLoading(false); });
  };

  const activePlan = subInfo?.plan && subInfo?.status === 'active' ? subInfo.plan : null;

  return (
    <div className="container-xxl py-4 px-3 px-lg-4">
      <div className="text-center mb-5">
        <h2 className="fw-bold mb-2">Nos abonnements</h2>
        <p className="text-muted">Publiez vos annonces sans payer à chaque fois</p>
        <p className="text-muted" style={{ fontSize: 13 }}>
          Sans abonnement : <strong>3€</strong> par publication
        </p>
      </div>

      {activePlan && (
        <div className="alert alert-success text-center mb-4" style={{ maxWidth: 600, margin: '0 auto 24px' }}>
          ✅ Abonnement <strong>{PLANS.find(p => p.id === activePlan)?.name}</strong> actif
          {subInfo?.quota && (
            <span> — {subInfo.remaining}/{subInfo.quota} publications restantes ce mois</span>
          )}
          {!subInfo?.quota && <span> — Publications illimitées</span>}
          <br />
          <button className="btn btn-sm btn-outline-success mt-2" onClick={openPortal} disabled={loading}>
            Gérer mon abonnement
          </button>
        </div>
      )}

      <div className="row g-4 justify-content-center">
        {PLANS.map((plan) => {
          const isActive = activePlan === plan.id;
          return (
            <div key={plan.id} className="col-12 col-md-4" style={{ maxWidth: 340 }}>
              <div className={`card h-100 border-0 shadow-sm ${isActive ? 'border border-success border-2' : ''}`}
                style={{ borderRadius: 16, overflow: 'hidden' }}>
                {plan.badge && (
                  <div className="text-center py-1 text-white fw-bold" style={{ background: plan.color, fontSize: 13 }}>
                    {plan.badge}
                  </div>
                )}
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-1">{plan.name}</h5>
                  <div className="mb-3">
                    <span style={{ fontSize: 36, fontWeight: 700, color: plan.color }}>{plan.price}€</span>
                    <span className="text-muted"> / mois</span>
                  </div>
                  <ul className="list-unstyled mb-4">
                    {plan.features.map((f) => (
                      <li key={f} className="mb-2" style={{ fontSize: 14 }}>
                        ✓ {f}
                      </li>
                    ))}
                  </ul>
                  {isActive ? (
                    <button className="btn w-100 btn-outline-success" onClick={openPortal} disabled={loading}>
                      Gérer l'abonnement
                    </button>
                  ) : (
                    <button
                      className="btn w-100 text-white fw-bold"
                      style={{ background: plan.color }}
                      onClick={() => subscribe(plan.id)}
                      disabled={loading}
                    >
                      {isLoggedIn ? `S'abonner — ${plan.price}€/mois` : 'Se connecter pour s\'abonner'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-muted mt-4" style={{ fontSize: 12 }}>
        Paiement sécurisé via Stripe · Annulation à tout moment · Sans engagement
      </p>
    </div>
  );
}
