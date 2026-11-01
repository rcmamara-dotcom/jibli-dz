import React, { useEffect, useState } from 'react';
import { GoService } from '../services/GoService';
import { useLang } from '../contexts/LangContext';
import type { Lang } from '../i18n/translations';
import { useTheme } from '../utils/theme';
import PasswordInput from './PasswordInput';
import { cleanPhone } from './AuthModal';

interface Me {
  id: number;
  email: string;
  email_verified: boolean;
  phone: string | null;
  name: string | null;
  birth_date: string | null;
  has_password: boolean;
}

interface SubInfo {
  plan: string | null;
  status: string | null;
  quota: number | null;
  remaining: number | null;
  period_end?: string;
}

interface Props {
  showToast: (m: string) => void;
  onLogout: () => void;
  onPricing: () => void;
}

const LANG_OPTIONS: { value: Lang; flag: string; label: string }[] = [
  { value: 'fr', flag: '🇫🇷', label: 'Français' },
  { value: 'ar', flag: '🇩🇿', label: 'العربية' },
  { value: 'en', flag: '🇬🇧', label: 'English' },
];

const errMsg = (e: unknown) => '⚠️ ' + ((e as { detail?: string })?.detail ?? 'Erreur');

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body p-4">
        <div className="section-title mb-3">{title}</div>
        {children}
      </div>
    </div>
  );
}

const label = (text: string, extra?: string) => (
  <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
    {text} {extra && <span className="text-muted fw-normal">{extra}</span>}
  </label>
);

export default function Settings({ showToast, onLogout, onPricing }: Props) {
  const { lang, setLang, t } = useLang();
  const [me, setMe] = useState<Me | null>(null);
  const [sub, setSub] = useState<SubInfo | null>(null);
  const [busy, setBusy] = useState('');
  const [theme, setTheme] = useTheme();

  // profil
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  // e-mail
  const [code, setCode] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailPass, setEmailPass] = useState('');
  // mot de passe
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newPass2, setNewPass2] = useState('');

  const loadMe = (data: Me) => {
    setMe(data);
    setName(data.name ?? '');
    setPhone(data.phone ?? '');
    setBirthDate(data.birth_date ?? '');
  };

  useEffect(() => {
    GoService.get<Me>('/api/auth/me').then(loadMe).catch((e) => showToast(errMsg(e)));
    GoService.get<SubInfo>('/api/subscriptions/me').then(setSub).catch(() => setSub(null));
  }, []);

  type Req = { catch(fn: (e: unknown) => void): { finally(fn: () => void): unknown } };
  const run = (key: string, req: Req) => {
    setBusy(key);
    req.catch((e) => showToast(errMsg(e))).finally(() => setBusy(''));
  };

  const saveProfile = () => {
    if (!/^\+\d{7,15}$/.test(cleanPhone(phone))) { showToast(t('errPhone')); return; }
    run('profile', GoService.patch<Me>('/api/auth/me', {
      name: name.trim() || null,
      phone: cleanPhone(phone),
      birth_date: birthDate || null,
    }).then((d) => { loadMe(d); showToast(t('toastSaved')); }));
  };

  const verify = () => run('verify', GoService.post<Me>('/api/auth/verify-email', { code: code.trim() })
    .then((d) => { loadMe(d); setCode(''); showToast(t('toastEmailVerified')); }));

  const resend = () => run('resend', GoService.post('/api/auth/resend-code', {})
    .then(() => showToast(t('toastCodeSent'))));

  const changeEmail = () => run('email', GoService.post<Me>('/api/auth/change-email', { new_email: newEmail.trim(), password: emailPass })
    .then((d) => { loadMe(d); setNewEmail(''); setEmailPass(''); showToast(t('toastCodeSent')); }));

  const changePassword = () => {
    if (newPass.length < 8) { showToast(t('errPasswordMin')); return; }
    if (newPass !== newPass2) { showToast(t('errPasswordMismatch')); return; }
    run('password', GoService.post('/api/auth/change-password', {
      current_password: currentPass, new_password: newPass, confirm_new_password: newPass2,
    }).then(() => { setCurrentPass(''); setNewPass(''); setNewPass2(''); showToast(t('toastPasswordChanged')); }));
  };

  const managePortal = () => run('portal', GoService.post<{ portal_url: string }>('/api/subscriptions/portal', {})
    .then(({ portal_url }) => { window.location.href = portal_url; }));

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  if (!me) return <div className="container py-5 text-center text-muted">⏳</div>;

  return (
    <div className="container py-4 px-3" style={{ maxWidth: 720 }}>
      <h1 className="section-title mb-4" style={{ fontSize: 24 }}>⚙️ {t('navSettings')}</h1>

      <Section title={t('settingsProfile')}>
        <div className="mb-3">
          {label(t('labelName'), t('labelOptional'))}
          <input type="text" className="form-control" placeholder={t('placeholderName')} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="mb-3">
          {label(t('labelPhone'))}
          <input type="tel" className="form-control" dir="ltr" autoComplete="tel" placeholder={t('placeholderPhone')} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="mb-3">
          {label(t('labelBirthDate'), t('labelOptional'))}
          <input type="date" className="form-control" value={birthDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setBirthDate(e.target.value)} />
        </div>
        <button className="btn btn-green px-4" disabled={busy === 'profile'} onClick={saveProfile}>{t('btnSave')}</button>
      </Section>

      <Section title={t('settingsEmail')}>
        <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
          <strong>{me.email}</strong>
          <span className={'badge rounded-pill ' + (me.email_verified ? 'text-bg-success' : 'text-bg-warning')}>
            {me.email_verified ? '✓ ' + t('emailVerified') : t('emailNotVerified')}
          </span>
        </div>

        {!me.email_verified && (
          <div className="mb-4">
            {label(t('labelCode'))}
            <div className="d-flex gap-2 flex-wrap">
              <input
                type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                className="form-control" style={{ maxWidth: 160, letterSpacing: 4 }} placeholder="000000"
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
              <button className="btn btn-green" disabled={busy === 'verify' || code.length !== 6} onClick={verify}>{t('btnVerify')}</button>
              <button className="btn btn-link" style={{ color: 'var(--green-mid)' }} disabled={busy === 'resend'} onClick={resend}>{t('btnResend')}</button>
            </div>
          </div>
        )}

        {me.has_password ? (
          <>
            <div className="mb-3">
              {label(t('labelNewEmail'))}
              <input type="email" className="form-control" autoComplete="email" placeholder={t('placeholderEmail')} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <div className="mb-3">
              {label(t('labelPassword'))}
              <PasswordInput autoComplete="current-password" placeholder={t('placeholderCurrentPassword')} value={emailPass} onChange={setEmailPass} />
            </div>
            <button className="btn btn-outline-secondary" disabled={busy === 'email' || !newEmail || !emailPass} onClick={changeEmail}>{t('btnChangeEmail')}</button>
          </>
        ) : (
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>{t('googleAccountNote')}</p>
        )}
      </Section>

      {me.has_password && (
        <Section title={t('settingsPassword')}>
          <div className="mb-3">
            {label(t('labelCurrentPassword'))}
            <PasswordInput autoComplete="current-password" placeholder={t('placeholderCurrentPassword')} value={currentPass} onChange={setCurrentPass} />
          </div>
          <div className="mb-3">
            {label(t('labelNewPassword'))}
            <PasswordInput autoComplete="new-password" placeholder={t('placeholderNewPassword')} value={newPass} onChange={setNewPass} />
          </div>
          <div className="mb-3">
            {label(t('labelNewPasswordConfirm'))}
            <PasswordInput autoComplete="new-password" placeholder={t('placeholderNewPasswordConfirm')} value={newPass2} onChange={setNewPass2} />
          </div>
          <button className="btn btn-green px-4" disabled={busy === 'password' || !currentPass} onClick={changePassword}>{t('btnSaveNewPassword')}</button>
        </Section>
      )}

      <Section title={t('settingsSubscription')}>
        {sub?.plan ? (
          <>
            <div className="d-flex flex-column gap-1 mb-3" style={{ fontSize: 14 }}>
              <div><span className="text-muted">{t('subPlan')} : </span><strong className="text-capitalize">{sub.plan}</strong></div>
              <div><span className="text-muted">{t('subRemaining')} : </span>{sub.quota === null ? t('subUnlimited') : `${sub.remaining} / ${sub.quota}`}</div>
              {sub.period_end && (
                <div><span className="text-muted">{t('subRenews')} </span>{new Date(sub.period_end).toLocaleDateString(lang)}</div>
              )}
            </div>
            <button className="btn btn-green px-4" disabled={busy === 'portal'} onClick={managePortal}>{t('btnManageSub')}</button>
          </>
        ) : (
          <>
            <p className="text-muted" style={{ fontSize: 14 }}>{t('subNone')}</p>
            <button className="btn btn-green px-4" onClick={onPricing}>{t('btnSeePlans')}</button>
          </>
        )}
      </Section>

      <Section title={t('settingsAppearance')}>
        <div className="form-check form-switch mb-3">
          <input className="form-check-input" type="checkbox" role="switch" id="dark-mode" checked={theme === 'dark'} onChange={toggleTheme} />
          <label className="form-check-label" htmlFor="dark-mode">🌙 {t('darkMode')}</label>
        </div>
        <div style={{ fontSize: 13 }} className="text-muted mb-2">{t('langLabel')}</div>
        <div className="d-flex gap-2 flex-wrap">
          {LANG_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setLang(opt.value)}
              className={'btn btn-sm ' + (lang === opt.value ? 'btn-success' : 'btn-outline-secondary')}
              style={{ borderRadius: 20, fontWeight: 600 }}
            >
              {opt.flag} {opt.label}
            </button>
          ))}
        </div>
      </Section>

      <button className="btn btn-outline-danger w-100 mb-4" onClick={onLogout}>{t('btnLogout')}</button>
    </div>
  );
}
