
-- SLA Config Table
CREATE TABLE public.sla_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  servico_id UUID REFERENCES servicos(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tempo_horas INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sla_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sla_config
CREATE POLICY "Admin gerencia sla_config" ON public.sla_config
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Colaboradores podem visualizar sla_config" ON public.sla_config
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Insert default SLAs
INSERT INTO public.sla_config (nome, tempo_horas) VALUES
  ('Resposta a cliente', 24),
  ('Tarefa urgente', 4),
  ('Tarefa normal', 48),
  ('Onboarding completo', 168);

-- Trigger for updated_at
CREATE TRIGGER update_sla_config_updated_at
  BEFORE UPDATE ON public.sla_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit Log Table
CREATE TABLE public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  acao TEXT NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit_log
CREATE INDEX idx_audit_usuario ON public.audit_log(usuario_id);
CREATE INDEX idx_audit_entidade ON public.audit_log(entidade, entidade_id);
CREATE INDEX idx_audit_data ON public.audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_log (admin only)
CREATE POLICY "Admin visualiza audit_log" ON public.audit_log
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (usuario_id, acao, entidade, entidade_id, dados_novos)
    VALUES (auth.uid(), 'Criou', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (usuario_id, acao, entidade, entidade_id, dados_anteriores, dados_novos)
    VALUES (auth.uid(), 'Atualizou', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (usuario_id, acao, entidade, entidade_id, dados_anteriores)
    VALUES (auth.uid(), 'Excluiu', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply audit triggers to important tables
CREATE TRIGGER audit_clientes 
  AFTER INSERT OR UPDATE OR DELETE ON public.clientes 
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_leads 
  AFTER INSERT OR UPDATE OR DELETE ON public.leads 
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_cobrancas 
  AFTER INSERT OR UPDATE OR DELETE ON public.cobrancas 
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- Agency Settings Table
CREATE TABLE public.configuracoes_agencia (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_agencia TEXT NOT NULL DEFAULT 'Minha Agência',
  logo_url TEXT,
  favicon_url TEXT,
  fuso_horario TEXT DEFAULT 'America/Sao_Paulo',
  moeda TEXT DEFAULT 'BRL',
  cor_principal TEXT DEFAULT '#3B82F6',
  razao_social TEXT,
  cnpj TEXT,
  endereco TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.configuracoes_agencia ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin gerencia configuracoes_agencia" ON public.configuracoes_agencia
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Colaboradores visualizam configuracoes_agencia" ON public.configuracoes_agencia
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Insert default config
INSERT INTO public.configuracoes_agencia (nome_agencia) VALUES ('Konverta');

-- Trigger for updated_at
CREATE TRIGGER update_configuracoes_agencia_updated_at
  BEFORE UPDATE ON public.configuracoes_agencia
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
