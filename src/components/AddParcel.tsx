import React, { useState } from 'react';
import { Parcel } from '../types';
import LocationPicker from './LocationPicker';

interface Props {
  needLogin: boolean;
  onLogin: () => void;
  onPublish: (form: Omit<Parcel, 'id'>, reset: () => void, onNeedLogin: () => void, navigate: () => void) => void;
  onNavigate: () => void;
}

export default function AddParcel({ needLogin, onLogin, onPublish, onNavigate }: Props) {
  const empty = { fromC: '', from: '', toC: '', to: '', desc: '', budget: '', wa: '' };
  const [f, setF] = useState(empty);
  const up = (k: keyof typeof empty) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  return (
    <div className="screen active">
      <div className="form-card">
        <div className="form-title">📦 Envoyer un colis</div>
        {needLogin && (
          <div className="login-note show">
            🔒 <a onClick={onLogin}>Connecte-toi</a> pour publier — tu pourras aussi supprimer ton annonce ensuite.
          </div>
        )}
        <label style={{ fontSize: 13, fontWeight: 500 }}>Ville de départ</label>
        <LocationPicker country={f.fromC} city={f.from} onCountry={(v) => setF((s) => ({ ...s, fromC: v, from: '' }))} onCity={up('from')} />
        <label style={{ fontSize: 13, fontWeight: 500 }}>Ville d'arrivée</label>
        <LocationPicker country={f.toC} city={f.to} onCountry={(v) => setF((s) => ({ ...s, toC: v, to: '' }))} onCity={up('to')} legend />
        <div className="field">
          <label>Description du colis</label>
          <textarea placeholder="Ex: Vêtements et médicaments pour ma famille. Environ 5 kg." value={f.desc} onChange={(e) => up('desc')(e.target.value)} />
        </div>
        <div className="field">
          <label>Budget proposé (€)</label>
          <input type="number" min={0} max={500} placeholder="Ex: 30" value={f.budget} onChange={(e) => up('budget')(e.target.value)} />
        </div>
        <div className="field">
          <label>Votre numéro WhatsApp</label>
          <input type="tel" placeholder="+33 6 12 34 56 78" value={f.wa} onChange={(e) => up('wa')(e.target.value)} />
          <div className="wa-hint">📱 Les voyageurs vous contacteront pour s'arranger.</div>
        </div>
        <button className="btn btn-gold btn-full" onClick={() => onPublish(
          { from: f.from, to: f.to, desc: f.desc, budget: f.budget, wa: f.wa },
          () => setF(empty),
          onLogin,
          onNavigate,
        )}>📦 Publier mon colis</button>
      </div>
    </div>
  );
}
