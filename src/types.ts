export interface Trip {
  id: string;
  name: string;
  from: string;
  to: string;
  date: string;
  capacity: string;
  weight?: number | string;
  capDesc?: string;
  wa: string;
  ownerUid?: string;
}

export interface Parcel {
  id: string;
  from: string;
  to: string;
  desc: string;
  budget?: number | string;
  wa: string;
  ownerUid?: string;
}

export type Mode = 'cloud' | 'local';
export type Screen = 'home' | 'parcels' | 'add-trip' | 'add-parcel';
