import React, { useState, useEffect, useRef } from 'react';
import { GoService } from '../services/GoService';
import { Conversation, Message } from '../types';
import { useLang } from '../contexts/LangContext';

const T = {
  fr: {
    title: 'Messages',
    noConv: 'Aucune conversation pour le moment.',
    noConvHint: 'Contacte un voyageur ou un expéditeur depuis une annonce.',
    you: 'Vous',
    send: 'Envoyer',
    placeholder: 'Votre message…',
    back: '← Retour',
    trip: 'Trajet',
    parcel: 'Colis',
    unread: (n: number) => `${n} non lu${n > 1 ? 's' : ''}`,
    loading: 'Chargement…',
    error: 'Erreur de chargement',
    errorSend: 'Envoi impossible',
  },
  ar: {
    title: 'الرسائل',
    noConv: 'لا توجد محادثات بعد.',
    noConvHint: 'تواصل مع مسافر أو مرسل من إعلان.',
    you: 'أنت',
    send: 'إرسال',
    placeholder: 'رسالتك…',
    back: 'رجوع →',
    trip: 'رحلة',
    parcel: 'طرد',
    unread: (n: number) => `${n} غير مقروء`,
    loading: 'جارٍ التحميل…',
    error: 'خطأ في التحميل',
    errorSend: 'تعذر الإرسال',
  },
  en: {
    title: 'Messages',
    noConv: 'No conversations yet.',
    noConvHint: 'Contact a traveller or sender from a listing.',
    you: 'You',
    send: 'Send',
    placeholder: 'Your message…',
    back: '← Back',
    trip: 'Trip',
    parcel: 'Parcel',
    unread: (n: number) => `${n} unread`,
    loading: 'Loading…',
    error: 'Loading error',
    errorSend: 'Could not send',
  },
};

interface Props {
  userId: number | null;
  onLogin: () => void;
}

export default function Messaging({ userId, onLogin }: Props) {
  const { lang } = useLang();
  const t = T[lang] ?? T.fr;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    GoService.get<Conversation[]>('/api/conversations')
      .then(setConversations)
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!activeConv) return;
    GoService.get<Message[]>(`/api/conversations/${activeConv.id}/messages`).then((msgs) => {
      setMessages(msgs);
      // marquer comme lus localement
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConv.id ? { ...c, unread_count: 0 } : c))
      );
    });
  }, [activeConv]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Polling simple toutes les 8s quand une conversation est ouverte
  useEffect(() => {
    if (!activeConv) return;
    const id = setInterval(() => {
      GoService.get<Message[]>(`/api/conversations/${activeConv.id}/messages`).then(setMessages);
    }, 8000);
    return () => clearInterval(id);
  }, [activeConv]);

  const sendMessage = () => {
    if (!input.trim() || !activeConv || sending) return;
    setSending(true);
    GoService.post<Message>(`/api/conversations/${activeConv.id}/messages`, { content: input.trim() })
      .then((msg) => {
        setMessages((prev) => [...prev, msg]);
        setInput('');
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConv.id
              ? { ...c, last_message: msg.content, last_message_at: msg.created_at }
              : c
          )
        );
      })
      .catch(() => alert(t.errorSend))
      .finally(() => setSending(false));
  };

  if (!userId) {
    return (
      <div className="container-xxl py-4 px-3">
        <div className="text-center py-5 text-muted">
          🔒 <a onClick={onLogin} style={{ cursor: 'pointer' }}>Connecte-toi</a> pour accéder à tes messages.
        </div>
      </div>
    );
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  };

  if (activeConv) {
    return (
      <div className="container-xxl py-3 px-3 px-lg-4">
        <div className="mx-auto" style={{ maxWidth: 680 }}>
          <button className="btn btn-link text-muted p-0 mb-3" onClick={() => setActiveConv(null)}>
            {t.back}
          </button>
          <div className="card shadow-sm border-0 overflow-hidden" style={{ display: 'flex', flexDirection: 'column', height: '65vh' }}>
            <div className="p-3 border-bottom" style={{ background: 'var(--bs-light, #f8f9fa)' }}>
              <div className="fw-semibold">{activeConv.other_user_name ?? '—'}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>
                {activeConv.trip_id ? `📍 ${t.trip} #${activeConv.trip_id}` : `📦 ${t.parcel} #${activeConv.parcel_id}`}
              </div>
            </div>
            <div className="flex-grow-1 p-3 overflow-auto" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {messages.map((msg) => {
                const mine = msg.sender_id === userId;
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                    <div
                      style={{
                        maxWidth: '75%',
                        padding: '8px 12px',
                        borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: mine ? '#1a6b3c' : 'var(--bs-light, #f0f0f0)',
                        color: mine ? '#fff' : 'inherit',
                        fontSize: 14,
                      }}
                    >
                      <div>{msg.content}</div>
                      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2, textAlign: 'right' }}>
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="p-3 border-top d-flex gap-2">
              <input
                className="form-control"
                placeholder={t.placeholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              />
              <button className="btn btn-green px-3" onClick={sendMessage} disabled={sending || !input.trim()}>
                {t.send}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-xxl py-4 px-3 px-lg-4">
      <div className="mx-auto" style={{ maxWidth: 680 }}>
        <h2 className="form-title mb-4">💬 {t.title}</h2>
        {loading && <p className="text-muted">{t.loading}</p>}
        {!loading && conversations.length === 0 && (
          <div className="text-center py-5">
            <div style={{ fontSize: 48 }}>💬</div>
            <p className="text-muted mt-2">{t.noConv}</p>
            <p className="text-muted" style={{ fontSize: 13 }}>{t.noConvHint}</p>
          </div>
        )}
        <div className="d-flex flex-column gap-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="card shadow-sm border-0 p-3"
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveConv(conv)}
            >
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="fw-semibold">{conv.other_user_name ?? '—'}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {conv.trip_id ? `📍 ${t.trip} #${conv.trip_id}` : `📦 ${t.parcel} #${conv.parcel_id}`}
                  </div>
                  {conv.last_message && (
                    <div className="text-muted mt-1" style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 320 }}>
                      {conv.last_message}
                    </div>
                  )}
                </div>
                <div className="text-end" style={{ flexShrink: 0 }}>
                  {conv.last_message_at && (
                    <div className="text-muted" style={{ fontSize: 11 }}>{formatTime(conv.last_message_at)}</div>
                  )}
                  {conv.unread_count > 0 && (
                    <span className="badge bg-success mt-1">{conv.unread_count}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
