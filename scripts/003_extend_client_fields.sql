-- Extend clients table with new fields
ALTER TABLE clients ADD COLUMN IF NOT EXISTS nom TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS postnom TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS prenom TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS date_naissance DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS adresse TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pays_origine TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS matricule TEXT UNIQUE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp_country_code TEXT DEFAULT '+243';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS document_scan_url TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS document_data JSONB;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS commentaire TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS total_sejours INTEGER DEFAULT 1;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS total_nuits INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS fidelite_score INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'actif';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS attribue_par TEXT DEFAULT 'admin';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS messages_history JSONB DEFAULT '[]';

-- Update message_logs to support email configuration
ALTER TABLE message_logs ADD COLUMN IF NOT EXISTS sender_email TEXT;
ALTER TABLE message_logs ADD COLUMN IF NOT EXISTS recipient_email TEXT;

-- Add new trigger types to message_templates
ALTER TABLE message_templates DROP CONSTRAINT IF EXISTS message_templates_trigger_check;
ALTER TABLE message_templates ADD CONSTRAINT message_templates_trigger_check 
  CHECK (trigger IN ('post_checkout', 'inactif', 'anniversaire', 'manuel', 'doublon', 'vip_100', 'bienvenue'));

-- Add loyalty scoring parameters to hotel_settings
ALTER TABLE hotel_settings ADD COLUMN IF NOT EXISTS loyalty_visits_weight INTEGER DEFAULT 50;
ALTER TABLE hotel_settings ADD COLUMN IF NOT EXISTS loyalty_nights_weight INTEGER DEFAULT 30;
ALTER TABLE hotel_settings ADD COLUMN IF NOT EXISTS loyalty_engagement_weight INTEGER DEFAULT 20;

-- Add new notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('client_enregistre', 'client_transfere', 'bot_envoi', 'system', 'doublon_detecte', 'vip_genere', 'document_scanne'));

-- Create index for faster duplicate detection
CREATE INDEX IF NOT EXISTS idx_clients_whatsapp ON clients(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_clients_matricule ON clients(matricule);
CREATE INDEX IF NOT EXISTS idx_clients_fidelite ON clients(fidelite_score DESC);

-- Insert default message templates
INSERT INTO message_templates (name, content, trigger, is_active) VALUES
('Bienvenue', 'Bienvenue à l''Hôtel Touriste {{nom}} ! Nous sommes ravis de vous accueillir. Passez un excellent séjour !', 'bienvenue', true),
('Remerciement', 'Merci d''avoir choisi l''Hôtel Touriste {{nom}}. Nous espérons que votre séjour a été agréable. À bientôt !', 'post_checkout', true),
('Client fidèle', 'Cher(e) {{nom}}, merci pour votre fidélité. Vous êtes désormais membre privilégié de l''Hôtel Touriste.', 'vip_100', true),
('Invitation retour', '{{nom}}, vous nous manquez ! Profitez d''une offre spéciale lors de votre prochaine réservation à l''Hôtel Touriste.', 'inactif', true)
ON CONFLICT DO NOTHING;
