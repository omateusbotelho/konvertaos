-- Enums
CREATE TYPE origem_lead AS ENUM ('formulario_site', 'anuncio_meta', 'anuncio_google', 'indicacao', 'ligacao', 'outro');
CREATE TYPE etapa_sdr AS ENUM ('novo', 'tentativa_contato', 'contato_realizado', 'qualificado', 'reuniao_agendada', 'perdido');
CREATE TYPE etapa_closer AS ENUM ('reuniao_agendada', 'reuniao_realizada', 'proposta_enviada', 'negociacao', 'fechado_ganho', 'perdido');
CREATE TYPE etapa_frios AS ENUM ('esfriar', 'reativacao', 'reativado', 'descartado');
CREATE TYPE funil_tipo AS ENUM ('sdr', 'closer', 'frios', 'convertido');
CREATE TYPE atividade_tipo AS ENUM ('ligacao', 'whatsapp', 'email', 'reuniao', 'anotacao');
CREATE TYPE status_cliente AS ENUM ('ativo', 'inadimplente', 'cancelado');
CREATE TYPE modelo_cobranca AS ENUM ('fee', 'fee_percentual', 'avulso');
CREATE TYPE forma_pagamento AS ENUM ('boleto', 'pix', 'cartao');
CREATE TYPE tipo_arquivo AS ENUM ('contrato', 'briefing', 'documento', 'outro');
CREATE TYPE tipo_timeline AS ENUM ('criado', 'servico_adicionado', 'servico_cancelado', 'valor_alterado', 'responsavel_alterado', 'pagamento_confirmado', 'pagamento_atrasado', 'tarefa_concluida', 'comentario', 'contrato_enviado', 'contrato_assinado', 'nps_recebido');

-- Lookup Tables
CREATE TABLE origens_lead (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO origens_lead (nome) VALUES 
  ('Formulário Site'),
  ('Anúncio Meta'),
  ('Anúncio Google'),
  ('Indicação'),
  ('Ligação'),
  ('Outro');

CREATE TABLE motivos_perda (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  aplicavel_a TEXT CHECK (aplicavel_a IN ('sdr', 'closer', 'ambos')) DEFAULT 'ambos',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO motivos_perda (nome, aplicavel_a) VALUES 
  ('Sem orçamento', 'ambos'),
  ('Fechou com concorrente', 'closer'),
  ('Não respondeu', 'ambos'),
  ('Sem perfil', 'sdr'),
  ('Escopo não atendido', 'closer'),
  ('Desistiu', 'ambos'),
  ('Outro', 'ambos');

CREATE TABLE servicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  setor_responsavel TEXT CHECK (setor_responsavel IN ('trafego', 'social_media')) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO servicos (nome, setor_responsavel) VALUES 
  ('Gestão de Tráfego', 'trafego'),
  ('Social Media', 'social_media'),
  ('Tráfego + Social Media', 'trafego'),
  ('Consultoria de Marketing', 'trafego');

-- Leads Table
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  empresa TEXT,
  telefone TEXT NOT NULL,
  email TEXT,
  origem_id UUID REFERENCES origens_lead(id),
  servico_interesse_id UUID REFERENCES servicos(id),
  observacoes TEXT,
  sdr_responsavel_id UUID REFERENCES profiles(id),
  closer_responsavel_id UUID REFERENCES profiles(id),
  etapa_sdr etapa_sdr DEFAULT 'novo',
  etapa_closer etapa_closer,
  etapa_frios etapa_frios,
  funil_atual funil_tipo DEFAULT 'sdr',
  motivo_perda_id UUID REFERENCES motivos_perda(id),
  data_agendamento TIMESTAMPTZ,
  data_perda TIMESTAMPTZ,
  data_conversao TIMESTAMPTZ,
  valor_proposta NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_sdr ON leads(sdr_responsavel_id);
CREATE INDEX idx_leads_closer ON leads(closer_responsavel_id);
CREATE INDEX idx_leads_funil ON leads(funil_atual);
CREATE INDEX idx_leads_etapa_sdr ON leads(etapa_sdr);
CREATE INDEX idx_leads_etapa_closer ON leads(etapa_closer);

-- Atividades Lead Table
CREATE TABLE atividades_lead (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  tipo atividade_tipo NOT NULL,
  descricao TEXT NOT NULL,
  realizado_por_id UUID REFERENCES profiles(id) NOT NULL,
  data_atividade TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_atividades_lead ON atividades_lead(lead_id);

-- Follow-ups Table
CREATE TABLE follow_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  data_programada TIMESTAMPTZ NOT NULL,
  descricao TEXT,
  concluido BOOLEAN DEFAULT false,
  concluido_em TIMESTAMPTZ,
  criado_por_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_followups_lead ON follow_ups(lead_id);
CREATE INDEX idx_followups_data ON follow_ups(data_programada);

-- Clientes Table
CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT,
  cpf TEXT,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  fee_mensal NUMERIC(12,2) NOT NULL,
  modelo_cobranca modelo_cobranca DEFAULT 'fee',
  percentual NUMERIC(5,2),
  dia_vencimento INTEGER CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  forma_pagamento forma_pagamento DEFAULT 'boleto',
  asaas_customer_id TEXT,
  data_ativacao TIMESTAMPTZ DEFAULT NOW(),
  status status_cliente DEFAULT 'ativo',
  data_cancelamento TIMESTAMPTZ,
  motivo_cancelamento TEXT,
  closer_responsavel_id UUID REFERENCES profiles(id),
  sdr_responsavel_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clientes_status ON clientes(status);
CREATE INDEX idx_clientes_closer ON clientes(closer_responsavel_id);

-- Cliente Servicos Table
CREATE TABLE cliente_servicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  servico_id UUID REFERENCES servicos(id) NOT NULL,
  responsavel_id UUID REFERENCES profiles(id) NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  status TEXT CHECK (status IN ('ativo', 'cancelado')) DEFAULT 'ativo',
  data_inicio TIMESTAMPTZ DEFAULT NOW(),
  data_cancelamento TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cliente_servicos_cliente ON cliente_servicos(cliente_id);
CREATE INDEX idx_cliente_servicos_responsavel ON cliente_servicos(responsavel_id);

-- Cliente Acessos Table
CREATE TABLE cliente_acessos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL,
  usuario TEXT,
  senha TEXT,
  url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cliente_acessos_cliente ON cliente_acessos(cliente_id);

-- Cliente Arquivos Table
CREATE TABLE cliente_arquivos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  tipo tipo_arquivo DEFAULT 'documento',
  url TEXT NOT NULL,
  uploaded_por_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cliente_arquivos_cliente ON cliente_arquivos(cliente_id);

-- Cliente Timeline Table
CREATE TABLE cliente_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  tipo tipo_timeline NOT NULL,
  descricao TEXT NOT NULL,
  dados_json JSONB,
  realizado_por_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_timeline_cliente ON cliente_timeline(cliente_id);

-- Enable RLS on all tables
ALTER TABLE origens_lead ENABLE ROW LEVEL SECURITY;
ALTER TABLE motivos_perda ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades_lead ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_acessos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_arquivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_timeline ENABLE ROW LEVEL SECURITY;

-- RLS for Lookup Tables (read by all authenticated)
CREATE POLICY "Authenticated users can read origens_lead" ON origens_lead FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read motivos_perda" ON motivos_perda FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read servicos" ON servicos FOR SELECT TO authenticated USING (true);

-- Admin manages lookup tables
CREATE POLICY "Admin manages origens_lead" ON origens_lead FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manages motivos_perda" ON motivos_perda FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manages servicos" ON servicos FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS for Leads
CREATE POLICY "Admin vê todos leads" ON leads FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "SDR vê seus leads" ON leads FOR SELECT USING (sdr_responsavel_id = auth.uid() OR (sdr_responsavel_id IS NULL AND funil_atual = 'sdr'));
CREATE POLICY "Closer vê seus leads" ON leads FOR SELECT USING (closer_responsavel_id = auth.uid());
CREATE POLICY "Admin gerencia leads" ON leads FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "SDR insere leads" ON leads FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Responsável atualiza lead" ON leads FOR UPDATE USING (sdr_responsavel_id = auth.uid() OR closer_responsavel_id = auth.uid());

-- RLS for Atividades Lead
CREATE POLICY "Admin vê todas atividades" ON atividades_lead FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Responsável vê atividades do lead" ON atividades_lead FOR SELECT USING (
  EXISTS (SELECT 1 FROM leads WHERE leads.id = atividades_lead.lead_id AND (leads.sdr_responsavel_id = auth.uid() OR leads.closer_responsavel_id = auth.uid()))
);
CREATE POLICY "Authenticated insere atividade" ON atividades_lead FOR INSERT WITH CHECK (realizado_por_id = auth.uid());
CREATE POLICY "Admin gerencia atividades" ON atividades_lead FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS for Follow-ups
CREATE POLICY "Admin vê todos follow-ups" ON follow_ups FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Responsável vê follow-ups do lead" ON follow_ups FOR SELECT USING (
  EXISTS (SELECT 1 FROM leads WHERE leads.id = follow_ups.lead_id AND (leads.sdr_responsavel_id = auth.uid() OR leads.closer_responsavel_id = auth.uid()))
);
CREATE POLICY "Authenticated insere follow-up" ON follow_ups FOR INSERT WITH CHECK (criado_por_id = auth.uid());
CREATE POLICY "Criador atualiza follow-up" ON follow_ups FOR UPDATE USING (criado_por_id = auth.uid());
CREATE POLICY "Admin gerencia follow-ups" ON follow_ups FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS for Clientes
CREATE POLICY "Admin vê todos clientes" ON clientes FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Colaborador vê clientes atribuídos" ON clientes FOR SELECT USING (
  EXISTS (SELECT 1 FROM cliente_servicos WHERE cliente_id = clientes.id AND responsavel_id = auth.uid())
);
CREATE POLICY "Admin gerencia clientes" ON clientes FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS for Cliente Servicos
CREATE POLICY "Admin vê todos cliente_servicos" ON cliente_servicos FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Responsável vê seus servicos" ON cliente_servicos FOR SELECT USING (responsavel_id = auth.uid());
CREATE POLICY "Admin gerencia cliente_servicos" ON cliente_servicos FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS for Cliente Acessos (sensitive - admin only)
CREATE POLICY "Admin gerencia cliente_acessos" ON cliente_acessos FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Responsável vê acessos do cliente" ON cliente_acessos FOR SELECT USING (
  EXISTS (SELECT 1 FROM cliente_servicos WHERE cliente_id = cliente_acessos.cliente_id AND responsavel_id = auth.uid())
);

-- RLS for Cliente Arquivos
CREATE POLICY "Admin vê todos arquivos" ON cliente_arquivos FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Responsável vê arquivos do cliente" ON cliente_arquivos FOR SELECT USING (
  EXISTS (SELECT 1 FROM cliente_servicos WHERE cliente_id = cliente_arquivos.cliente_id AND responsavel_id = auth.uid())
);
CREATE POLICY "Authenticated insere arquivo" ON cliente_arquivos FOR INSERT WITH CHECK (uploaded_por_id = auth.uid());
CREATE POLICY "Admin gerencia arquivos" ON cliente_arquivos FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS for Cliente Timeline
CREATE POLICY "Admin vê toda timeline" ON cliente_timeline FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Responsável vê timeline do cliente" ON cliente_timeline FOR SELECT USING (
  EXISTS (SELECT 1 FROM cliente_servicos WHERE cliente_id = cliente_timeline.cliente_id AND responsavel_id = auth.uid())
);
CREATE POLICY "Authenticated insere timeline" ON cliente_timeline FOR INSERT WITH CHECK (realizado_por_id = auth.uid());
CREATE POLICY "Admin gerencia timeline" ON cliente_timeline FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cliente_acessos_updated_at
  BEFORE UPDATE ON cliente_acessos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();