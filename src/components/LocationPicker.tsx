import React from 'react';
import { LOCATIONS, cityIcon } from '../constants/locations';

interface Props {
  country: string;
  city: string;
  onCountry: (v: string) => void;
  onCity: (v: string) => void;
  legend?: boolean;
}

export default function LocationPicker({ country, city, onCountry, onCity, legend }: Props) {
  return (
    <div className="field">
      <div className="loc-group">
        <select value={country} onChange={(e) => onCountry(e.target.value)}>
          <option value="">Pays…</option>
          <option value="France">🇫🇷 France</option>
          <option value="Algérie">🇩🇿 Algérie</option>
        </select>
        <select value={city} onChange={(e) => onCity(e.target.value)} disabled={!country}>
          <option value="">Ville…</option>
          {country && LOCATIONS[country].map((c) => (
            <option key={c.name} value={c.name}>{c.name} {cityIcon(c.type)}</option>
          ))}
        </select>
      </div>
      {legend && <div className="loc-legend"><span>✈️ aéroport</span><span>⚓ port</span></div>}
    </div>
  );
}
