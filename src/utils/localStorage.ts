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
  { id: '1', name: 'Karim M.', from: 'Paris', to: 'Alger', date: '2026-06-18', capacity: '3', weight: 20, capDesc: 'Vêtements et petits cadeaux. Pas de liquides svp.', wa: '+33612345678' },
  { id: '2', name: 'Samira L.', from: 'Lyon', to: 'Oran', date: '2026-06-22', capacity: '2', weight: 15, capDesc: 'Médicaments et documents acceptés.', wa: '+33698765432' },
  { id: '3', name: 'Yacine B.', from: 'Marseille', to: 'Alger', date: '2026-07-01', capacity: '5+', weight: 40, capDesc: 'Je voyage en ferry (Algérie Ferries), grande capacité.', wa: '+33755443322' },
]);

export const sampleParcels = (): Parcel[] => ([
  { id: '1', from: 'Paris', to: 'Alger', desc: 'Médicaments + quelques habits pour mes parents. ~3 kg.', budget: 25, wa: '+33611223344' },
  { id: '2', from: 'Lyon', to: 'Oran', desc: 'Téléphone portable (cadeau anniversaire), bien emballé.', budget: 40, wa: '+33677889900' },
]);
