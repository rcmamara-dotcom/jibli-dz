import React from 'react';
import { Conversation, Trip, Parcel } from '../types';

// L'API renvoie des dates UTC sans fuseau : sans « Z », le navigateur les lirait en heure locale
export const parseDate = (iso: string) => new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : iso + 'Z');

export const listingLabel = (c: Pick<Conversation, 'trip_id' | 'parcel_id'>, trips: Trip[], parcels: Parcel[]) => {
  const l = c.trip_id ? trips.find((x) => x.id === c.trip_id) : parcels.find((x) => x.id === c.parcel_id);
  return l ? `${l.from_city} → ${l.to_city}` : null;
};

// Teintes de la charte (vert, or, ardoise…) : chaque contact garde toujours la même
const HUES = ['#1a6b3c', '#b7791f', '#0e7490', '#7c3aed', '#be123c', '#4d7c0f'];

export function Avatar({ name, size = 44 }: { name: string | null; size?: number }) {
  const label = (name ?? '?').trim();
  const initials = label.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  const hue = HUES[[...label].reduce((h, ch) => h + ch.charCodeAt(0), 0) % HUES.length];
  return (
    <span className="msg-avatar" style={{ background: hue, width: size, height: size, fontSize: size * 0.38 }} aria-hidden>
      {initials}
    </span>
  );
}
