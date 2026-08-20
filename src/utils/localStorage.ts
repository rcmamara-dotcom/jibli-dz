import { Trip, Parcel } from '../types';

export const TRIPS_KEY = 'jibli_trips';
export const PARCELS_KEY = 'jibli_parcels';

export const lsGet = (k: string): string | null => {
  try { return localStorage.getItem(k); } catch { return null; }
};
export const lsSet = (k: string, v: string): void => {
  try { localStorage.setItem(k, v); } catch { /* ignore */ }
};

export const sampleTrips = (): Trip[] => ([
  { id: 1, name: 'Karim M.', from_city: 'Paris', to_city: 'Alger', date: '2026-06-18', capacity: '3', weight: 20, cap_desc: 'Vêtements et petits cadeaux.', wa: '+33612345678', owner_id: null, created_at: new Date().toISOString() },
  { id: 2, name: 'Samira L.', from_city: 'Lyon', to_city: 'Oran', date: '2026-06-22', capacity: '2', weight: 15, cap_desc: 'Médicaments et documents acceptés.', wa: '+33698765432', owner_id: null, created_at: new Date().toISOString() },
  { id: 3, name: 'Yacine B.', from_city: 'Marseille', to_city: 'Alger', date: '2026-07-01', capacity: '5+', weight: 40, cap_desc: 'Je voyage en ferry, grande capacité.', wa: '+33755443322', owner_id: null, created_at: new Date().toISOString() },
]);

export const sampleParcels = (): Parcel[] => ([
  { id: 1, from_city: 'Paris', to_city: 'Alger', description: 'Médicaments + quelques habits pour mes parents. ~3 kg.', budget: 25, wa: '+33611223344', owner_id: null, created_at: new Date().toISOString() },
  { id: 2, from_city: 'Lyon', to_city: 'Oran', description: 'Téléphone portable (cadeau anniversaire), bien emballé.', budget: 40, wa: '+33677889900', owner_id: null, created_at: new Date().toISOString() },
]);
