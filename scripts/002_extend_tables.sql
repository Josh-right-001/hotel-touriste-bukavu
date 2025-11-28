-- Add new columns to clients table for loyalty system
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS total_sejours INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_nuits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fidelite_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS statut VARCHAR(20) DEFAULT 'actif',
ADD COLUMN IF NOT EXISTS attribue_par VARCHAR(20) DEFAULT 'admin';

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  lu BOOLEAN DEFAULT FALSE,
  lien TEXT,
  type VARCHAR(50) DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to notifications" ON notifications FOR ALL USING (true);

-- Create message_templates table
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  trigger VARCHAR(50) NOT NULL,
  days_threshold INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to message_templates" ON message_templates FOR ALL USING (true);

-- Create message_logs table
CREATE TABLE IF NOT EXISTS message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
  canal VARCHAR(20) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  statut VARCHAR(20) DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to message_logs" ON message_logs FOR ALL USING (true);

-- Insert default message templates
INSERT INTO message_templates (name, content, trigger, days_threshold, is_active) VALUES
('Merci Post-Checkout', 'Bonjour {{nom}}, merci d''avoir choisi l''Hôtel Touriste. Nous espérons que votre séjour a été agréable. À bientôt ! — Hôtel Touriste, Place Mulamba.', 'post_checkout', NULL, true),
('Client Inactif', 'Bonjour {{nom}}, vous nous manquez ! Profitez d''une offre spéciale lors de votre prochaine réservation. Contactez-nous par WhatsApp.', 'inactif', 30, true),
('Client VIP', 'Cher(e) {{nom}}, toute l''équipe de l''Hôtel Touriste vous remercie pour votre fidélité. Nous sommes impatients de vous accueillir à nouveau.', 'manuel', NULL, true)
ON CONFLICT DO NOTHING;

-- Insert default admin numbers if not exists
INSERT INTO admins (name, phone_number, is_active) VALUES
('Admin Principal', '+243976938182', true),
('Admin Secondaire', '+243974156933', true)
ON CONFLICT DO NOTHING;
