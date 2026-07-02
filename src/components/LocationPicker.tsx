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
    <div className="mb-3">
      <div className="row g-2">
        <div className="col">
          <select className="form-select" value={country} onChange={(e) => onCountry(e.target.value)}>
            <option value="">Pays…</option>
            <option value="France">🇫🇷 France</option>
            <option value="Algérie">🇩🇿 Algérie</option>
          </select>
        </div>
        <div className="col">
          <select className="form-select" value={city} onChange={(e) => onCity(e.target.value)} disabled={!country}>
            <option value="">Ville…</option>
            {country && LOCATIONS[country].map((c) => (
              <option key={c.name} value={c.name}>{c.name} {cityIcon(c.type)}</option>
            ))}
          </select>
        </div>
      </div>
      {legend && <div className="d-flex gap-3 mt-1 text-muted" style={{ fontSize: 12 }}><span>✈️ aéroport</span><span>⚓ port</span></div>}
    </div>
  );
}
