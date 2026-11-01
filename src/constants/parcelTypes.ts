import { Parcel, ParcelType } from '../types';

export const PARCEL_TYPE_LABELS: Record<ParcelType, { fr: string; ar: string; en: string; icon: string }> = {
  vetements:    { fr: 'Vêtements',    ar: 'ملابس',         en: 'Clothes',       icon: '👕' },
  alimentaire:  { fr: 'Alimentaire',  ar: 'غذاء',          en: 'Food',          icon: '🍎' },
  electronique: { fr: 'Électronique', ar: 'إلكترونيات',    en: 'Electronics',   icon: '📱' },
  medicaments:  { fr: 'Médicaments',  ar: 'أدوية',         en: 'Medicine',      icon: '💊' },
  documents:    { fr: 'Documents',    ar: 'وثائق',          en: 'Documents',     icon: '📄' },
  autre:        { fr: 'Autre',        ar: 'أخرى',           en: 'Other',         icon: '📦' },
};

// Gabarit indicatif pour le voyageur : petit (sac à main), moyen (valise cabine), gros (soute)
export type ParcelSize = 'small' | 'medium' | 'large';

export function parcelSize(p: Pick<Parcel, 'weight' | 'length' | 'width' | 'height'>): ParcelSize | null {
  const litres = p.length && p.width && p.height ? (p.length * p.width * p.height) / 1000 : null;
  if (p.weight == null && litres == null) return null;
  const w = p.weight ?? 0;
  const v = litres ?? 0;
  if (w <= 2 && v <= 10) return 'small';
  if (w <= 10 && v <= 50) return 'medium';
  return 'large';
}
