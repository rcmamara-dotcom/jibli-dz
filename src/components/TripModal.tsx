import React from 'react';
import { Trip } from '../types';
import { formatWA } from '../utils/whatsapp';

interface Props {
  trip: Trip;
  canDelete: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export default function TripModal({ trip, canDelete, onClose, onDelete }: Props) {
  const d = new Date(trip.date);
  const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const wa = formatWA(trip.wa, `Bonjour ${trip.name}, j'ai vu votre trajet ${trip.from_city}→${trip.to_city} le ${dateStr} sur JIBLI DZ. Est-ce que vous pouvez transporter mon colis ?`);

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{trip.from_city} → {trip.to_city}</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'var(--card)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>Voyageur</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{trip.name}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: 'var(--card)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Date départ</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{dateStr}</div>
            </div>
            <div style={{ flex: 1, background: 'var(--card)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Colis</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--green-mid)' }}>{trip.capacity}</div>
            </div>
            <div style={{ flex: 1, background: 'var(--card)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Poids max</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--green-mid)' }}>{trip.weight ? trip.weight + ' kg' : '—'}</div>
            </div>
          </div>
          {trip.cap_desc && (
            <div style={{ background: 'var(--gold-light)', borderRadius: 10, padding: 14, fontSize: 13, lineHeight: 1.5 }}>
              <strong>Capacité &amp; conditions :</strong><br />{trip.cap_desc}
            </div>
          )}
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-wa btn-full" style={{ fontSize: 15 }}>💬 Contacter sur WhatsApp</a>
          {canDelete && <button className="btn btn-danger btn-full" onClick={onDelete}>🗑 Supprimer mon trajet</button>}
          <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>Le contact se fait directement via WhatsApp. JIBLI DZ n'intervient pas dans la transaction.</p>
        </div>
      </div>
    </div>
  );
}
