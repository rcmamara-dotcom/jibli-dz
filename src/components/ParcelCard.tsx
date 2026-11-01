import React from 'react';
import { Parcel } from '../types';
import { formatWA } from '../utils/whatsapp';
import { isDemo } from '../mocks/demo';
import { useLang } from '../contexts/LangContext';
import { PARCEL_TYPE_LABELS, parcelSize } from '../constants/parcelTypes';

interface Props {
  parcel: Parcel;
  mine: boolean;
  onDelete: () => void;
}

const SIZE_KEYS = { small: 'sizeSmall', medium: 'sizeMedium', large: 'sizeLarge' } as const;

export default function ParcelCard({ parcel: p, mine, onDelete }: Props) {
  const { t, lang } = useLang();
  const demo = isDemo(p);
  const wa = formatWA(p.wa, `Bonjour, j'ai vu votre colis ${p.from_city}→${p.to_city} sur JIBLI DZ. Je fais ce trajet et je peux vous aider !`);
  const type = p.parcel_type ? PARCEL_TYPE_LABELS[p.parcel_type] : null;
  const size = parcelSize(p);
  const dims = p.length && p.width && p.height ? `${p.length} × ${p.width} × ${p.height} cm` : null;
  const days = Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86_400_000);
  const posted = days <= 0 ? t('parcelToday') : t('parcelDaysAgo').replace('{n}', String(days));

  return (
    <div className="card parcel-card shadow-sm border h-100">
      <div className="card-body d-flex flex-column">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
          <div className="parcel-route d-flex align-items-center gap-2">
            <span>{p.from_city}</span>
            <span style={{ color: 'var(--gold)', fontSize: 20 }}>→</span>
            <span>{p.to_city}</span>
          </div>
          {demo
            ? <span className="badge text-bg-warning" style={{ fontSize: 11 }}>🧪 {t('demoBadge')}</span>
            : mine && <span className="mine-tag">{t('mineTag')}</span>}
        </div>

        {(type || size) && (
          <div className="d-flex flex-wrap gap-2 mb-2">
            {type && <span className="parcel-chip">{type.icon} {type[lang]}</span>}
            {size && <span className={`parcel-chip size-${size}`}>📏 {t(SIZE_KEYS[size])}</span>}
          </div>
        )}

        <p className="text-muted mb-2" style={{ fontSize: 14, lineHeight: 1.5 }}>{p.description}</p>

        {(p.weight != null || dims) && (
          <div className="d-flex flex-wrap gap-3 text-muted mb-2" style={{ fontSize: 13 }}>
            {p.weight != null && <span>⚖️ {p.weight} kg</span>}
            {dims && <span>📐 {dims}</span>}
          </div>
        )}

        <div className="d-flex align-items-center justify-content-between gap-2 mt-auto pt-2">
          <div className="budget-tag">
            💶 {t('parcelBudget')} : {p.budget > 0 ? `${p.budget}€` : t('parcelBudgetFree')}
          </div>
          <span className="text-muted" style={{ fontSize: 12 }}>🕒 {t('parcelPosted')} {posted}</span>
        </div>

        <div className="d-flex gap-2 flex-wrap mt-3">
          {demo
            ? <button className="btn btn-sm btn-wa" disabled>💬 {t('parcelContact')}</button>
            : <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-wa">💬 {t('parcelContact')}</a>}
          {mine && <button className="btn btn-sm btn-outline-danger" onClick={onDelete}>🗑 {t('btnDelete')}</button>}
        </div>
      </div>
    </div>
  );
}
