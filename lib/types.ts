export interface Admin {
  id: string
  name: string
  phone_number: string
  is_active: boolean
  created_at: string
}

export interface Client {
  id: string
  nom: string
  postnom: string
  prenom: string
  full_name: string
  date_naissance: string | null
  adresse: string | null
  pays_origine: string | null
  matricule: string
  phone_number: string | null
  whatsapp_number: string
  whatsapp_country_code: string
  email: string | null
  document_type: string | null
  document_scan_url: string | null
  document_data: Record<string, string> | null
  commentaire: string | null
  nationality: string | null
  id_document: string | null
  created_at: string
  total_sejours: number
  total_nuits: number
  fidelite_score: number
  tags: string[]
  statut: "actif" | "inactif"
  attribue_par: "admin" | "receptionniste"
  is_vip: boolean
  is_duplicate: boolean
  messages_history: MessageHistory[]
}

export interface MessageHistory {
  id: string
  template_id: string
  canal: "whatsapp" | "email"
  date: string
  statut: "sent" | "delivered" | "failed"
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
  historique?: RoomHistory[]
}

export interface RoomHistory {
  date: string
  action: string
  user: string
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
  // Loyalty scoring parameters
  loyalty_visits_weight: number
  loyalty_nights_weight: number
  loyalty_engagement_weight: number
}

export interface Notification {
  id: string
  titre: string
  body: string
  client_id?: string
  date: string
  lu: boolean
  lien?: string
  type:
    | "client_enregistre"
    | "client_transfere"
    | "bot_envoi"
    | "system"
    | "doublon_detecte"
    | "vip_genere"
    | "document_scanne"
}

export interface MessageTemplate {
  id: string
  name: string
  content: string
  trigger: "post_checkout" | "inactif" | "anniversaire" | "manuel" | "doublon" | "vip_100" | "bienvenue"
  days_threshold?: number
  is_active: boolean
  created_at?: string
}

export interface MessageLog {
  id: string
  client_id: string
  template_id: string
  canal: "whatsapp" | "email"
  date: string
  statut: "sent" | "delivered" | "failed"
  sender_email?: string
  recipient_email?: string
}

// Country codes for WhatsApp
export interface CountryCode {
  code: string
  dial_code: string
  flag: string
  name: string
  min_length: number
  max_length: number
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: "CD", dial_code: "+243", flag: "🇨🇩", name: "RD Congo", min_length: 9, max_length: 9 },
  { code: "RW", dial_code: "+250", flag: "🇷🇼", name: "Rwanda", min_length: 9, max_length: 9 },
  { code: "BI", dial_code: "+257", flag: "🇧🇮", name: "Burundi", min_length: 8, max_length: 8 },
  { code: "UG", dial_code: "+256", flag: "🇺🇬", name: "Uganda", min_length: 9, max_length: 9 },
  { code: "KE", dial_code: "+254", flag: "🇰🇪", name: "Kenya", min_length: 9, max_length: 9 },
  { code: "TZ", dial_code: "+255", flag: "🇹🇿", name: "Tanzania", min_length: 9, max_length: 9 },
  { code: "ZA", dial_code: "+27", flag: "🇿🇦", name: "South Africa", min_length: 9, max_length: 9 },
  { code: "FR", dial_code: "+33", flag: "🇫🇷", name: "France", min_length: 9, max_length: 9 },
  { code: "BE", dial_code: "+32", flag: "🇧🇪", name: "Belgium", min_length: 9, max_length: 9 },
  { code: "US", dial_code: "+1", flag: "🇺🇸", name: "USA", min_length: 10, max_length: 10 },
]

// Bot message templates
export const BOT_MESSAGE_TEMPLATES = {
  remerciement: [
    "Merci d'avoir choisi l'Hôtel Touriste, le lieu de confort et d'excellence. Nous espérons que votre séjour a été agréable !",
    "Cher(e) {{nom}}, nous vous remercions pour votre confiance. L'Hôtel Touriste vous souhaite un excellent retour !",
    "Bonjour {{nom}}, merci d'avoir séjourné chez nous. Votre satisfaction est notre priorité. À très bientôt !",
  ],
  invitation: [
    "Cela fait un moment que nous ne vous avons pas reçu. Revenez découvrir nos nouveautés à l'Hôtel Touriste !",
    "{{nom}}, vous nous manquez ! Profitez d'une offre spéciale lors de votre prochaine réservation.",
    "Cher(e) {{nom}}, l'Hôtel Touriste vous attend. Découvrez nos nouvelles chambres rénovées !",
  ],
  vip: [
    "Félicitations {{nom}} ! Vous êtes désormais membre VIP de l'Hôtel Touriste. Merci pour votre fidélité exceptionnelle.",
    "Cher(e) {{nom}}, votre fidélité nous touche. En tant que client VIP, vous bénéficiez d'avantages exclusifs.",
    "{{nom}}, toute l'équipe de l'Hôtel Touriste vous remercie pour votre fidélité. Vous êtes maintenant VIP !",
  ],
  doublon: [
    "Merci pour votre confiance renouvelée {{nom}}. Nous sommes honorés de vous compter parmi nos clients fidèles.",
    "{{nom}}, content de vous revoir ! Votre fidélité à l'Hôtel Touriste nous fait chaud au cœur.",
  ],
  bienvenue: [
    "Bienvenue à l'Hôtel Touriste {{nom}} ! Nous sommes ravis de vous accueillir. Passez un excellent séjour !",
    "{{nom}}, bienvenue parmi nous ! L'équipe de l'Hôtel Touriste est à votre disposition.",
  ],
}
