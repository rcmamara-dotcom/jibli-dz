import React from 'react';
import { Parcel } from '../types';
import { formatWA } from '../utils/whatsapp';

interface Props {
  parcel: Parcel;
  mine: boolean;
  onDelete: () => void;
}

export default function ParcelCard({ parcel: p, mine, onDelete }: Props) {
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
