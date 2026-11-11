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

export type Screen = 'home' | 'parcels' | 'add-trip' | 'add-parcel' | 'admin' | 'pricing' | 'settings' | 'shipments' | 'messages';

export interface Conversation {
  id: number;
  other_user_id: number;
  other_user_name: string | null;
  trip_id: number | null;
  parcel_id: number | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
}

export interface Message {
  id: number;
  sender_id: number;
  sender_name: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

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
