export interface Trip {
  id: number;
  name: string;
  from_city: string;
  to_city: string;
  date: string;
  capacity: string;
  weight?: number | null;
  cap_desc?: string | null;
  wa: string;
  owner_id?: number | null;
  created_at: string;
}

export interface Parcel {
  id: number;
  from_city: string;
  to_city: string;
  description: string;
  budget: number;
  wa: string;
  owner_id?: number | null;
  created_at: string;
}

export type Screen = 'home' | 'parcels' | 'add-trip' | 'add-parcel';
