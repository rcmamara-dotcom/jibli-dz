import React, { useEffect, useState } from 'react';
import { Trip, Review } from '../types';
import { formatWA } from '../utils/whatsapp';
import { GoService } from '../services/GoService';
import { StarDisplay, StarInput } from './StarRating';

interface Props {
  trip: Trip;
  userId: number | null;
  canDelete: boolean;
  onClose: () => void;
  onDelete: () => void;
  onReviewPosted: (updatedTrip: Partial<Trip>) => void;
}

export default function TripModal({ trip, userId, canDelete, onClose, onDelete, onReviewPosted }: Props) {
  const d = new Date(trip.date + 'T12:00:00');
  const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const wa = formatWA(trip.wa, `Bonjour ${trip.name}, j'ai vu votre trajet ${trip.from_city}→${trip.to_city} le ${dateStr} sur JIBLI DZ. Est-ce que vous pouvez transporter mon colis ?`);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    GoService.get<Review[]>(`/api/trips/${trip.id}/reviews`)
      .then((data) => {
        setReviews(data);
        if (userId) setAlreadyReviewed(data.some((r) => r.reviewer_id === userId));
      })
      .catch(() => {});
  }, [trip.id, userId]);

  const isOwnTrip = userId !== null && trip.owner_id === userId;
  const canReview = userId !== null && !isOwnTrip && !alreadyReviewed;

  const submitReview = () => {
    if (rating === 0) { setError('Choisissez une note entre 1 et 5 étoiles'); return; }
    setSubmitting(true);
    setError('');
    GoService.post<Review>(`/api/trips/${trip.id}/reviews`, { rating, comment: comment || null })
      .then((r) => {
        const newReviews = [r, ...reviews];
        setReviews(newReviews);
        setAlreadyReviewed(true);
        setRating(0);
        setComment('');
        const avg = newReviews.reduce((s, x) => s + x.rating, 0) / newReviews.length;
        onReviewPosted({ avg_rating: Math.round(avg * 10) / 10, review_count: newReviews.length });
      })
      .catch((e: any) => setError(e?.detail ?? 'Erreur lors de l\'envoi'))
      .finally(() => setSubmitting(false));
  };

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

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
            <div className="fw-semibold" style={{ fontSize: 16 }}>{trip.name}</div>
            {avgRating !== null && (
              <div className="mt-1">
                <StarDisplay avg={avgRating} count={reviews.length} size={15} />
              </div>
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

          {/* Actions */}
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-wa w-100 py-3" style={{ fontSize: 15 }}>
            💬 Contacter sur WhatsApp
          </a>
          {canDelete && (
            <button className="btn btn-outline-danger w-100" onClick={onDelete}>🗑 Supprimer mon trajet</button>
          )}

          {/* ── Section avis ─────────────────────────────────── */}
          <hr className="my-1" />
          <div>
            <div className="fw-bold mb-3" style={{ fontSize: 16 }}>
              Avis des expéditeurs
              {reviews.length > 0 && <span className="ms-2 badge rounded-pill" style={{ background: 'var(--green-bright)', fontSize: 12 }}>{reviews.length}</span>}
            </div>

            {/* Formulaire d'avis */}
            {canReview && (
              <div className="card border rounded-3 p-3 mb-3" style={{ borderColor: 'var(--border) !important' }}>
                <div className="fw-semibold mb-2" style={{ fontSize: 14 }}>Laisser un avis</div>
                <StarInput value={rating} onChange={setRating} />
                <textarea
                  className="form-control mt-2"
                  rows={2}
                  placeholder="Décrivez votre expérience (optionnel)…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={{ fontSize: 13 }}
                />
                {error && <div className="text-danger mt-1" style={{ fontSize: 13 }}>{error}</div>}
                <button
                  className="btn btn-green mt-2"
                  style={{ fontSize: 13 }}
                  disabled={submitting}
                  onClick={submitReview}
                >
                  {submitting ? '⏳ Envoi…' : '✅ Publier mon avis'}
                </button>
              </div>
            )}

            {alreadyReviewed && (
              <div className="alert alert-success py-2 mb-3" style={{ fontSize: 13 }}>
                ✅ Vous avez déjà laissé un avis pour ce trajet.
              </div>
            )}

            {!userId && (
              <div className="text-muted mb-3" style={{ fontSize: 13 }}>
                🔒 Connectez-vous pour laisser un avis.
              </div>
            )}

            {isOwnTrip && (
              <div className="text-muted mb-3" style={{ fontSize: 13 }}>
                Vous ne pouvez pas noter votre propre trajet.
              </div>
            )}

            {/* Liste des avis */}
            {reviews.length === 0 ? (
              <p className="text-muted" style={{ fontSize: 13 }}>Aucun avis pour l'instant — soyez le premier !</p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {reviews.map((r) => (
                  <div key={r.id} className="card border-0 bg-light rounded-3 p-3">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{r.reviewer_email.split('@')[0]}</span>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {new Date(r.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="mb-1">
                      {[1,2,3,4,5].map((i) => (
                        <span key={i} style={{ color: i <= r.rating ? '#f5a623' : '#d1d5db', fontSize: 15 }}>★</span>
                      ))}
                    </div>
                    {r.comment && <p className="mb-0 text-muted" style={{ fontSize: 13 }}>{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-muted text-center mb-0" style={{ fontSize: 11 }}>
            Le contact se fait directement via WhatsApp. JIBLI DZ n'intervient pas dans la transaction.
          </p>
        </div>
      </div>
    </div>
  );
}
