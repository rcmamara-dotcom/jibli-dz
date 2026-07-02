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
  const d = new Date(trip.date + 'T12:00:00');
  const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const wa = formatWA(trip.wa, `Bonjour ${trip.name}, j'ai vu votre trajet ${trip.from_city}→${trip.to_city} le ${dateStr} sur JIBLI DZ. Est-ce que vous pouvez transporter mon colis ?`);

  return (
    <div className="modal-backdrop-custom" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="modal-title-custom">{trip.from_city} → {trip.to_city}</div>
          <button className="btn-close" onClick={onClose} aria-label="Fermer" />
        </div>
        <div className="d-flex flex-column gap-3">
          <div className="card border-0 bg-light rounded-3 p-3">
            <div className="text-muted mb-1" style={{ fontSize: 13 }}>Voyageur</div>
            <div className="fw-semibold" style={{ fontSize: 16 }}>{trip.name}</div>
          </div>
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
                <div className="fw-black" style={{ fontSize: 22, color: 'var(--green-mid)' }}>{trip.capacity}</div>
              </div>
            </div>
            <div className="col">
              <div className="card border-0 bg-light rounded-3 p-3 text-center h-100">
                <div className="text-muted mb-1" style={{ fontSize: 12 }}>Poids max</div>
                <div className="fw-black" style={{ fontSize: 22, color: 'var(--green-mid)' }}>{trip.weight ? trip.weight + ' kg' : '—'}</div>
              </div>
            </div>
          </div>
          {trip.cap_desc && (
            <div className="rounded-3 p-3" style={{ background: 'var(--gold-light)', fontSize: 13, lineHeight: 1.5 }}>
              <strong>Capacité &amp; conditions :</strong><br />{trip.cap_desc}
            </div>
          )}
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-wa w-100 py-3" style={{ fontSize: 15 }}>
            💬 Contacter sur WhatsApp
          </a>
          {canDelete && (
            <button className="btn btn-outline-danger w-100" onClick={onDelete}>🗑 Supprimer mon trajet</button>
          )}
          <p className="text-muted text-center mb-0" style={{ fontSize: 11 }}>
            Le contact se fait directement via WhatsApp. JIBLI DZ n'intervient pas dans la transaction.
          </p>
        </div>
      </div>
    </div>
  );
}
