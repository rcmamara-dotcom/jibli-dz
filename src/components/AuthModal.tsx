import React, { useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';
import { GoService } from '../services/GoService';
import { useLang } from '../contexts/LangContext';
import PasswordInput from './PasswordInput';

interface Props {
  isLoggedIn: boolean;
  onClose: () => void;
  onLogin: (token: string) => void;
  showToast: (m: string) => void;
  initialToken?: string | null;
}

type View = 'main' | 'forgot' | 'reset' | 'verify';
type Mode = 'login' | 'register';

const AUTH_ERRORS: Record<string, string> = {
  'Cet e-mail est déjà utilisé': 'Cet e-mail a déjà un compte — utilise « Se connecter »',
  'E-mail ou mot de passe incorrect': 'E-mail ou mot de passe incorrect',
};

// Même règle que le backend (schemas._validate_phone)
const PHONE_RE = /^\+\d{7,15}$/;
export const cleanPhone = (v: string) => v.replace(/[\s.-]/g, '');

export default function AuthModal({ isLoggedIn, onClose, onLogin, showToast, initialToken }: Props) {
  const { t } = useLang();
  // Ouverte en étant connecté = e-mail encore à vérifier (le compte se gère dans Paramètres)
  const [view, setView] = useState<View>(initialToken ? 'reset' : isLoggedIn ? 'verify' : 'main');
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [verifyEmail, setVerifyEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (!isLoggedIn) setView(initialToken ? 'reset' : 'main');
  }, [isLoggedIn, initialToken]);

  useEffect(() => {
    if (view === 'verify' && !verifyEmail) {
      GoService.get<{ email: string }>('/api/auth/me').then((me) => setVerifyEmail(me.email)).catch(() => {});
    }
  }, [view, verifyEmail]);

  // Après connexion : on ne ferme que si l'e-mail est déjà vérifié
  const afterAuth = (token: string) => {
    onLogin(token);
    GoService.get<{ email: string; email_verified: boolean }>('/api/auth/me')
      .then((me) => {
        if (me.email_verified) onClose();
        else { setVerifyEmail(me.email); setView('verify'); }
      })
      .catch(() => onClose());
  };

  const errMsg = (e: unknown): string => {
    const detail = (e as { detail?: string })?.detail ?? 'Erreur inconnue';
    return '⚠️ ' + (AUTH_ERRORS[detail] ?? detail);
  };

  const doSignIn = () => {
    if (!email || !pass) { showToast(t('errEmailPassword')); return; }
    setBusy('in');
    GoService.post<{ access_token: string }>('/api/auth/login', { email, password: pass })
      .then(({ access_token }) => afterAuth(access_token))
      .catch((e) => showToast(errMsg(e)))
      .finally(() => setBusy(''));
  };

  const doSignUp = () => {
    if (!email || pass.length < 8) { showToast(t('errEmailPassword')); return; }
    if (!PHONE_RE.test(cleanPhone(phone))) { showToast(t('errPhone')); return; }
    if (pass !== pass2) { showToast(t('errPasswordMismatch')); return; }
    setBusy('up');
    GoService.post<{ access_token: string }>('/api/auth/register', {
      email,
      phone: cleanPhone(phone),
      password: pass,
      confirm_password: pass2,
      name: name || undefined,
      birth_date: birthDate || undefined,
    })
      .then(({ access_token }) => { onLogin(access_token); setVerifyEmail(email); setView('verify'); })
      .catch((e) => showToast(errMsg(e)))
      .finally(() => setBusy(''));
  };

  const doVerify = () => {
    if (!/^\d{6}$/.test(code.trim())) { showToast('⚠️ ' + t('labelCode')); return; }
    setBusy('verify');
    GoService.post('/api/auth/verify-email', { code: code.trim() })
      .then(() => { showToast(t('toastEmailVerified')); onClose(); })
      .catch((e) => showToast(errMsg(e)))
      .finally(() => setBusy(''));
  };

  const doResend = () => {
    setBusy('resend');
    GoService.post('/api/auth/resend-code', {})
      .then(() => showToast(t('toastCodeSent')))
      .catch((e) => showToast(errMsg(e)))
      .finally(() => setBusy(''));
  };

  const doGoogle = async () => {
    const firebaseAuth = auth;
    if (!firebaseAuth) { showToast('⚠️ Google auth non configuré'); return; }
    setBusy('google');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      const idToken = await result.user.getIdToken();
      const data = await new Promise<{ access_token: string }>((resolve, reject) => {
        GoService.post<{ access_token: string }>('/api/auth/google', { id_token: idToken })
          .then(resolve)
          .catch(reject);
      });
      afterAuth(data.access_token);
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code !== 'auth/popup-closed-by-user') showToast('⚠️ Connexion Google échouée');
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
    if (pass.length < 8) { showToast(t('errPasswordMin')); return; }
    if (pass !== pass2) { showToast(t('errPasswordMismatch')); return; }
    setBusy('reset');
    GoService.post('/api/auth/reset-password', { token: initialToken, password: pass })
      .then(() => { showToast(t('toastResetOk')); onClose(); })
      .catch((e) => showToast(errMsg(e)))
      .finally(() => setBusy(''));
  };

  const modalTitle = () => {
    if (view === 'verify') return t('titleVerify');
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

        {/* ── Verify e-mail code ───────────────────────────────────── */}
        {view === 'verify' && (
          <>
            <p className="text-muted mb-3" style={{ fontSize: 13 }}>
              {t('verifyNote')} <strong>{verifyEmail || '…'}</strong>
            </p>
            <div className="mb-4">
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>{t('labelCode')}</label>
              <input
                type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                className="form-control text-center fw-bold" style={{ fontSize: 24, letterSpacing: 8 }}
                placeholder="000000" value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') doVerify(); }}
              />
            </div>
            <div className="d-flex flex-column gap-2">
              <button className="btn btn-green w-100 py-3" disabled={busy === 'verify'} onClick={doVerify}>
                {t('btnVerify')}
              </button>
              <div className="d-flex justify-content-between">
                <button className="btn btn-link p-0" style={{ fontSize: 13, color: 'var(--green-text)' }} disabled={busy === 'resend'} onClick={doResend}>
                  {t('btnResend')}
                </button>
                <button className="btn btn-link text-muted p-0" style={{ fontSize: 13 }} onClick={onClose}>
                  {t('btnLater')}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Reset password (from link) ─────────────────────────── */}
        {view === 'reset' && (
          <>
            <p className="text-muted mb-3" style={{ fontSize: 13 }}>{t('resetNote')}</p>
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>{t('labelPassword')}</label>
              <PasswordInput autoComplete="new-password" placeholder={t('placeholderPassword')} value={pass} onChange={setPass} />
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>{t('labelPasswordConfirm')}</label>
              <PasswordInput autoComplete="new-password" placeholder={t('placeholderPasswordConfirm')} value={pass2} onChange={setPass2} />
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
            <div className="d-flex mb-4" style={{ borderBottom: '2px solid var(--border)' }}>
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
                    color: mode === m ? 'var(--green-text)' : 'var(--muted)',
                    borderBottom: mode === m ? '2px solid var(--green-text)' : '2px solid transparent',
                    marginBottom: -2,
                    cursor: 'pointer',
                    transition: 'all .15s',
                  }}
                >
                  {m === 'login' ? t('tabLogin') : t('tabRegister')}
                </button>
              ))}
            </div>

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

            <div className="d-flex align-items-center gap-2 mb-3">
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t('orSeparator')}</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {mode === 'register' && (
              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>{t('labelName')} <span className="text-muted fw-normal">{t('labelOptional')}</span></label>
                <input type="text" className="form-control" placeholder={t('placeholderName')} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}

            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>{t('labelEmail')}</label>
              <input type="email" className="form-control" autoComplete="email" placeholder={t('placeholderEmail')} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {mode === 'register' && (
              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>{t('labelPhone')}</label>
                <input type="tel" className="form-control" autoComplete="tel" dir="ltr" placeholder={t('placeholderPhone')} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            )}
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>{t('labelPassword')}</label>
              <PasswordInput autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder={t('placeholderPassword')} value={pass} onChange={setPass} />
            </div>

            {mode === 'register' && (
              <>
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ fontSize: 13 }}>{t('labelPasswordConfirm')}</label>
                  <PasswordInput autoComplete="new-password" placeholder={t('placeholderPasswordConfirm')} value={pass2} onChange={setPass2} />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ fontSize: 13 }}>{t('labelBirthDate')} <span className="text-muted fw-normal">{t('labelOptional')}</span></label>
                  <input type="date" className="form-control" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
                </div>
              </>
            )}

            {mode === 'login' && (
              <div className="mb-4 text-end">
                <button className="btn btn-link p-0" style={{ fontSize: 12, color: 'var(--green-text)' }} onClick={() => setView('forgot')}>
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
