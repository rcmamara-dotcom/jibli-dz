import React, { useState } from 'react';
import { GoService } from '../services/GoService';

interface Props {
  isLoggedIn: boolean;
  onClose: () => void;
  onLogin: (token: string) => void;
  onLogout: () => void;
  showToast: (m: string) => void;
}

const AUTH_ERRORS: Record<string, string> = {
  'Cet e-mail est déjà utilisé': 'Cet e-mail a déjà un compte — utilise « Se connecter »',
  'E-mail ou mot de passe incorrect': 'E-mail ou mot de passe incorrect',
};

export default function AuthModal({ isLoggedIn, onClose, onLogin, onLogout, showToast }: Props) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
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

  return (
    <div className="modal-backdrop-custom" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 440 }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="modal-title-custom">{isLoggedIn ? 'Mon compte' : 'Connexion'}</div>
          <button className="btn-close" onClick={onClose} aria-label="Fermer" />
        </div>
        {isLoggedIn ? (
          <>
            <p className="text-muted mb-4" style={{ fontSize: 13, lineHeight: 1.5 }}>
              Tes annonces affichent un bouton 🗑 pour les supprimer. Personne d'autre ne peut les modifier.
            </p>
            <button className="btn btn-outline-danger w-100" onClick={() => { onLogout(); onClose(); }}>Se déconnecter</button>
          </>
        ) : (
          <>
            <div className="login-note rounded-3 p-3 mb-3">
              📧 Connecte-toi par e-mail pour publier et gérer tes annonces. Première fois ? Crée un compte.
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Adresse e-mail</label>
              <input type="email" className="form-control" autoComplete="email" placeholder="ton@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Mot de passe</label>
              <input type="password" className="form-control" autoComplete="current-password" placeholder="Au moins 6 caractères" value={pass} onChange={(e) => setPass(e.target.value)} />
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
