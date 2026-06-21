import React from 'react';
import { Trip } from '../types';
import { formatWA } from '../utils/whatsapp';

interface Props {
  trip: Trip;
  mine: boolean;
  onOpen: () => void;
  onDelete: () => void;
}

export default function TripCard({ trip: t, mine, onOpen, onDelete }: Props) {
  const d = new Date(t.date);
  const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  const isUpcoming = d >= new Date(new Date().toDateString());
  const wa = formatWA(t.wa, `Bonjour ${t.name}, j'ai vu votre trajet ${t.from}→${t.to} sur JIBLI DZ. Est-ce que vous pouvez transporter mon colis ?`);

  return (
    <div className="trip-card" onClick={onOpen}>
      <div className="trip-route">
        <span>{t.from}</span><span className="trip-arrow">→</span><span>{t.to}</span>
        {mine
          ? <span className="mine-tag">MON ANNONCE</span>
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
