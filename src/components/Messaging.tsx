import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { GoService } from '../services/GoService';
import { Conversation, Message, Trip, Parcel } from '../types';
import { useLang } from '../contexts/LangContext';
import { Avatar, parseDate, listingLabel } from './messagingUtils';
import { RatingBadge } from './StarRating';
import ProfileModal from './ProfileModal';

const T = {
  fr: {
    title: 'Messages',
    search: 'Rechercher une conversation',
    noConv: 'Aucune conversation pour le moment',
    noConvHint: 'Contacte un voyageur ou un expéditeur depuis une annonce pour démarrer.',
    noMatch: 'Aucun résultat',
    pick: 'Sélectionne une conversation',
    pickHint: 'Tes échanges avec les voyageurs et expéditeurs apparaissent ici.',
    you: 'Vous',
    send: 'Envoyer',
    placeholder: 'Écris un message…',
    back: 'Retour',
    trip: 'Trajet',
    parcel: 'Colis',
    today: "Aujourd'hui",
    yesterday: 'Hier',
    error: 'Impossible de charger les messages.',
    retry: 'Réessayer',
    failed: 'Non envoyé · toucher pour réessayer',
    sending: 'Envoi…',
    seen: 'Lu',
    hint: 'Entrée pour envoyer · Maj+Entrée pour aller à la ligne',
    login: 'Connecte-toi',
    loginNote: 'pour accéder à tes messages.',
    safety: 'Pour ta sécurité, garde tes échanges et paiements sur JIBLI DZ.',
    rate: 'Noter',
  },
  ar: {
    title: 'الرسائل',
    search: 'ابحث عن محادثة',
    noConv: 'لا توجد محادثات بعد',
    noConvHint: 'تواصل مع مسافر أو مرسل من إعلان للبدء.',
    noMatch: 'لا توجد نتائج',
    pick: 'اختر محادثة',
    pickHint: 'تظهر هنا محادثاتك مع المسافرين والمرسلين.',
    you: 'أنت',
    send: 'إرسال',
    placeholder: 'اكتب رسالة…',
    back: 'رجوع',
    trip: 'رحلة',
    parcel: 'طرد',
    today: 'اليوم',
    yesterday: 'أمس',
    error: 'تعذر تحميل الرسائل.',
    retry: 'إعادة المحاولة',
    failed: 'لم تُرسل · اضغط لإعادة المحاولة',
    sending: 'جارٍ الإرسال…',
    seen: 'مقروءة',
    hint: 'Enter للإرسال · Shift+Enter لسطر جديد',
    login: 'سجّل الدخول',
    loginNote: 'للوصول إلى رسائلك.',
    safety: 'لأمانك، احتفظ بمحادثاتك ومدفوعاتك على JIBLI DZ.',
    rate: 'تقييم',
  },
  en: {
    title: 'Messages',
    search: 'Search conversations',
    noConv: 'No conversations yet',
    noConvHint: 'Contact a traveller or sender from a listing to get started.',
    noMatch: 'No results',
    pick: 'Select a conversation',
    pickHint: 'Your chats with travellers and senders show up here.',
    you: 'You',
    send: 'Send',
    placeholder: 'Write a message…',
    back: 'Back',
    trip: 'Trip',
    parcel: 'Parcel',
    today: 'Today',
    yesterday: 'Yesterday',
    error: 'Could not load messages.',
    retry: 'Retry',
    failed: 'Not sent · tap to retry',
    sending: 'Sending…',
    seen: 'Seen',
    hint: 'Enter to send · Shift+Enter for a new line',
    login: 'Sign in',
    loginNote: 'to see your messages.',
    safety: 'For your safety, keep chats and payments on JIBLI DZ.',
    rate: 'Rate',
  },
};

const LOCALES = { fr: 'fr-FR', ar: 'ar-DZ', en: 'en-GB' } as const;

// Message affiché tout de suite, avant la réponse du serveur
type LocalMessage = Message & { status?: 'sending' | 'failed' };

interface Props {
  userId: number | null;
  trips: Trip[];
  parcels: Parcel[];
  initialConvId?: number | null;
  onLogin: () => void;
  onRead?: () => void;
}

export default function Messaging({ userId, trips, parcels, initialConvId, onLogin, onRead }: Props) {
  const { lang } = useLang();
  const t = T[lang] ?? T.fr;
  const locale = LOCALES[lang] ?? 'fr-FR';

  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [activeId, setActiveId] = useState<number | null>(initialConvId ?? null);
  const [messages, setMessages] = useState<LocalMessage[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottom = useRef(true);

  const activeConv = conversations?.find((c) => c.id === activeId) ?? null;

  const loadConversations = useCallback(() => {
    GoService.get<Conversation[]>('/api/conversations')
      .then(setConversations)
      .catch(() => setConversations((prev) => prev ?? []));
  }, []);

  useEffect(() => {
    if (!userId) return;
    loadConversations();
    const id = setInterval(loadConversations, 20000);
    return () => clearInterval(id);
  }, [userId, loadConversations]);

  useEffect(() => { if (initialConvId) setActiveId(initialConvId); }, [initialConvId]);

  // Chargement + rafraîchissement du fil ouvert ; garde les messages en cours d'envoi
  useEffect(() => {
    if (!activeId) return;
    setMessages(null);
    setLoadError(false);
    stickToBottom.current = true;
    let first = true;
    const fetchMessages = () =>
      GoService.get<Message[]>(`/api/conversations/${activeId}/messages`)
        .then((msgs) => {
          setMessages((prev) => [...msgs, ...(prev ?? []).filter((m) => m.status)]);
          if (first) {
            first = false;
            setConversations((prev) => prev?.map((c) => (c.id === activeId ? { ...c, unread_count: 0 } : c)) ?? prev);
            onRead?.();
          }
        })
        .catch(() => { if (first) setLoadError(true); });
    fetchMessages();
    const id = setInterval(fetchMessages, 8000);
    return () => clearInterval(id);
  }, [activeId, onRead, reloadKey]);

  // Reste collé en bas sauf si l'utilisateur remonte lire l'historique
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  // Zone de saisie qui grandit avec le texte (5 lignes max)
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
    el.style.overflowY = el.scrollHeight > 140 ? 'auto' : 'hidden';
  }, [input, activeId]);

  const postMessage = (convId: number, local: LocalMessage) => {
    GoService.post<Message>(`/api/conversations/${convId}/messages`, { content: local.content })
      .then((msg) => {
        setMessages((prev) => prev?.map((m) => (m.id === local.id ? msg : m)) ?? prev);
        setConversations((prev) => {
          if (!prev) return prev;
          const updated = prev.map((c) => (c.id === convId ? { ...c, last_message: msg.content, last_message_at: msg.created_at } : c));
          return [...updated.filter((c) => c.id === convId), ...updated.filter((c) => c.id !== convId)];
        });
      })
      .catch(() => setMessages((prev) => prev?.map((m) => (m.id === local.id ? { ...m, status: 'failed' } : m)) ?? prev));
  };

  const send = () => {
    const content = input.trim();
    if (!content || !activeId || !userId) return;
    const local: LocalMessage = {
      id: -Date.now(), sender_id: userId, sender_name: null, content,
      is_read: false, created_at: new Date().toISOString(), status: 'sending',
    };
    stickToBottom.current = true;
    setMessages((prev) => [...(prev ?? []), local]);
    setInput('');
    inputRef.current?.focus();
    postMessage(activeId, local);
  };

  const retry = (m: LocalMessage) => {
    if (!activeId) return;
    setMessages((prev) => prev?.map((x) => (x.id === m.id ? { ...x, status: 'sending' } : x)) ?? prev);
    postMessage(activeId, m);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!conversations) return conversations;
    // L'API trie par date de création : la conversation la plus active doit remonter en tête
    const sorted = [...conversations].sort((a, b) =>
      (b.last_message_at ?? b.created_at).localeCompare(a.last_message_at ?? a.created_at));
    if (!q) return sorted;
    return sorted.filter((c) =>
      [c.other_user_name, c.last_message, listingLabel(c, trips, parcels)].some((s) => s?.toLowerCase().includes(q))
    );
  }, [conversations, query, trips, parcels]);

  const dayLabel = (d: Date) => {
    const today = new Date();
    const yesterday = new Date(Date.now() - 86_400_000);
    if (d.toDateString() === today.toDateString()) return t.today;
    if (d.toDateString() === yesterday.toDateString()) return t.yesterday;
    return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  };
  const time = (d: Date) => d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const shortWhen = (iso: string) => {
    const d = parseDate(iso);
    if (d.toDateString() === new Date().toDateString()) return time(d);
    if (Date.now() - d.getTime() < 6 * 86_400_000) return d.toLocaleDateString(locale, { weekday: 'short' });
    return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
  };

  if (!userId) {
    return (
      <div className="container-xxl py-4 px-3">
        <div className="empty-state">
          <div className="icon">🔒</div>
          <button className="btn btn-link p-0 align-baseline fw-semibold" onClick={onLogin}>{t.login}</button> {t.loginNote}
        </div>
      </div>
    );
  }

  const contextLabel = (c: Conversation) =>
    listingLabel(c, trips, parcels) ?? (c.trip_id ? `${t.trip} #${c.trip_id}` : `${t.parcel} #${c.parcel_id}`);

  const list = (
    <aside className="msg-sidebar">
      <div className="msg-sidebar-head">
        <h2 className="form-title mb-0">{t.title}</h2>
        <input
          type="search" className="form-control msg-search" placeholder={t.search} aria-label={t.search}
          value={query} onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="msg-conv-list" role="list">
        {filtered === null && [0, 1, 2].map((i) => (
          <div key={i} className="msg-conv skeleton-row" aria-hidden>
            <span className="msg-avatar skeleton" />
            <span className="flex-grow-1"><span className="skeleton skeleton-line w-50" /><span className="skeleton skeleton-line w-75" /></span>
          </div>
        ))}
        {filtered?.length === 0 && (
          <div className="msg-empty-small">{conversations?.length ? t.noMatch : (
            <><div className="icon">💬</div><strong>{t.noConv}</strong><p>{t.noConvHint}</p></>
          )}</div>
        )}
        {filtered?.map((c) => {
          const unread = c.unread_count > 0;
          return (
            <button
              key={c.id} role="listitem" onClick={() => setActiveId(c.id)}
              className={'msg-conv' + (c.id === activeId ? ' active' : '') + (unread ? ' unread' : '')}
            >
              <Avatar name={c.other_user_name} />
              <span className="msg-conv-body">
                <span className="msg-conv-top">
                  <span className="msg-conv-name" dir="auto">
                    {c.other_user_name ?? '—'}
                    {!!c.other_user_review_count && <span className="msg-conv-rating"> ★ {c.other_user_rating?.toFixed(1)}</span>}
                  </span>
                  {c.last_message_at && <span className="msg-conv-time">{shortWhen(c.last_message_at)}</span>}
                </span>
                <span className="msg-conv-context">{c.trip_id ? '✈️' : '📦'} {contextLabel(c)}</span>
                <span className="msg-conv-bottom">
                  <span className="msg-conv-preview" dir="auto">{c.last_message ?? ''}</span>
                  {unread && <span className="msg-unread-badge">{c.unread_count}</span>}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );

  // Messages groupés par jour, puis par auteur consécutif
  const rows: React.ReactNode[] = [];
  let lastDay = '';
  messages?.forEach((m, i) => {
    const d = parseDate(m.created_at);
    if (d.toDateString() !== lastDay) {
      lastDay = d.toDateString();
      rows.push(<div key={'d' + m.id} className="msg-day"><span>{dayLabel(d)}</span></div>);
    }
    const mine = m.sender_id === userId;
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const sameAsPrev = prev && prev.sender_id === m.sender_id && parseDate(prev.created_at).toDateString() === lastDay;
    const sameAsNext = next && next.sender_id === m.sender_id && parseDate(next.created_at).toDateString() === lastDay;
    const isLastMine = mine && !messages.slice(i + 1).some((x) => x.sender_id === userId);
    rows.push(
      <div key={m.id} className={'msg-row' + (mine ? ' mine' : '') + (sameAsPrev ? ' cont' : '')}>
        <div
          className={'msg-bubble' + (sameAsNext ? ' has-next' : '') + (m.status ? ' ' + m.status : '')}
          onClick={m.status === 'failed' ? () => retry(m) : undefined}
          role={m.status === 'failed' ? 'button' : undefined}
        >
          <span className="msg-text" dir="auto">{m.content}</span>
          <span className="msg-meta">
            {time(d)}
            {mine && !m.status && <span className={'msg-ticks' + (m.is_read ? ' read' : '')} aria-label={m.is_read ? t.seen : undefined}>{m.is_read ? '✓✓' : '✓'}</span>}
          </span>
        </div>
        {m.status === 'failed' && <div className="msg-failed">⚠️ {t.failed}</div>}
        {m.status === 'sending' && isLastMine && <div className="msg-status">{t.sending}</div>}
      </div>
    );
  });

  const thread = activeConv ? (
    <section className="msg-thread" aria-label={activeConv.other_user_name ?? undefined}>
      <header className="msg-thread-head">
        <button className="msg-back" onClick={() => setActiveId(null)} aria-label={t.back}>
          <span aria-hidden>‹</span>
        </button>
        <Avatar name={activeConv.other_user_name} />
        <div className="min-w-0 flex-grow-1">
          <div className="d-flex align-items-center gap-2">
            <span className="msg-thread-name text-truncate">{activeConv.other_user_name ?? '—'}</span>
            <RatingBadge avg={activeConv.other_user_rating} count={activeConv.other_user_review_count}
              showCount={false} onClick={() => setProfileOpen(true)} />
          </div>
          <div className="msg-conv-context">{activeConv.trip_id ? '✈️' : '📦'} {contextLabel(activeConv)}</div>
        </div>
        <button type="button" className="btn btn-sm msg-rate-btn" onClick={() => setProfileOpen(true)}>★ {t.rate}</button>
      </header>
      {profileOpen && (
        <ProfileModal
          userId={activeConv.other_user_id} viewerId={userId} onClose={() => setProfileOpen(false)}
          onRated={(p) => setConversations((prev) => prev?.map((c) => (c.other_user_id === p.id
            ? { ...c, other_user_rating: p.avg, other_user_review_count: p.count } : c)) ?? prev)}
        />
      )}
      <div className="msg-scroll" ref={scrollRef} onScroll={onScroll}>
        <div className="msg-safety">🔒 {t.safety}</div>
        {messages === null && !loadError && (
          <div className="msg-loading" aria-hidden>
            <span className="skeleton skeleton-bubble" /><span className="skeleton skeleton-bubble mine" /><span className="skeleton skeleton-bubble" />
          </div>
        )}
        {loadError && (
          <div className="msg-empty-small">{t.error} <button className="btn btn-link p-0 align-baseline" onClick={() => setReloadKey((k) => k + 1)}>{t.retry}</button></div>
        )}
        {rows}
      </div>
      <form className="msg-composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <textarea
          ref={inputRef} rows={1} maxLength={2000} className="msg-input" dir="auto"
          placeholder={t.placeholder} aria-label={t.placeholder} title={t.hint}
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); }
          }}
        />
        <button type="submit" className="msg-send" disabled={!input.trim()} aria-label={t.send}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden><path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" /></svg>
        </button>
      </form>
    </section>
  ) : (
    <section className="msg-thread msg-placeholder">
      <div className="empty-state">
        <div className="icon">💬</div>
        <div className="fw-semibold" style={{ color: 'var(--ink)' }}>{t.pick}</div>
        <div style={{ fontSize: 13 }}>{t.pickHint}</div>
      </div>
    </section>
  );

  return (
    <div className="container-xxl py-3 py-lg-4 px-0 px-sm-3 px-lg-4">
      <div className={'msg-shell' + (activeConv ? ' has-active' : '')}>
        {list}
        {thread}
      </div>
    </div>
  );
}
