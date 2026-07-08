import React, { useState } from 'react';
import { GoService } from '../services/GoService';

interface Props {
  isLoggedIn: boolean;
  onClose: () => void;
  onLogin: (token: string) => void;
  onLogout: () => void;
  showToast: (m: string) => void;
  initialToken?: string | null;
}

type View = 'main' | 'forgot' | 'reset';

const AUTH_ERRORS: Record<string, string> = {
  'Cet e-mail est déjà utilisé': 'Cet e-mail a déjà un compte — utilise « Se connecter »',
  'E-mail ou mot de passe incorrect': 'E-mail ou mot de passe incorrect',
};

export default function AuthModal({ isLoggedIn, onClose, onLogin, onLogout, showToast, initialToken }: Props) {
  const [view, setView] = useState<View>(initialToken ? 'reset' : 'main');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [busy, setBusy] = useState('');

  const errMsg = (e: unknown): string => {
    const detail = (e as any)?.detail ?? 'Erreur inconnue';
    return '⚠️ ' + (AUTH_ERRORS[detail] ?? detail);
  };

  const doSignIn = () => {
    if (!email || pass.length < 6) { showToast('⚠️ E-mail + mot de passe (6 caractères min)'); return; }
    setBusy('in');
    GoService.post<{ access_token: string }>('/api/auth/login', { email, password: pass })
      .then(({ access_token }) => { onLogin(access_token); onClose(); })
      .catch((e) => showToast(errMsg(e)))
      .finally(() => setBusy(''));
  };

  const doSignUp = () => {
    if (!email || pass.length < 6) { showToast('⚠️ E-mail + mot de passe (6 caractères min)'); return; }
    setBusy('up');
    GoService.post<{ access_token: string }>('/api/auth/register', { email, password: pass })
      .then(({ access_token }) => { onLogin(access_token); onClose(); })
      .catch((e) => showToast(errMsg(e)))
      .finally(() => setBusy(''));
  };

  const doForgot = () => {
    if (!email) { showToast('⚠️ Entre ton adresse e-mail'); return; }
    setBusy('forgot');
    GoService.post('/api/auth/forgot-password', { email })
      .then(() => { showToast('📧 E-mail envoyé si ce compte existe !'); setView('main'); })
      .catch(() => { showToast('📧 E-mail envoyé si ce compte existe !'); setView('main'); })
      .finally(() => setBusy(''));
  };

  const doReset = () => {
    if (pass.length < 6) { showToast('⚠️ Mot de passe : 6 caractères min'); return; }
    if (pass !== pass2) { showToast('⚠️ Les mots de passe ne correspondent pas'); return; }
    setBusy('reset');
    GoService.post('/api/auth/reset-password', { token: initialToken, password: pass })
      .then(() => { showToast('✅ Mot de passe mis à jour !'); onClose(); })
      .catch((e) => showToast(errMsg(e)))
      .finally(() => setBusy(''));
  };

  return (
    <div className="modal-backdrop-custom" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 440 }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="modal-title-custom">
            {isLoggedIn ? 'Mon compte' : view === 'forgot' ? 'Mot de passe oublié' : view === 'reset' ? 'Nouveau mot de passe' : 'Connexion'}
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Fermer" />
        </div>

        {/* Logged in */}
        {isLoggedIn && (
          <>
            <p className="text-muted mb-4" style={{ fontSize: 13, lineHeight: 1.5 }}>
              Tes annonces affichent un bouton 🗑 pour les supprimer. Personne d'autre ne peut les modifier.
            </p>
            <button className="btn btn-outline-danger w-100" onClick={() => { onLogout(); onClose(); }}>Se déconnecter</button>
          </>
        )}

        {/* Reset password (from link) */}
        {!isLoggedIn && view === 'reset' && (
          <>
            <p className="text-muted mb-3" style={{ fontSize: 13 }}>Choisis un nouveau mot de passe pour ton compte.</p>
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Nouveau mot de passe</label>
              <input type="password" className="form-control" placeholder="Au moins 6 caractères" value={pass} onChange={(e) => setPass(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Confirmer le mot de passe</label>
              <input type="password" className="form-control" placeholder="Répète le mot de passe" value={pass2} onChange={(e) => setPass2(e.target.value)} />
            </div>
            <button className="btn btn-green w-100 py-3" disabled={busy === 'reset'} onClick={doReset}>
              {busy === 'reset' ? '⏳ Mise à jour…' : '✅ Enregistrer le mot de passe'}
            </button>
          </>
        )}

        {/* Forgot password */}
        {!isLoggedIn && view === 'forgot' && (
          <>
            <p className="text-muted mb-3" style={{ fontSize: 13 }}>
              Entre l'adresse e-mail de ton compte. Tu recevras un lien pour créer un nouveau mot de passe.
            </p>
            <div className="mb-4">
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Adresse e-mail</label>
              <input type="email" className="form-control" autoComplete="email" placeholder="ton@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="d-flex flex-column gap-2">
              <button className="btn btn-green w-100 py-3" disabled={busy === 'forgot'} onClick={doForgot}>
                {busy === 'forgot' ? '⏳ Envoi…' : '📧 Envoyer le lien'}
              </button>
              <button className="btn btn-link text-muted p-0" style={{ fontSize: 13 }} onClick={() => setView('main')}>
                ← Retour à la connexion
              </button>
            </div>
          </>
        )}

        {/* Main: login / register */}
        {!isLoggedIn && view === 'main' && (
          <>
            <div className="login-note rounded-3 p-3 mb-3">
              📧 Connecte-toi par e-mail pour publier et gérer tes annonces. Première fois ? Crée un compte.
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Adresse e-mail</label>
              <input type="email" className="form-control" autoComplete="email" placeholder="ton@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="mb-1">
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Mot de passe</label>
              <input type="password" className="form-control" autoComplete="current-password" placeholder="Au moins 6 caractères" value={pass} onChange={(e) => setPass(e.target.value)} />
            </div>
            <div className="mb-4 text-end">
              <button className="btn btn-link p-0" style={{ fontSize: 12, color: 'var(--green-mid)' }} onClick={() => setView('forgot')}>
                Mot de passe oublié ?
              </button>
            </div>
            <div className="d-flex flex-column gap-2">
              <button className="btn btn-green w-100 py-3" disabled={busy === 'in'} onClick={doSignIn}>
                {busy === 'in' ? '⏳ Connexion…' : 'Se connecter'}
              </button>
              <button className="btn btn-outline-secondary w-100 py-2" disabled={busy === 'up'} onClick={doSignUp}>
                {busy === 'up' ? '⏳ Création…' : 'Créer un compte'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
