import React, { useState } from 'react';
import LocationPicker from './LocationPicker';

type ParcelForm = {
  from_city: string; to_city: string; description: string; budget: string; wa: string;
};

interface Props {
  needLogin: boolean;
  onLogin: () => void;
  onPublish: (form: ParcelForm, reset: () => void, onNeedLogin: () => void, navigate: () => void) => void;
  onNavigate: () => void;
}

export default function AddParcel({ needLogin, onLogin, onPublish, onNavigate }: Props) {
  const empty: ParcelForm & { fromC: string; toC: string } = {
    fromC: '', from_city: '', toC: '', to_city: '', description: '', budget: '', wa: '',
  };
  const [f, setF] = useState(empty);
  const up = <K extends keyof typeof empty>(k: K) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  return (
    <div className="container-xxl py-4 px-3 px-lg-4">
      <div className="mx-auto" style={{ maxWidth: 680 }}>
        <div className="card shadow-sm border-0 p-4">
          <div className="form-title mb-4">📦 Envoyer un colis</div>
          {needLogin && (
            <div className="login-note p-3 rounded-3 mb-3">
              🔒 <a onClick={onLogin} style={{ cursor: 'pointer' }}>Connecte-toi</a> pour publier — tu pourras aussi supprimer ton annonce ensuite.
            </div>
          )}
          <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Ville de départ</label>
          <LocationPicker country={f.fromC} city={f.from_city} onCountry={(v) => setF((s) => ({ ...s, fromC: v, from_city: '' }))} onCity={up('from_city')} />
          <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Ville d'arrivée</label>
          <LocationPicker country={f.toC} city={f.to_city} onCountry={(v) => setF((s) => ({ ...s, toC: v, to_city: '' }))} onCity={up('to_city')} legend />
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Description du colis</label>
            <textarea className="form-control" rows={3} placeholder="Ex: Vêtements et médicaments pour ma famille. Environ 5 kg." value={f.description} onChange={(e) => up('description')(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Budget proposé (€)</label>
            <input type="number" className="form-control" min={0} max={500} placeholder="Ex: 30" value={f.budget} onChange={(e) => up('budget')(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Votre numéro WhatsApp</label>
            <input type="tel" className="form-control" placeholder="+33 6 12 34 56 78" value={f.wa} onChange={(e) => up('wa')(e.target.value)} />
            <div className="text-muted mt-1" style={{ fontSize: 12 }}>📱 Les voyageurs vous contacteront pour s'arranger.</div>
          </div>
          <button className="btn btn-gold w-100 py-3" onClick={() =>
            onPublish(
              { from_city: f.from_city, to_city: f.to_city, description: f.description, budget: f.budget, wa: f.wa },
              () => setF(empty),
              onLogin,
              onNavigate,
            )
          }>📦 Publier mon colis</button>
        </div>
      </div>
    </div>
  );
}
