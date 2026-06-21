import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, User } from 'firebase/auth';
import { auth } from '../firebase';
import { Mode } from '../types';

interface Props {
  mode: Mode;
  user: User | null;
  onClose: () => void;
  onLogout: () => void;
  showToast: (m: string) => void;
}

const AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-email': 'Adresse e-mail invalide',
  'auth/email-already-in-use': 'Cet e-mail a déjà un compte — utilise « Se connecter »',
  'auth/weak-password': 'Mot de passe trop court (6 caractères min)',
  'auth/wrong-password': 'Mot de passe incorrect',
  'auth/user-not-found': 'Aucun compte avec cet e-mail — utilise « Créer un compte »',
  'auth/invalid-credential': 'E-mail ou mot de passe incorrect',
  'auth/too-many-requests': 'Trop de tentatives, réessaie plus tard',
  'auth/network-request-failed': 'Problème de connexion réseau',
  'auth/operation-not-allowed': 'Active « E-mail/Mot de passe » dans Firebase',
};

const errMsg = (e: any): string => '⚠️ ' + (AUTH_ERRORS[e.code] || e.code || e.message);

export default function AuthModal({ mode, user, onClose, onLogout, showToast }: Props) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState('');

  if (mode !== 'cloud' || !auth) return null;

  const doSignIn = async () => {
    if (!email || pass.length < 6) { showToast('⚠️ E-mail + mot de passe (6 caractères min)'); return; }
    setBusy('in');
    try { await signInWithEmailAndPassword(auth!, email, pass); showToast('✅ Connecté !'); onClose(); }
    catch (e) { showToast(errMsg(e)); } finally { setBusy(''); }
  };

  const doSignUp = async () => {
    if (!email || pass.length < 6) { showToast('⚠️ E-mail + mot de passe (6 caractères min)'); return; }
    setBusy('up');
    try { await createUserWithEmailAndPassword(auth!, email, pass); showToast('✅ Compte créé !'); onClose(); }
    catch (e) { showToast(errMsg(e)); } finally { setBusy(''); }
  };

  const doReset = async () => {
    if (!email) { showToast("⚠️ Entre d'abord ton e-mail"); return; }
    try { await sendPasswordResetEmail(auth!, email); showToast('📧 E-mail de réinitialisation envoyé'); }
    catch (e) { showToast(errMsg(e)); }
  };

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{user ? 'Mon compte' : 'Connexion'}</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        {user ? (
          <>
            <div style={{ background: 'var(--card)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Connecté en tant que</div>
              <div style={{ fontSize: 16, fontWeight: 700, wordBreak: 'break-all' }}>{user.email}</div>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 14 }}>
              Tes annonces affichent un bouton 🗑 pour les supprimer. Personne d'autre ne peut les modifier.
            </p>
            <button className="btn btn-danger btn-full" onClick={onLogout}>Se déconnecter</button>
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
            <p style={{ textAlign: 'center', marginTop: 12 }}>
              <a onClick={doReset} style={{ fontSize: 12.5, color: 'var(--muted)', textDecoration: 'underline', cursor: 'pointer' }}>
                Mot de passe oublié ?
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
