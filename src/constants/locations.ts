export type CityType = 'air' | 'port' | 'both';

export const LOCATIONS: Record<string, { name: string; type: CityType }[]> = {
  France: [
    { name: 'Paris', type: 'air' }, { name: 'Lyon', type: 'air' },
    { name: 'Marseille', type: 'both' }, { name: 'Toulouse', type: 'air' },
    { name: 'Nice', type: 'air' }, { name: 'Lille', type: 'air' },
    { name: 'Bordeaux', type: 'air' }, { name: 'Nantes', type: 'air' },
    { name: 'Strasbourg', type: 'air' }, { name: 'Montpellier', type: 'air' },
    { name: 'Sète', type: 'port' }, { name: 'Toulon', type: 'port' },
  ],
  Algérie: [
    { name: 'Alger', type: 'both' }, { name: 'Oran', type: 'both' },
    { name: 'Constantine', type: 'air' }, { name: 'Annaba', type: 'both' },
    { name: 'Béjaïa', type: 'both' }, { name: 'Sétif', type: 'air' },
    { name: 'Tlemcen', type: 'air' }, { name: 'Batna', type: 'air' },
    { name: 'Chlef', type: 'air' }, { name: 'Skikda', type: 'port' },
    { name: 'Mostaganem', type: 'port' }, { name: 'Ghazaouet', type: 'port' },
  ],
};

export const cityIcon = (t: CityType): string =>
  t === 'both' ? '✈️ ⚓' : t === 'air' ? '✈️' : '⚓';

export const DEST_FILTERS = ['all', 'Alger', 'Oran', 'Constantine', 'Annaba', 'Béjaïa'];
