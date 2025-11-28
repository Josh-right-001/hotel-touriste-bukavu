export interface Admin {
  id: string
  name: string
  phone_number: string
  is_active: boolean
  created_at: string
}

export interface Client {
  id: string
  full_name: string
  phone_number: string
  email: string | null
  nationality: string | null
  id_document: string | null
  created_at: string
  // Extended fields for new features
  total_sejours?: number
  total_nuits?: number
  fidelite_score?: number
  tags?: string[]
  statut?: "actif" | "inactif"
  attribue_par?: "admin" | "receptionniste"
}

export interface RoomType {
  id: string
  name: string
  description: string | null
  base_price: number
  created_at: string
}

export interface Room {
  id: string
  room_number: string
  room_type_id: string
  floor: number
  status: "Disponible" | "Occupée" | "Nettoyage" | "Réservée" | "Maintenance"
  created_at: string
  updated_at: string
  room_type?: RoomType
}

export interface Reservation {
  id: string
  client_id: string
  room_id: string
  check_in_date: string
  check_out_date: string
  number_of_days: number
  total_price: number
  status: "active" | "completed" | "cancelled"
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
  client?: Client
  room?: Room
}

export interface HotelSettings {
  id: string
  hotel_name: string
  address: string
  phone: string
  email: string
  currency: string
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  titre: string
  body: string
  client_id?: string
  date: string
  lu: boolean
  lien?: string
  type: "client_enregistre" | "client_transfere" | "bot_envoi" | "system"
}

export interface MessageTemplate {
  id: string
  name: string
  content: string
  trigger: "post_checkout" | "inactif" | "anniversaire" | "manuel"
  days_threshold?: number
  is_active: boolean
}

export interface MessageLog {
  id: string
  client_id: string
  template_id: string
  canal: "whatsapp" | "email"
  date: string
  statut: "sent" | "delivered" | "failed"
}
