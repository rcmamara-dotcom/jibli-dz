import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { GoService } from '../services/GoService';
import { useLang } from '../contexts/LangContext';
import { Avatar } from './messagingUtils';

interface Props {
  tripId?: number;
  parcelId?: number;
  recipientName: string | null;
  context?: string;
  userId: number | null;
  onLogin: () => void;
  onClose: () => void;
  onConversationOpen?: (convId: number) => void;
}

const T = {
  fr: {
    title: 'Nouveau message',
    to: (name: string | null) => (name ? `À ${name}` : "À l'annonceur"),
    placeholder: 'Présente-toi et explique ta demande…',
    send: 'Envoyer',
    sending: 'Envoi…',
    cancel: 'Annuler',
    loginNote: 'Connecte-toi pour envoyer un message.',
    login: 'Se connecter',
    success: 'Message envoyé !',
    successHint: 'Ouverture de la conversation…',
    error: 'Envoi impossible. Réessaie.',
    hint: 'Ctrl+Entrée pour envoyer',
    close: 'Fermer',
    tripSuggestions: [
      'Bonjour, vous avez encore de la place pour un colis ?',
      'Bonjour, quel est votre tarif au kilo ?',
      'Bonjour, où peut-on se retrouver pour la remise ?',
    ],
    parcelSuggestions: [
      'Bonjour, je peux transporter votre colis.',
      'Bonjour, quelles sont les dimensions exactes ?',
      'Bonjour, quand doit-il être livré ?',
    ],
  },
  ar: {
    title: 'رسالة جديدة',
    to: (name: string | null) => (name ? `إلى ${name}` : 'إلى صاحب الإعلان'),
    placeholder: 'عرّف بنفسك واشرح طلبك…',
    send: 'إرسال',
    sending: 'جارٍ الإرسال…',
    cancel: 'إلغاء',
    loginNote: 'سجّل الدخول لإرسال رسالة.',
    login: 'تسجيل الدخول',
    success: 'تم إرسال الرسالة!',
    successHint: 'جارٍ فتح المحادثة…',
    error: 'تعذر الإرسال. حاول مرة أخرى.',
    hint: 'Ctrl+Enter للإرسال',
    close: 'إغلاق',
    tripSuggestions: [
      'مرحبا، هل لديك مكان لطرد؟',
      'مرحبا، كم السعر للكيلو؟',
      'مرحبا، أين يمكننا الالتقاء للتسليم؟',
    ],
    parcelSuggestions: [
      'مرحبا، يمكنني نقل طردك.',
      'مرحبا، ما هي المقاسات بالضبط؟',
      'مرحبا، متى يجب أن يصل؟',
    ],
  },
  en: {
    title: 'New message',
    to: (name: string | null) => (name ? `To ${name}` : 'To the advertiser'),
    placeholder: 'Introduce yourself and explain your request…',
    send: 'Send',
    sending: 'Sending…',
    cancel: 'Cancel',
    loginNote: 'Sign in to send a message.',
    login: 'Sign in',
    success: 'Message sent!',
    successHint: 'Opening the conversation…',
    error: 'Could not send. Please try again.',
    hint: 'Ctrl+Enter to send',
    close: 'Close',
    tripSuggestions: [
      'Hello, do you still have room for a parcel?',
      'Hello, what is your price per kilo?',
      'Hello, where can we meet for the hand-over?',
    ],
    parcelSuggestions: [
      'Hello, I can carry your parcel.',
      'Hello, what are the exact dimensions?',
      'Hello, when does it need to arrive?',
    ],
  },
};

export default function ContactModal({ tripId, parcelId, recipientName, context, userId, onLogin, onClose, onConversationOpen }: Props) {
  const { lang } = useLang();
  const t = T[lang] ?? T.fr;
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const textRef = useRef<HTMLTextAreaElement>(null);
  const suggestions = tripId ? t.tripSuggestions : t.parcelSuggestions;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const send = () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setError('');
    GoService.post<{ id: number }>('/api/conversations', {
      trip_id: tripId ?? null,
      parcel_id: parcelId ?? null,
      message: text.trim(),
    })
      .then((conv) => {
        setSent(true);
        setTimeout(() => {
          onClose();
          onConversationOpen?.(conv.id);
        }, 900);
      })
      .catch(() => setError(t.error))
      .finally(() => setSending(false));
  };

  const pick = (s: string) => {
    setText(s);
    textRef.current?.focus();
  };

  // Portail : les cartes ont un transform au survol, qui casserait le position: fixed
  return createPortal(
    <div className="modal-backdrop-custom" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="modal-box contact-box" role="dialog" aria-modal="true" aria-label={t.title} onClick={(e) => e.stopPropagation()}>
        <div className="d-flex align-items-center gap-3 mb-3">
          <Avatar name={recipientName ?? (tripId ? '✈' : '📦')} size={46} />
          <div className="flex-grow-1 min-w-0">
            <div className="modal-title-custom" style={{ fontSize: 18 }}>{t.title}</div>
            <div className="text-muted text-truncate" style={{ fontSize: 13 }}>
              {t.to(recipientName)}{context && <> · {tripId ? '✈️' : '📦'} {context}</>}
            </div>
          </div>
          <button type="button" className="btn-close" aria-label={t.close} onClick={onClose} />
        </div>

        {!userId ? (
          <div className="text-center py-3">
            <p className="text-muted mb-3">{t.loginNote}</p>
            <button className="btn btn-green px-4" onClick={() => { onClose(); onLogin(); }}>{t.login}</button>
          </div>
        ) : sent ? (
          <div className="contact-sent">
            <div className="contact-sent-check" aria-hidden>✓</div>
            <div className="fw-semibold" style={{ fontSize: 17 }}>{t.success}</div>
            <div className="text-muted" style={{ fontSize: 13 }}>{t.successHint}</div>
          </div>
        ) : (
          <>
            <div className="contact-suggestions">
              {suggestions.map((s) => (
                <button key={s} type="button" className={'chip' + (text === s ? ' active' : '')} onClick={() => pick(s)}>{s}</button>
              ))}
            </div>
            <div className="contact-field">
              <textarea
                ref={textRef}
                className="form-control"
                rows={4}
                dir="auto"
                maxLength={2000}
                placeholder={t.placeholder}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(); }}
                autoFocus
              />
              <div className="contact-field-foot">
                <span>{t.hint}</span>
                <span>{text.length}/2000</span>
              </div>
            </div>
            {error && <div className="alert alert-danger py-2 mt-2 mb-0" style={{ fontSize: 13 }}>⚠️ {error}</div>}
            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-outline-secondary" onClick={onClose}>{t.cancel}</button>
              <button className="btn btn-green flex-grow-1 fw-semibold" onClick={send} disabled={sending || !text.trim()}>
                {sending ? <><span className="spinner-border spinner-border-sm me-2" aria-hidden />{t.sending}</> : <>{t.send} ➤</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
