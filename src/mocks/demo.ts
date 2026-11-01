import { Parcel, Trip } from '../types';

// Données de démonstration, affichées seulement aux admins via le switch de l'accueil.
// Jamais envoyées à l'API. Ids négatifs pour ne jamais croiser une vraie annonce,
// numéros dans la plage +33 6 39 98 réservée à la fiction par l'ARCEP.

const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
const now = new Date().toISOString();

export const isDemo = (item: { id: number }) => item.id < 0;

export const DEMO_TRIPS: Trip[] = [
  { id: -1, name: 'Karim M.', from_city: 'Paris', to_city: 'Alger', date: inDays(5), capacity: '3', weight: 20, cap_desc: 'Vêtements et petits cadeaux. Pas de liquides svp.', wa: '+33639980001', owner_id: null, created_at: now, avg_rating: 4.8, review_count: 12 },
  { id: -2, name: 'Samira L.', from_city: 'Lyon', to_city: 'Oran', date: inDays(9), capacity: '2', weight: 15, cap_desc: 'Médicaments et documents acceptés.', wa: '+33639980002', owner_id: null, created_at: now, avg_rating: 5, review_count: 4 },
  { id: -3, name: 'Yacine B.', from_city: 'Marseille', to_city: 'Alger', date: inDays(14), capacity: '5+', weight: 40, cap_desc: 'Je voyage en ferry, grande capacité.', wa: '+33639980003', owner_id: null, created_at: now, avg_rating: 4.5, review_count: 8 },
  { id: -4, name: 'Nadia K.', from_city: 'Toulouse', to_city: 'Constantine', date: inDays(21), capacity: '2', weight: 10, cap_desc: 'Petits colis uniquement.', wa: '+33639980004', owner_id: null, created_at: now, avg_rating: null, review_count: 0 },
  { id: -5, name: 'Mehdi A.', from_city: 'Lille', to_city: 'Annaba', date: inDays(27), capacity: '3', weight: 23, cap_desc: 'Valise en soute disponible.', wa: '+33639980005', owner_id: null, created_at: now, avg_rating: 4.2, review_count: 3 },
  { id: -6, name: 'Lina S.', from_city: 'Nice', to_city: 'Béjaïa', date: inDays(35), capacity: '1', weight: 5, cap_desc: 'Documents et bijoux, remise en main propre.', wa: '+33639980006', owner_id: null, created_at: now, avg_rating: null, review_count: 0 },
];

export const DEMO_PARCELS: Parcel[] = [
  { id: -1, from_city: 'Paris', to_city: 'Alger', description: 'Médicaments + quelques habits pour mes parents.', budget: 25, wa: '+33639980011', owner_id: null, weight: 3, length: 40, width: 30, height: 20, parcel_type: 'medicaments', created_at: now },
  { id: -2, from_city: 'Lyon', to_city: 'Oran', description: 'Téléphone portable (cadeau anniversaire), bien emballé.', budget: 40, wa: '+33639980012', owner_id: null, weight: 0.5, length: 20, width: 15, height: 10, parcel_type: 'electronique', created_at: now },
  { id: -3, from_city: 'Marseille', to_city: 'Constantine', description: 'Dossier administratif à remettre en main propre.', budget: 15, wa: '+33639980013', owner_id: null, weight: 0.2, length: null, width: null, height: null, parcel_type: 'documents', created_at: now },
  { id: -4, from_city: 'Bordeaux', to_city: 'Tlemcen', description: 'Vêtements pour enfants, sac souple.', budget: 30, wa: '+33639980014', owner_id: null, weight: 5, length: 50, width: 35, height: 25, parcel_type: 'vetements', created_at: now },
];
