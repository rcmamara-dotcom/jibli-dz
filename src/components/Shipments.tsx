import React, { useEffect, useState } from 'react';
import { GoService } from '../services/GoService';
import { useLang } from '../contexts/LangContext';
import { Shipment, SHIPMENT_STEPS } from '../types';
import ShipmentSteps, { STEP_KEYS } from './ShipmentSteps';

interface Props {
  isLoggedIn: boolean;
  onLogin: () => void;
  showToast: (m: string) => void;
}

const CANCELLABLE = ['deposited', 'accepted'];
const errMsg = (e: unknown) => '⚠️ ' + ((e as { detail?: string })?.detail ?? 'Erreur');

export default function Shipments({ isLoggedIn, onLogin, showToast }: Props) {
  const { t, lang } = useLang();
  const [list, setList] = useState<Shipment[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    GoService.get<Shipment[]>('/api/shipments').then(setList).catch((e) => { setList([]); showToast(errMsg(e)); });
  }, [isLoggedIn]);

  const setStatus = (s: Shipment, status: string) => {
    if (status === 'cancelled' && !window.confirm(t('confirmCancelShipment'))) return;
    setBusy(s.id);
    GoService.post<Shipment>(`/api/shipments/${s.id}/status`, { status })
      .then((updated) => {
        setList((l) => l?.map((x) => (x.id === updated.id ? updated : x)) ?? null);
        showToast(t('toastStepUpdated'));
      })
      .catch((e) => showToast(errMsg(e)))
      .finally(() => setBusy(null));
  };

  if (!isLoggedIn) {
    return (
      <div className="container py-5 text-center">
        <p className="text-muted">{t('shipmentsLogin')}</p>
        <button className="btn btn-green px-4" onClick={onLogin}>{t('signIn')}</button>
      </div>
    );
  }

  return (
    <div className="container-xxl py-4 px-3 px-lg-4" style={{ maxWidth: 960 }}>
      <div className="section-title mb-3">📍 {t('navShipments')}</div>
      {list === null && <div className="text-center text-muted py-5">⏳</div>}
      {list?.length === 0 && (
        <div className="empty-state"><div className="icon">📍</div><p>{t('shipmentsEmpty')}</p></div>
      )}
      <div className="d-flex flex-column gap-3">
        {list?.map((s) => {
          const idx = SHIPMENT_STEPS.indexOf(s.status as typeof SHIPMENT_STEPS[number]);
          const next = idx >= 0 && idx < SHIPMENT_STEPS.length - 1 ? SHIPMENT_STEPS[idx + 1] : null;
          return (
            <div key={s.id} className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap mb-1">
                  <div className="trip-route">
                    {s.from_city} <span className="trip-arrow">→</span> {s.to_city}
                  </div>
                  <span className={'badge rounded-pill ' + (s.status === 'cancelled' ? 'text-bg-danger' : s.status === 'delivered' ? 'text-bg-success' : 'text-bg-secondary')}>
                    {t(STEP_KEYS[s.status])}
                  </span>
                </div>
                <div className="text-muted mb-3" style={{ fontSize: 13 }}>
                  {s.role === 'sender' ? '📤 ' + t('roleSender') : '🧳 ' + t('roleCarrier')}
                  {s.counterpart_name && <> {t('withPerson')} <strong>{s.counterpart_name}</strong></>}
                  {s.trip_date && <> · {new Date(s.trip_date + 'T12:00:00').toLocaleDateString(lang, { day: 'numeric', month: 'long' })}</>}
                  <div className="mt-1">📦 {s.description}</div>
                </div>

                <ShipmentSteps shipment={s} />

                <div className="d-flex gap-2 flex-wrap mt-3">
                  {s.role === 'carrier' && next && (
                    <button className="btn btn-green" disabled={busy === s.id} onClick={() => setStatus(s, next)}>
                      {t('btnNextStep')} {t(STEP_KEYS[next])}
                    </button>
                  )}
                  {CANCELLABLE.includes(s.status) && (
                    <button className="btn btn-outline-danger" disabled={busy === s.id} onClick={() => setStatus(s, 'cancelled')}>
                      {t('btnCancelShipment')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
