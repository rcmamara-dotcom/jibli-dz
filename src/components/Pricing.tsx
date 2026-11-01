import React, { useEffect, useState } from 'react';
import { GoService } from '../services/GoService';
import { useLang } from '../contexts/LangContext';

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

interface Props {
  isLoggedIn: boolean;
  onLogin: () => void;
  showToast: (msg: string) => void;
}

export default function Pricing({ isLoggedIn, onLogin, showToast }: Props) {
  const { t } = useLang();
  const [subInfo, setSubInfo] = useState<SubInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const PLANS = [
    {
      id: 'starter',
      name: 'Starter',
      price: 9,
      quota: 5,
      features: [t('planFeatureStarter1'), t('planFeatureStarter2'), t('planFeatureStarter3')],
      color: '#6c757d',
      badge: t('planBadgeEssentiel'),
    },
    {
      id: 'voyageur',
      name: 'Voyageur',
      price: 19,
      quota: 20,
      features: [t('planFeatureVoyageur1'), t('planFeatureVoyageur2'), t('planFeatureVoyageur3'), t('planFeatureVoyageur4')],
      color: 'var(--green-mid)',
      badge: t('planBadgePopulaire'),
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29,
      quota: null,
      features: [t('planFeaturePro1'), t('planFeaturePro2'), t('planFeaturePro3'), t('planFeaturePro4'), t('planFeaturePro5')],
      color: '#b8860b',
      badge: t('planBadgeMeilleur'),
    },
  ];

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
        <h2 className="fw-bold mb-2">{t('pricingTitle')}</h2>
        <p className="text-muted">{t('pricingSubtitle')}</p>
        <p className="text-muted" style={{ fontSize: 13 }}>
          {t('pricingPerPub')} <strong>3€</strong> {t('pricingPerPubSuffix')}
        </p>
      </div>

      {activePlan && (
        <div className="alert alert-success text-center mb-4" style={{ maxWidth: 600, margin: '0 auto 24px' }}>
          ✅ {t('pricingActiveSub')} <strong>{PLANS.find(p => p.id === activePlan)?.name}</strong> {t('pricingActiveSubSuffix')}
          {subInfo?.quota && (
            <span> — {subInfo.remaining}/{subInfo.quota} {t('pricingRemaining')}</span>
          )}
          {!subInfo?.quota && <span> — {t('pricingUnlimited')}</span>}
          <br />
          <button className="btn btn-sm btn-outline-success mt-2" onClick={openPortal} disabled={loading}>
            {t('pricingManage')}
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
                <div className="card-body p-4 d-flex flex-column">
                  <h5 className="fw-bold mb-1">{plan.name}</h5>
                  <div className="mb-3">
                    <span style={{ fontSize: 36, fontWeight: 700, color: plan.color }}>{plan.price}€</span>
                    <span className="text-muted"> {t('pricingPerMonth')}</span>
                  </div>
                  <ul className="list-unstyled mb-4 flex-grow-1">
                    {plan.features.map((f) => (
                      <li key={f} className="mb-2" style={{ fontSize: 14 }}>
                        ✓ {f}
                      </li>
                    ))}
                  </ul>
                  {isActive ? (
                    <button className="btn w-100 btn-outline-success" onClick={openPortal} disabled={loading}>
                      {t('pricingManage')}
                    </button>
                  ) : (
                    <button
                      className="btn w-100 text-white fw-bold"
                      style={{ background: plan.color }}
                      onClick={() => subscribe(plan.id)}
                      disabled={loading}
                    >
                      {isLoggedIn ? `${t('pricingSubscribe')} — ${plan.price}€/${t('pricingPerMonth').replace('/ ', '')}` : t('pricingLoginFirst')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-muted mt-4" style={{ fontSize: 12 }}>
        {t('pricingFooter')}
      </p>
    </div>
  );
}
