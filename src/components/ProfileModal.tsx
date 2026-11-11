import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { GoService } from '../services/GoService';
import { useLang } from '../contexts/LangContext';
import { Profile } from '../types';
import { Avatar, parseDate } from './messagingUtils';
import { StarInput, Stars } from './StarRating';

const T = {
  fr: {
    since: (d: string) => `Membre depuis ${d}`,
    reviews: (n: number) => `${n} avis`,
    noReviews: 'Pas encore d’avis',
    rateTitle: (name: string) => `Comment s’est passé l’échange avec ${name} ?`,
    yourRating: 'Ta note',
    edit: 'Modifier',
    remove: 'Retirer',
    comment: 'Un mot sur ton expérience (facultatif)',
    publish: 'Publier ma note',
    update: 'Mettre à jour',
    cancel: 'Annuler',
    pick: 'Choisis une note',
    saved: 'Merci pour ta note !',
    needExchange: (name: string) => `Tu pourras noter ${name} après avoir échangé des messages ensemble.`,
    login: 'Connecte-toi pour noter',
    close: 'Fermer',
    error: 'Impossible de charger le profil.',
    labels: ['', 'Très mauvais', 'Décevant', 'Correct', 'Bien', 'Excellent'],
  },
  ar: {
    since: (d: string) => `عضو منذ ${d}`,
    reviews: (n: number) => `${n} تقييم`,
    noReviews: 'لا توجد تقييمات بعد',
    rateTitle: (name: string) => `كيف كانت تجربتك مع ${name}؟`,
    yourRating: 'تقييمك',
    edit: 'تعديل',
    remove: 'حذف',
    comment: 'كلمة عن تجربتك (اختياري)',
    publish: 'نشر التقييم',
    update: 'تحديث',
    cancel: 'إلغاء',
    pick: 'اختر تقييما',
    saved: 'شكرا على تقييمك!',
    needExchange: (name: string) => `يمكنك تقييم ${name} بعد تبادل الرسائل معه.`,
    login: 'سجّل الدخول للتقييم',
    close: 'إغلاق',
    error: 'تعذر تحميل الملف.',
    labels: ['', 'سيئ جدا', 'مخيب', 'مقبول', 'جيد', 'ممتاز'],
  },
  en: {
    since: (d: string) => `Member since ${d}`,
    reviews: (n: number) => `${n} review${n > 1 ? 's' : ''}`,
    noReviews: 'No reviews yet',
    rateTitle: (name: string) => `How did it go with ${name}?`,
    yourRating: 'Your rating',
    edit: 'Edit',
    remove: 'Remove',
    comment: 'A word about your experience (optional)',
    publish: 'Post my rating',
    update: 'Update',
    cancel: 'Cancel',
    pick: 'Pick a rating',
    saved: 'Thanks for your rating!',
    needExchange: (name: string) => `You can rate ${name} once you have exchanged messages.`,
    login: 'Sign in to rate',
    close: 'Close',
    error: 'Could not load the profile.',
    labels: ['', 'Very bad', 'Disappointing', 'OK', 'Good', 'Excellent'],
  },
};

interface Props {
  userId: number;
  viewerId: number | null;
  onClose: () => void;
  onLogin?: () => void;
  onRated?: (p: Profile) => void;
}

export default function ProfileModal({ userId, viewerId, onClose, onLogin, onRated }: Props) {
  const { lang } = useLang();
  const t = T[lang] ?? T.fr;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    GoService.get<Profile>(`/api/users/${userId}/profile`)
      .then((p) => { setProfile(p); setRating(p.my_review?.rating ?? 0); setComment(p.my_review?.comment ?? ''); })
      .catch(() => setFailed(true));
  }, [userId, viewerId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = () => {
    if (!rating) { setNotice(t.pick); return; }
    setBusy(true);
    setNotice('');
    GoService.put<Profile>(`/api/users/${userId}/review`, { rating, comment: comment.trim() || null })
      .then((p) => { setProfile(p); setEditing(false); setNotice(t.saved); onRated?.(p); })
      .catch((e) => setNotice('⚠️ ' + ((e as { detail?: string })?.detail ?? 'Erreur')))
      .finally(() => setBusy(false));
  };

  const remove = () => {
    setBusy(true);
    GoService.delete(`/api/users/${userId}/review`)
      .then(() => GoService.get<Profile>(`/api/users/${userId}/profile`).then((p) => {
        setProfile(p); setRating(0); setComment(''); onRated?.(p);
      }))
      .finally(() => setBusy(false));
  };

  const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions) => parseDate(iso).toLocaleDateString(lang, opts);
  const isMe = viewerId === userId;
  const showForm = profile && !isMe && profile.can_review && (editing || !profile.my_review);

  return createPortal(
    <div className="modal-backdrop-custom" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="modal-box profile-box" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="btn-close profile-close" aria-label={t.close} onClick={onClose} />

        {!profile && !failed && (
          <div className="profile-head" aria-hidden>
            <span className="msg-avatar skeleton" style={{ width: 72, height: 72 }} />
            <span className="skeleton skeleton-line" style={{ width: 140, height: 16 }} />
          </div>
        )}
        {failed && <div className="text-muted text-center py-4">{t.error}</div>}

        {profile && (
          <>
            <div className="profile-head">
              <Avatar name={profile.name} size={72} />
              <div className="profile-name">{profile.name}</div>
              <div className="text-muted" style={{ fontSize: 13 }}>
                {t.since(fmtDate(profile.member_since, { month: 'long', year: 'numeric' }))}
              </div>
            </div>

            <div className="profile-score">
              <div className="profile-score-main">
                {profile.avg !== null ? (
                  <>
                    <div className="profile-avg">{profile.avg.toLocaleString(lang, { minimumFractionDigits: 1 })}<span>★</span></div>
                    <div className="text-muted" style={{ fontSize: 13 }}>{t.reviews(profile.count)}</div>
                  </>
                ) : (
                  <div className="text-muted py-2" style={{ fontSize: 14 }}>✨ {t.noReviews}</div>
                )}
              </div>
              {profile.count > 0 && (
                <div className="profile-bars">
                  {[5, 4, 3, 2, 1].map((n) => {
                    const c = profile.distribution[String(n)] ?? 0;
                    return (
                      <div key={n} className="profile-bar-row">
                        <span>{n}</span>
                        <div className="profile-bar"><div style={{ width: `${(c / profile.count) * 100}%` }} /></div>
                        <span className="text-muted">{c}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {!isMe && (
              <div className="profile-rate">
                {!viewerId ? (
                  <button className="btn btn-green w-100" onClick={() => { onClose(); onLogin?.(); }}>★ {t.login}</button>
                ) : showForm ? (
                  <>
                    <div className="fw-semibold mb-2 text-center">{t.rateTitle(profile.name)}</div>
                    <div className="d-flex flex-column align-items-center">
                      <StarInput value={rating} onChange={(v) => { setRating(v); setNotice(''); }} />
                      <div className="profile-rate-label">{t.labels[rating] || ' '}</div>
                    </div>
                    <textarea
                      className="form-control mt-2" rows={2} maxLength={1000} dir="auto"
                      placeholder={t.comment} value={comment} onChange={(e) => setComment(e.target.value)}
                    />
                    <div className="d-flex gap-2 mt-2">
                      {profile.my_review && <button className="btn btn-outline-secondary" onClick={() => setEditing(false)}>{t.cancel}</button>}
                      <button className="btn btn-green flex-grow-1 fw-semibold" disabled={busy} onClick={submit}>
                        {profile.my_review ? t.update : t.publish}
                      </button>
                    </div>
                  </>
                ) : profile.my_review ? (
                  <div className="profile-mine">
                    <span className="text-muted">{t.yourRating}</span>
                    <Stars value={profile.my_review.rating} size={18} />
                    <span className="flex-grow-1" />
                    {profile.can_review && <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditing(true)}>{t.edit}</button>}
                    <button className="btn btn-sm btn-link text-danger" disabled={busy} onClick={remove}>{t.remove}</button>
                  </div>
                ) : (
                  <div className="text-muted text-center" style={{ fontSize: 13 }}>🔒 {t.needExchange(profile.name)}</div>
                )}
                {notice && <div className="text-center mt-2" style={{ fontSize: 13 }}>{notice}</div>}
              </div>
            )}

            {profile.reviews.length > 0 && (
              <div className="profile-reviews">
                {profile.reviews.map((r) => (
                  <div key={r.id} className="profile-review">
                    <Avatar name={r.reviewer_name} size={36} />
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <strong style={{ fontSize: 14 }}>{r.reviewer_name}</strong>
                        <Stars value={r.rating} size={13} />
                        <span className="text-muted ms-auto" style={{ fontSize: 12 }}>
                          {fmtDate(r.updated_at, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {r.comment && <p className="mb-0 mt-1" dir="auto" style={{ fontSize: 14 }}>{r.comment}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
