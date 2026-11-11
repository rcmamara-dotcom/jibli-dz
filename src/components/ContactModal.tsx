import React, { useState } from 'react';
import { GoService } from '../services/GoService';
import { useLang } from '../contexts/LangContext';

interface Props {
  tripId?: number;
  parcelId?: number;
  recipientName: string | null;
  userId: number | null;
  onLogin: () => void;
  onClose: () => void;
  onConversationOpen?: (convId: number) => void;
}

const T = {
  fr: {
    title: (name: string | null) => `Envoyer un message à ${name ?? 'l\'annonceur'}`,
    placeholder: 'Bonjour, je suis intéressé par votre annonce…',
    send: 'Envoyer',
    sending: 'Envoi…',
    cancel: 'Annuler',
    loginNote: 'Connecte-toi pour envoyer un message.',
    login: 'Se connecter',
    success: '✅ Message envoyé !',
    error: 'Envoi impossible. Réessaie.',
  },
  ar: {
    title: (name: string | null) => `إرسال رسالة إلى ${name ?? 'صاحب الإعلان'}`,
    placeholder: 'مرحبا، أنا مهتم بإعلانك…',
    send: 'إرسال',
    sending: 'جارٍ الإرسال…',
    cancel: 'إلغاء',
    loginNote: 'سجّل الدخول لإرسال رسالة.',
    login: 'تسجيل الدخول',
    success: '✅ تم إرسال الرسالة!',
    error: 'تعذر الإرسال. حاول مرة أخرى.',
  },
  en: {
    title: (name: string | null) => `Send a message to ${name ?? 'the advertiser'}`,
    placeholder: 'Hello, I am interested in your listing…',
    send: 'Send',
    sending: 'Sending…',
    cancel: 'Cancel',
    loginNote: 'Sign in to send a message.',
    login: 'Sign in',
    success: '✅ Message sent!',
    error: 'Could not send. Please try again.',
  },
};

export default function ContactModal({ tripId, parcelId, recipientName, userId, onLogin, onClose, onConversationOpen }: Props) {
  const { lang } = useLang();
  const t = T[lang] ?? T.fr;
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

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
        }, 1200);
      })
      .catch(() => setError(t.error))
      .finally(() => setSending(false));
  };

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title" style={{ fontSize: 15 }}>{t.title(recipientName)}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body pt-2">
            {!userId ? (
              <div className="text-center py-2">
                <p className="text-muted mb-3">{t.loginNote}</p>
                <button className="btn btn-green" onClick={() => { onClose(); onLogin(); }}>{t.login}</button>
              </div>
            ) : sent ? (
              <div className="text-center py-3" style={{ fontSize: 20 }}>{t.success}</div>
            ) : (
              <>
                <textarea
                  className="form-control mb-3"
                  rows={4}
                  placeholder={t.placeholder}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  autoFocus
                />
                {error && <div className="text-danger mb-2" style={{ fontSize: 13 }}>⚠️ {error}</div>}
                <div className="d-flex gap-2">
                  <button className="btn btn-green flex-grow-1" onClick={send} disabled={sending || !text.trim()}>
                    {sending ? t.sending : t.send}
                  </button>
                  <button className="btn btn-outline-secondary" onClick={onClose}>{t.cancel}</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
