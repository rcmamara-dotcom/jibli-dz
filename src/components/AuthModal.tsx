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
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isLoggedIn ? 'Mon compte' : 'Connexion'}</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        {isLoggedIn ? (
          <>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 14 }}>
              Tes annonces affichent un bouton 🗑 pour les supprimer. Personne d'autre ne peut les modifier.
            </p>
            <button className="btn btn-danger btn-full" onClick={() => { onLogout(); onClose(); }}>Se déconnecter</button>
          </>
        ) : (
          <>
            <div className="login-note show" style={{ display: 'block' }}>
              📧 Connecte-toi par e-mail pour publier et gérer tes annonces. Première fois ? Crée un compte.
            </div>
            <div className="field">
              <label>Adresse e-mail</label>
              <input type="email" autoComplete="email" placeholder="ton@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>Mot de passe</label>
              <input type="password" autoComplete="current-password" placeholder="Au moins 6 caractères" value={pass} onChange={(e) => setPass(e.target.value)} />
            </div>
            <button className="btn btn-green btn-full" disabled={busy === 'in'} onClick={doSignIn}>
              {busy === 'in' ? '⏳ Connexion…' : 'Se connecter'}
            </button>
            <button className="btn btn-outline btn-full" style={{ marginTop: 8 }} disabled={busy === 'up'} onClick={doSignUp}>
              {busy === 'up' ? '⏳ Création…' : 'Créer un compte'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
