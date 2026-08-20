import React, { useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';
import { GoService } from '../services/GoService';
import { useLang } from '../contexts/LangContext';
import type { Lang } from '../i18n/translations';

interface Props {
  isLoggedIn: boolean;
  onClose: () => void;
  onLogin: (token: string) => void;
  onLogout: () => void;
  showToast: (m: string) => void;
  initialToken?: string | null;
}

type View = 'main' | 'forgot' | 'reset' | 'profile';
type Mode = 'login' | 'register';

const LANG_OPTIONS: { value: Lang; flag: string; label: string }[] = [
  { value: 'fr', flag: '🇫🇷', label: 'Français' },
  { value: 'ar', flag: '🇩🇿', label: 'العربية' },
  { value: 'en', flag: '🇬🇧', label: 'English' },
];

const AUTH_ERRORS: Record<string, string> = {
  'Cet e-mail est déjà utilisé': 'Cet e-mail a déjà un compte — utilise « Se connecter »',
  'E-mail ou mot de passe incorrect': 'E-mail ou mot de passe incorrect',
};

interface Me {
  id: number;
  email: string;
  name?: string | null;
  birth_date?: string | null;
  is_admin: boolean;
}

export default function AuthModal({ isLoggedIn, onClose, onLogin, onLogout, showToast, initialToken }: Props) {
  const { lang, setLang, t } = useLang();
  const [view, setView] = useState<View>(initialToken ? 'reset' : isLoggedIn ? 'profile' : 'main');
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [busy, setBusy] = useState('');
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    if (isLoggedIn && view === 'profile') {
      GoService.get<Me>('/api/auth/me').then((data) => setMe(data)).catch(() => {});
    }
  }, [isLoggedIn, view]);

  useEffect(() => {
    if (isLoggedIn && !initialToken) setView('profile');
    else if (!isLoggedIn) setView(initialToken ? 'reset' : 'main');
  }, [isLoggedIn, initialToken]);

  const errMsg = (e: unknown): string => {
    const detail = (e as any)?.detail ?? 'Erreur inconnue';
    return '⚠️ ' + (AUTH_ERRORS[detail] ?? detail);
  };

  const doSignIn = () => {
    if (!email || pass.length < 6) { showToast(t('errEmailPassword')); return; }
    setBusy('in');
    GoService.post<{ access_token: string }>('/api/auth/login', { email, password: pass })
      .then(({ access_token }) => { onLogin(access_token); onClose(); })
      .catch((e) => showToast(errMsg(e)))
      .finally(() => setBusy(''));
  };

  const doSignUp = () => {
    if (!email || pass.length < 6) { showToast(t('errEmailPassword')); return; }
    if (pass !== pass2) { showToast(t('errPasswordMismatch')); return; }
    setBusy('up');
    GoService.post<{ access_token: string }>('/api/auth/register', {
      email,
      password: pass,
      confirm_password: pass2,
      name: name || undefined,
      birth_date: birthDate || undefined,
    })
      .then(({ access_token }) => { onLogin(access_token); onClose(); })
      .catch((e) => showToast(errMsg(e)))
      .finally(() => setBusy(''));
  };

  const doGoogle = async () => {
    if (!auth) { showToast('⚠️ Google auth non configuré'); return; }
    setBusy('google');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      const { access_token } = await new Promise<{ access_token: string }>((resolve, reject) => {
        GoService.post<{ access_token: string }>('/api/auth/google', { id_token: idToken })
          .then(resolve)
          .catch(reject);
      });
      onLogin(access_token);
      onClose();
    } catch (e: any) {
      if (e?.code !== 'auth/popup-closed-by-user') showToast('⚠️ Connexion Google échouée');
    } finally {
      setBusy('');
    }
  };

  const doForgot = () => {
    if (!email) { showToast(t('errEmailRequired')); return; }
    setBusy('forgot');
    GoService.post('/api/auth/forgot-password', { email })
      .then(() => { showToast(t('toastForgotSent')); setView('main'); })
      .catch(() => { showToast(t('toastForgotSent')); setView('main'); })
      .finally(() => setBusy(''));
  };

  const doReset = () => {
    if (pass.length < 6) { showToast(t('errPasswordMin')); return; }
    if (pass !== pass2) { showToast(t('errPasswordMismatch')); return; }
    setBusy('reset');
    GoService.post('/api/auth/reset-password', { token: initialToken, password: pass })
      .then(() => { showToast(t('toastResetOk')); onClose(); })
      .catch((e) => showToast(errMsg(e)))
      .finally(() => setBusy(''));
  };

  const modalTitle = () => {
    if (view === 'profile') return t('titleAccount');
    if (view === 'forgot') return t('titleForgot');
    if (view === 'reset') return t('titleReset');
    return mode === 'login' ? t('titleLogin') : t('tabRegister');
  };

  return (
    <div className="modal-backdrop-custom" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 460 }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="modal-title-custom">{modalTitle()}</div>
          <button className="btn-close" onClick={onClose} aria-label="Fermer" />
        </div>

        {/* ── Profile / account ─────────────────────────────────── */}
        {view === 'profile' && (
          <>
            {/* Profile info */}
            <div className="mb-4 p-3 rounded-3" style={{ background: 'var(--bs-gray-100, #f8f9fa)' }}>
              <div className="fw-semibold mb-2" style={{ fontSize: 13, color: 'var(--green-mid, #1a7a42)' }}>👤 {t('profileTitle')}</div>
              <div className="d-flex flex-column gap-1" style={{ fontSize: 13 }}>
                <div><span className="text-muted">{t('profileEmail')} : </span><strong>{me?.email ?? '…'}</strong></div>
                <div><span className="text-muted">{t('profileName')} : </span>{me?.name ?? <em>{t('profileNotSet')}</em>}</div>
                <div><span className="text-muted">{t('profileBirthDate')} : </span>{me?.birth_date ?? <em>{t('profileNotSet')}</em>}</div>
              </div>
            </div>

            {/* Language switcher */}
            <div className="mb-4">
              <div className="fw-semibold mb-2" style={{ fontSize: 13 }}>⚙️ {t('settingsTitle')}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{t('langLabel')}</div>
              <div className="d-flex gap-2">
                {LANG_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setLang(opt.value)}
                    className={'btn btn-sm ' + (lang === opt.value ? 'btn-success' : 'btn-outline-secondary')}
                    style={{ borderRadius: 20, fontSize: 13, fontWeight: 600 }}
                  >
                    {opt.flag} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-muted mb-4" style={{ fontSize: 12, lineHeight: 1.5 }}>
              {t('profileNote')}
            </p>
            <button className="btn btn-outline-danger w-100" onClick={() => { onLogout(); onClose(); }}>
              {t('btnLogout')}
            </button>
          </>
        )}

        {/* ── Reset password (from link) ─────────────────────────── */}
        {view === 'reset' && (
          <>
            <p className="text-muted mb-3" style={{ fontSize: 13 }}>{t('resetNote')}</p>
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>{t('labelPassword')}</label>
              <input type="password" className="form-control" placeholder={t('placeholderPassword')} value={pass} onChange={(e) => setPass(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>{t('labelPasswordConfirm')}</label>
              <input type="password" className="form-control" placeholder={t('placeholderPasswordConfirm')} value={pass2} onChange={(e) => setPass2(e.target.value)} />
            </div>
            <button className="btn btn-green w-100 py-3" disabled={busy === 'reset'} onClick={doReset}>
              {busy === 'reset' ? t('busyReset') : t('btnSavePassword')}
            </button>
          </>
        )}

        {/* ── Forgot password ─────────────────────────────────────── */}
        {view === 'forgot' && (
          <>
            <p className="text-muted mb-3" style={{ fontSize: 13 }}>{t('forgotNote')}</p>
            <div className="mb-4">
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>{t('labelEmail')}</label>
              <input type="email" className="form-control" autoComplete="email" placeholder={t('placeholderEmail')} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="d-flex flex-column gap-2">
              <button className="btn btn-green w-100 py-3" disabled={busy === 'forgot'} onClick={doForgot}>
                {busy === 'forgot' ? t('busyForgot') : t('btnSendLink')}
              </button>
              <button className="btn btn-link text-muted p-0" style={{ fontSize: 13 }} onClick={() => setView('main')}>
                {t('btnBack')}
              </button>
            </div>
          </>
        )}

        {/* ── Main: login / register ──────────────────────────────── */}
        {view === 'main' && (
          <>
            {/* Mode tabs */}
            <div className="d-flex mb-4" style={{ borderBottom: '2px solid #e5e7eb' }}>
              {(['login', 'register'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    padding: '8px 0',
                    fontSize: 14,
                    fontWeight: 700,
                    color: mode === m ? 'var(--green-mid, #1a7a42)' : '#6b7280',
                    borderBottom: mode === m ? '2px solid var(--green-mid, #1a7a42)' : '2px solid transparent',
                    marginBottom: -2,
                    cursor: 'pointer',
                    transition: 'all .15s',
                  }}
                >
                  {m === 'login' ? t('tabLogin') : t('tabRegister')}
                </button>
              ))}
            </div>

            {/* Google button */}
            <button
              className="btn w-100 py-2 mb-3 d-flex align-items-center justify-content-center gap-2"
              disabled={busy === 'google'}
              onClick={doGoogle}
              style={{
                border: '1.5px solid #dadce0',
                borderRadius: 8,
                background: '#fff',
                color: '#3c4043',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {busy === 'google' ? t('busyGoogle') : (
                <>
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.2 33.5 29.7 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l6.1-6.1C34.4 5.9 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.2-2.7-.2-4z"/>
                    <path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 16 19.2 13 24 13c3 0 5.7 1.1 7.8 2.9l6.1-6.1C34.4 5.9 29.5 4 24 4c-7.5 0-14 4.2-17.7 10.7z"/>
                    <path fill="#FBBC05" d="M24 44c5.5 0 10.5-1.9 14.3-5l-6.6-5.4C29.7 35.2 27 36 24 36c-5.6 0-10.4-3.8-12-9l-7 5.3C8.8 39.5 16 44 24 44z"/>
                    <path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-.8 2.3-2.4 4.3-4.5 5.6l6.6 5.4C41.5 36.3 44.5 30.6 44.5 24c0-1.3-.2-2.7-.2-4z"/>
                  </svg>
                  {t('btnGoogle')}
                </>
              )}
            </button>

            {/* OR separator */}
            <div className="d-flex align-items-center gap-2 mb-3">
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{t('orSeparator')}</span>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            </div>

            {/* Register extra fields */}
            {mode === 'register' && (
              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>{t('labelName')}</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t('placeholderName')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>{t('labelEmail')}</label>
              <input type="email" className="form-control" autoComplete="email" placeholder={t('placeholderEmail')} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>{t('labelPassword')}</label>
              <input type="password" className="form-control" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder={t('placeholderPassword')} value={pass} onChange={(e) => setPass(e.target.value)} />
            </div>

            {mode === 'register' && (
              <>
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ fontSize: 13 }}>{t('labelPasswordConfirm')}</label>
                  <input type="password" className="form-control" autoComplete="new-password" placeholder={t('placeholderPasswordConfirm')} value={pass2} onChange={(e) => setPass2(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ fontSize: 13 }}>{t('labelBirthDate')}</label>
                  <input type="date" className="form-control" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
                </div>
              </>
            )}

            {mode === 'login' && (
              <div className="mb-4 text-end">
                <button className="btn btn-link p-0" style={{ fontSize: 12, color: 'var(--green-mid)' }} onClick={() => setView('forgot')}>
                  {t('btnForgot')}
                </button>
              </div>
            )}

            <div className={mode === 'login' ? '' : 'mt-2'}>
              {mode === 'login' ? (
                <button className="btn btn-green w-100 py-3" disabled={busy === 'in'} onClick={doSignIn}>
                  {busy === 'in' ? t('busyLogin') : t('btnLogin')}
                </button>
              ) : (
                <button className="btn btn-green w-100 py-3" disabled={busy === 'up'} onClick={doSignUp}>
                  {busy === 'up' ? t('busyRegister') : t('btnRegister')}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
