import React from 'react';
import { Trip } from '../types';
import { formatWA } from '../utils/whatsapp';
import { StarDisplay } from './StarRating';

interface Props {
  trip: Trip;
  mine: boolean;
  onOpen: () => void;
  onDelete: () => void;
}

export default function TripCard({ trip: t, mine, onOpen, onDelete }: Props) {
  const d = new Date(t.date + 'T12:00:00');
  const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isUpcoming = d >= today;
  const wa = formatWA(t.wa, `Bonjour ${t.name}, j'ai vu votre trajet ${t.from_city}→${t.to_city} sur JIBLI DZ. Est-ce que vous pouvez transporter mon colis ?`);

  return (
    <div className="card trip-card shadow-sm border" onClick={onOpen}>
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="trip-route d-flex align-items-center gap-2">
            <span>{t.from_city}</span>
            <span className="trip-arrow">→</span>
            <span>{t.to_city}</span>
          </div>
          {mine
            ? <span className="mine-tag">MON ANNONCE</span>
            : (!isUpcoming && <span className="badge text-bg-danger" style={{ fontSize: 11 }}>Passé</span>)}
        </div>
        <div className="d-flex flex-wrap gap-3 text-muted mb-2" style={{ fontSize: 13 }}>
          <span>👤 {t.name}</span>
          <span>📅 {dateStr}</span>
          <span>📦 {t.capacity} colis</span>
          {t.weight ? <span>⚖️ {t.weight} kg</span> : null}
        </div>
        <div className="mb-3">
          <StarDisplay avg={t.avg_rating} count={t.review_count} />
        </div>
        {t.cap_desc && <p className="text-muted fst-italic mb-3" style={{ fontSize: 12 }}>"{t.cap_desc}"</p>}
        <div className="d-flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-wa">💬 WhatsApp</a>
          <button className="btn btn-sm btn-outline-secondary" onClick={onOpen}>Voir détails</button>
          {mine && <button className="btn btn-sm btn-outline-danger" onClick={onDelete}>🗑 Supprimer</button>}
        </div>
      </div>
    </div>
  );
}
