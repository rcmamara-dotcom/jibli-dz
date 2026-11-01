import React from 'react';
import { Parcel } from '../types';
import { formatWA } from '../utils/whatsapp';
import { isDemo } from '../mocks/demo';
import { useLang } from '../contexts/LangContext';

interface Props {
  parcel: Parcel;
  mine: boolean;
  onDelete: () => void;
}

export default function ParcelCard({ parcel: p, mine, onDelete }: Props) {
  const { t } = useLang();
  const demo = isDemo(p);
  const wa = formatWA(p.wa, `Bonjour, j'ai vu votre colis ${p.from_city}→${p.to_city} sur JIBLI DZ. Je fais ce trajet et je peux vous aider !`);

  return (
    <div className="card parcel-card shadow-sm border">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="parcel-route d-flex align-items-center gap-2">
            <span>{p.from_city}</span>
            <span style={{ color: 'var(--gold)', fontSize: 20 }}>→</span>
            <span>{p.to_city}</span>
          </div>
          {demo
            ? <span className="badge text-bg-warning" style={{ fontSize: 11 }}>🧪 {t('demoBadge')}</span>
            : mine && <span className="mine-tag">MON ANNONCE</span>}
        </div>
        <p className="text-muted mb-2" style={{ fontSize: 14, lineHeight: 1.5 }}>{p.description}</p>
        <div className="budget-tag">💶 Budget : {p.budget}€</div>
        <div className="d-flex gap-2 flex-wrap mt-3">
          {demo
            ? <button className="btn btn-sm btn-wa" disabled>💬 Contacter sur WhatsApp</button>
            : <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-wa">💬 Contacter sur WhatsApp</a>}
          {mine && <button className="btn btn-sm btn-outline-danger" onClick={onDelete}>🗑 Supprimer</button>}
        </div>
      </div>
    </div>
  );
}
