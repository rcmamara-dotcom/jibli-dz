import React, { useState } from 'react';
import { Trip } from '../types';
// import { formatWA } from '../utils/whatsapp'; // WhatsApp désactivé — messagerie interne
import { GoService } from '../services/GoService';
import { RatingBadge } from './StarRating';
import ProfileModal from './ProfileModal';
import { useLang } from '../contexts/LangContext';
import { isDemo } from '../mocks/demo';
import ContactModal from './ContactModal';

interface Props {
  trip: Trip;
  userId: number | null;
  canDelete: boolean;
  onClose: () => void;
  onDelete: () => void;
  onShipmentCreated: () => void;
  onLogin: () => void;
  onMessagesOpen: (convId?: number) => void;
}

export default function TripModal({ trip, userId, canDelete, onClose, onDelete, onShipmentCreated, onLogin, onMessagesOpen }: Props) {
  const { t } = useLang();
  const d = new Date(trip.date + 'T12:00:00');
  const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  // const wa = formatWA(trip.wa, `...`); // WhatsApp désactivé
  const [showContact, setShowContact] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const [shipOpen, setShipOpen] = useState(false);
  const [shipDesc, setShipDesc] = useState('');
  const [shipBusy, setShipBusy] = useState(false);
  const [shipError, setShipError] = useState('');

  const isOwnTrip = userId !== null && trip.owner_id === userId;


  const createShipment = () => {
    if (!shipDesc.trim()) { setShipError(t('shipDescPlaceholder')); return; }
    setShipBusy(true);
    setShipError('');
    GoService.post('/api/shipments', { trip_id: trip.id, description: shipDesc.trim() })
      .then(() => onShipmentCreated())
      .catch((e: any) => setShipError(e?.detail ?? 'Erreur'))
      .finally(() => setShipBusy(false));
  };


  return (
    <div className="modal-backdrop-custom" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 600 }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="modal-title-custom">{trip.from_city} → {trip.to_city}</div>
          <button className="btn-close" onClick={onClose} aria-label="Fermer" />
        </div>

        <div className="d-flex flex-column gap-3">
          {/* Voyageur */}
          <div className="card border-0 bg-light rounded-3 p-3">
            <div className="text-muted mb-1" style={{ fontSize: 13 }}>Voyageur</div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="fw-semibold" style={{ fontSize: 16 }}>{trip.name}</span>
              <RatingBadge avg={trip.avg_rating} count={trip.review_count}
                onClick={trip.owner_id ? () => setProfileOpen(true) : undefined} />
            </div>
            {trip.owner_id && (
              <button className="btn btn-link p-0 mt-1 align-self-start" style={{ fontSize: 13, color: 'var(--green-text)' }}
                onClick={() => setProfileOpen(true)}>
                {t('seeProfile')} →
              </button>
            )}
          </div>

          {/* Infos */}
          <div className="row g-2">
            <div className="col">
              <div className="card border-0 bg-light rounded-3 p-3 text-center h-100">
                <div className="text-muted mb-1" style={{ fontSize: 12 }}>Date départ</div>
                <div className="fw-semibold" style={{ fontSize: 13 }}>{dateStr}</div>
              </div>
            </div>
            <div className="col">
              <div className="card border-0 bg-light rounded-3 p-3 text-center h-100">
                <div className="text-muted mb-1" style={{ fontSize: 12 }}>Colis</div>
                <div className="fw-black" style={{ fontSize: 22, color: 'var(--green-text)' }}>{trip.capacity}</div>
              </div>
            </div>
            <div className="col">
              <div className="card border-0 bg-light rounded-3 p-3 text-center h-100">
                <div className="text-muted mb-1" style={{ fontSize: 12 }}>Poids max</div>
                <div className="fw-black" style={{ fontSize: 22, color: 'var(--green-text)' }}>{trip.weight ? trip.weight + ' kg' : '—'}</div>
              </div>
            </div>
          </div>

          {trip.cap_desc && (
            <div className="rounded-3 p-3" style={{ background: 'var(--gold-light)', fontSize: 13, lineHeight: 1.5 }}>
              <strong>Capacité &amp; conditions :</strong><br />{trip.cap_desc}
            </div>
          )}

          {/* Actions */}
          {/* WhatsApp désactivé — messagerie interne
          <a href={isDemo(trip) ? undefined : wa} target="_blank" rel="noopener noreferrer" aria-disabled={isDemo(trip)}
            className={'btn btn-wa w-100 py-3' + (isDemo(trip) ? ' disabled' : '')} style={{ fontSize: 15 }}>
            💬 Contacter sur WhatsApp
          </a>
          */}
          {!isOwnTrip && (
            isDemo(trip)
              ? <button className="btn btn-green w-100 py-3 disabled" style={{ fontSize: 15 }}>💬 Contacter</button>
              : <button className="btn btn-green w-100 py-3" style={{ fontSize: 15 }} onClick={() => setShowContact(true)}>💬 Contacter</button>
          )}
          {showContact && (
            <ContactModal
              tripId={trip.id}
              recipientName={trip.name}
              context={`${trip.from_city} → ${trip.to_city}`}
              userId={userId}
              onLogin={() => { onClose(); onLogin(); }}
              onClose={() => setShowContact(false)}
              onConversationOpen={(id) => { setShowContact(false); onClose(); onMessagesOpen(id); }}
            />
          )}
          {userId !== null && !isOwnTrip && trip.owner_id && (
            shipOpen ? (
              <div className="card border rounded-3 p-3">
                <p className="text-muted mb-2" style={{ fontSize: 13 }}>{t('shipNote')}</p>
                <textarea className="form-control mb-2" rows={2} maxLength={500} placeholder={t('shipDescPlaceholder')}
                  value={shipDesc} onChange={(e) => setShipDesc(e.target.value)} />
                {shipError && <div className="text-danger mb-2" style={{ fontSize: 13 }}>⚠️ {shipError}</div>}
                <button className="btn btn-green w-100" disabled={shipBusy} onClick={createShipment}>{t('btnCreateShipment')}</button>
              </div>
            ) : (
              <button className="btn btn-outline-success w-100 py-2" onClick={() => setShipOpen(true)}>{t('btnShipWithTraveler')}</button>
            )
          )}
          {canDelete && (
            <button className="btn btn-outline-danger w-100" onClick={onDelete}>🗑 Supprimer mon trajet</button>
          )}

          {profileOpen && trip.owner_id && (
            <ProfileModal userId={trip.owner_id} viewerId={userId} onClose={() => setProfileOpen(false)} onLogin={onLogin} />
          )}

          <p className="text-muted text-center mb-0" style={{ fontSize: 11 }}>
            Le contact se fait via la messagerie privée du site. JIBLI DZ n'intervient pas dans la transaction.
          </p>
        </div>
      </div>
    </div>
  );
}
