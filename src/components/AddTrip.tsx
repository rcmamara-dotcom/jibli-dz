import React, { useState } from 'react';
import LocationPicker from './LocationPicker';

type TripForm = {
  name: string; from_city: string; to_city: string;
  date: string; capacity: string; weight: string; cap_desc: string; wa: string;
};

interface Props {
  needLogin: boolean;
  onLogin: () => void;
  onPublish: (form: Omit<TripForm, 'id'>, reset: () => void, onNeedLogin: () => void, navigate: () => void) => void;
  onNavigate: () => void;
}

const today = () => new Date().toISOString().split('T')[0];

export default function AddTrip({ needLogin, onLogin, onPublish, onNavigate }: Props) {
  const empty: TripForm & { fromC: string; toC: string } = {
    name: '', fromC: '', from_city: '', toC: '', to_city: '',
    date: today(), capacity: '3', weight: '', cap_desc: '', wa: '',
  };
  const [f, setF] = useState(empty);
  const up = <K extends keyof typeof empty>(k: K) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  return (
    <div className="screen active">
      <div className="form-card">
        <div className="form-title">✈️ Publier mon trajet</div>
        {needLogin && (
          <div className="login-note show">
            🔒 <a onClick={onLogin} style={{ cursor: 'pointer' }}>Connecte-toi</a> pour publier — tu pourras aussi supprimer ton annonce.
          </div>
        )}
        <div className="field">
          <label>Votre prénom / nom</label>
          <input type="text" maxLength={50} placeholder="Ex: Ahmed B." value={f.name} onChange={(e) => up('name')(e.target.value)} />
        </div>
        <label style={{ fontSize: 13, fontWeight: 500 }}>Ville de départ</label>
        <LocationPicker country={f.fromC} city={f.from_city} onCountry={(v) => setF((s) => ({ ...s, fromC: v, from_city: '' }))} onCity={up('from_city')} />
        <label style={{ fontSize: 13, fontWeight: 500 }}>Ville d'arrivée</label>
        <LocationPicker country={f.toC} city={f.to_city} onCountry={(v) => setF((s) => ({ ...s, toC: v, to_city: '' }))} onCity={up('to_city')} legend />
        <div className="field-row">
          <div className="field">
            <label>Date de départ</label>
            <input type="date" value={f.date} onChange={(e) => up('date')(e.target.value)} />
          </div>
          <div className="field">
            <label>Nombre de colis</label>
            <select value={f.capacity} onChange={(e) => up('capacity')(e.target.value)}>
              <option>1</option><option>2</option><option>3</option><option>4</option><option>5+</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Poids total accepté (kg)</label>
          <input type="number" min={1} max={100} placeholder="Ex: 20" value={f.weight} onChange={(e) => up('weight')(e.target.value)} />
        </div>
        <div className="field">
          <label>Description de la capacité / conditions</label>
          <textarea placeholder="Ex: J'accepte vêtements, médicaments, petits cadeaux. Pas de liquides." value={f.cap_desc} onChange={(e) => up('cap_desc')(e.target.value)} />
        </div>
        <div className="field">
          <label>Votre numéro WhatsApp</label>
          <input type="tel" placeholder="+33 6 12 34 56 78" value={f.wa} onChange={(e) => up('wa')(e.target.value)} />
          <div className="wa-hint">📱 Les expéditeurs vous contacteront directement.</div>
        </div>
        <button className="btn btn-green btn-full" onClick={() =>
          onPublish(
            { name: f.name, from_city: f.from_city, to_city: f.to_city, date: f.date, capacity: f.capacity, weight: f.weight, cap_desc: f.cap_desc, wa: f.wa },
            () => setF({ ...empty, date: today() }),
            onLogin,
            onNavigate,
          )
        }>✅ Publier mon trajet</button>
      </div>
    </div>
  );
}
