import React, { useState } from 'react';
import { Trip } from '../types';
// import { formatWA } from '../utils/whatsapp'; // WhatsApp désactivé — messagerie interne
import { isDemo } from '../mocks/demo';
import { useLang } from '../contexts/LangContext';
import { StarDisplay } from './StarRating';
import ContactModal from './ContactModal';

interface Props {
  trip: Trip;
  mine: boolean;
  userId: number | null;
  onOpen: () => void;
  onDelete: () => void;
  onLogin: () => void;
  onMessagesOpen: () => void;
  readonly?: boolean;
}

export default function TripCard({ trip: t, mine, userId, onOpen, onDelete, onLogin, onMessagesOpen, readonly = false }: Props) {
  const d = new Date(t.date + 'T12:00:00');
  const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isUpcoming = d >= today;
  const { t: tr } = useLang();
  const demo = isDemo(t);
  // const wa = formatWA(t.wa, `...`); // WhatsApp désactivé
  const [showContact, setShowContact] = useState(false);

  return (
    <div className="card trip-card shadow-sm border" onClick={onOpen}>
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="trip-route d-flex align-items-center gap-2">
            <span>{t.from_city}</span>
            <span className="trip-arrow">→</span>
            <span>{t.to_city}</span>
          </div>
          {demo
            ? <span className="badge text-bg-warning" style={{ fontSize: 11 }}>🧪 {tr('demoBadge')}</span>
            : mine
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
          {!mine && !readonly && (
            demo
              ? <button className="btn btn-sm btn-green" disabled>💬 Contacter</button>
              : <button className="btn btn-sm btn-green" onClick={() => setShowContact(true)}>💬 Contacter</button>
          )}
          <button className="btn btn-sm btn-outline-secondary" onClick={onOpen}>Voir détails</button>
          {mine && <button className="btn btn-sm btn-outline-danger" onClick={onDelete}>🗑 Supprimer</button>}
        </div>
      </div>
      {showContact && (
        <ContactModal
          tripId={t.id}
          recipientName={t.name}
          userId={userId}
          onLogin={onLogin}
          onClose={() => setShowContact(false)}
          onConversationOpen={() => { setShowContact(false); onMessagesOpen(); }}
        />
      )}
    </div>
  );
}
