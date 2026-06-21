import React, { useState } from 'react';
import { Trip } from '../types';
import { waValid } from '../utils/whatsapp';
import LocationPicker from './LocationPicker';

interface Props {
  needLogin: boolean;
  onLogin: () => void;
  onPublish: (form: Omit<Trip, 'id'>, reset: () => void, onNeedLogin: () => void, navigate: () => void) => void;
  onNavigate: () => void;
}

const today = () => new Date().toISOString().split('T')[0];

export default function AddTrip({ needLogin, onLogin, onPublish, onNavigate }: Props) {
  const empty = { name: '', fromC: '', from: '', toC: '', to: '', date: today(), capacity: '3', weight: '', capDesc: '', wa: '' };
  const [f, setF] = useState(empty);
  const up = (k: keyof typeof empty) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  const handlePublish = () => {
    if (!waValid(f.wa)) return;
    onPublish(
      { name: f.name, from: f.from, to: f.to, date: f.date, capacity: f.capacity, weight: f.weight || '', capDesc: f.capDesc, wa: f.wa },
      () => setF({ ...empty, date: today() }),
      onLogin,
      onNavigate,
    );
  };

  return (
    <div className="screen active">
      <div className="form-card">
        <div className="form-title">✈️ Publier mon trajet</div>
        {needLogin && (
          <div className="login-note show">
            🔒 <a onClick={onLogin}>Connecte-toi</a> pour publier — tu pourras aussi modifier ou supprimer ton annonce.
          </div>
        )}
        <div className="field">
          <label>Votre prénom / nom</label>
          <input type="text" maxLength={50} placeholder="Ex: Ahmed B." value={f.name} onChange={(e) => up('name')(e.target.value)} />
        </div>
        <label style={{ fontSize: 13, fontWeight: 500 }}>Ville de départ</label>
        <LocationPicker country={f.fromC} city={f.from} onCountry={(v) => setF((s) => ({ ...s, fromC: v, from: '' }))} onCity={up('from')} />
        <label style={{ fontSize: 13, fontWeight: 500 }}>Ville d'arrivée</label>
        <LocationPicker country={f.toC} city={f.to} onCountry={(v) => setF((s) => ({ ...s, toC: v, to: '' }))} onCity={up('to')} legend />
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
          <textarea placeholder="Ex: J'accepte vêtements, médicaments, petits cadeaux. Pas de liquides." value={f.capDesc} onChange={(e) => up('capDesc')(e.target.value)} />
        </div>
        <div className="field">
          <label>Votre numéro WhatsApp</label>
          <input type="tel" placeholder="+33 6 12 34 56 78" value={f.wa} onChange={(e) => up('wa')(e.target.value)} />
          <div className="wa-hint">📱 Les expéditeurs vous contacteront directement.</div>
        </div>
        <button className="btn btn-green btn-full" onClick={handlePublish}>✅ Publier mon trajet</button>
      </div>
    </div>
  );
}
