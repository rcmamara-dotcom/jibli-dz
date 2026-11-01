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
  avg_rating?: number | null;
  review_count?: number;
}

export interface Review {
  id: number;
  trip_id: number;
  reviewer_id: number;
  reviewer_email: string;
  rating: number;
  comment?: string | null;
  created_at: string;
}

export type ParcelType = 'vetements' | 'alimentaire' | 'electronique' | 'medicaments' | 'documents' | 'autre';

export interface Parcel {
  id: number;
  from_city: string;
  to_city: string;
  description: string;
  budget: number;
  wa: string;
  owner_id?: number | null;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  parcel_type?: ParcelType | null;
  created_at: string;
}

export type Screen = 'home' | 'parcels' | 'add-trip' | 'add-parcel' | 'admin' | 'pricing' | 'settings' | 'shipments';

export const SHIPMENT_STEPS = ['deposited', 'accepted', 'picked_up', 'in_transit', 'arrived', 'delivered'] as const;
export type ShipmentStatus = typeof SHIPMENT_STEPS[number] | 'cancelled';

export interface Shipment {
  id: number;
  trip_id: number | null;
  from_city: string;
  to_city: string;
  trip_date: string | null;
  description: string;
  status: ShipmentStatus;
  role: 'sender' | 'carrier';
  counterpart_name: string | null;
  events: { status: ShipmentStatus; created_at: string }[];
  created_at: string;
}
