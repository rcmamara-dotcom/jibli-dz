import React from 'react';
import { Shipment, ShipmentStatus, SHIPMENT_STEPS } from '../types';
import { useLang } from '../contexts/LangContext';
import type { TKey } from '../i18n/translations';

export const STEP_KEYS: Record<ShipmentStatus, TKey> = {
  deposited: 'stepDeposited',
  accepted: 'stepAccepted',
  picked_up: 'stepPickedUp',
  in_transit: 'stepInTransit',
  arrived: 'stepArrived',
  delivered: 'stepDelivered',
  cancelled: 'stepCancelled',
};

const ICONS: Record<string, string> = {
  deposited: '📝', accepted: '🤝', picked_up: '📦', in_transit: '✈️', arrived: '📍', delivered: '✅',
};

// Barre de progression type « suivi de commande » : un point par étape, rempli jusqu'à l'étape actuelle.
export default function ShipmentSteps({ shipment }: { shipment: Shipment }) {
  const { t, lang } = useLang();
  const dates = new Map(shipment.events.map((e) => [e.status, e.created_at]));
  // Annulé : on garde la progression atteinte avant l'annulation
  const reached = shipment.status === 'cancelled'
    ? [...shipment.events].reverse().find((e) => e.status !== 'cancelled')?.status ?? 'deposited'
    : shipment.status;
  const current = SHIPMENT_STEPS.indexOf(reached as typeof SHIPMENT_STEPS[number]);
  const cancelled = shipment.status === 'cancelled';

  return (
    <ol className={'ship-steps' + (cancelled ? ' cancelled' : '')} aria-label={t(STEP_KEYS[shipment.status])}>
      {SHIPMENT_STEPS.map((step, i) => {
        const date = dates.get(step);
        const cls = ['ship-step', i <= current && 'done', i === current && !cancelled && 'current', i < current && 'next-done']
          .filter(Boolean).join(' ');
        return (
          <li key={step} className={cls} aria-current={i === current ? 'step' : undefined}>
            <span className="ship-dot">{i <= current ? ICONS[step] : ''}</span>
            <span className="ship-text">
              <span className="ship-label">{t(STEP_KEYS[step])}</span>
              {date && i <= current && (
                <span className="ship-date">
                  {new Date(date).toLocaleDateString(lang, { day: 'numeric', month: 'short' })}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
