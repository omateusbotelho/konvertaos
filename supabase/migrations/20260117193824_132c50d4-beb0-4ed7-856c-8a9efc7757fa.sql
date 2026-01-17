-- Configuração de NPS
CREATE TABLE public.nps_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ativo BOOLEAN DEFAULT true,
  frequencia_meses INTEGER DEFAULT 3,
  email_assunto TEXT DEFAULT 'Como está sua experiência conosco?',
  email_corpo TEXT DEFAULT 'Olá {{cliente_nome}},

Gostaríamos muito de saber sua opinião sobre nossos serviços.

Clique no link abaixo para responder uma pesquisa rápida (menos de 1 minuto):

{{link_pesquisa}}

Sua opinião é muito importante para nós!

Atenciosamente,
Equipe Konverta',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO public.nps_config (ativo) VALUES (true);

-- Envios de NPS
CREATE TABLE public.nps_envios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  enviado_em TIMESTAMPTZ DEFAULT NOW(),
  expira_em TIMESTAMPTZ NOT NULL,
  respondido BOOLEAN DEFAULT false,
  resposta_id UUID REFERENCES public.nps_respostas(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nps_envios_token ON public.nps_envios(token);
CREATE INDEX idx_nps_envios_cliente ON public.nps_envios(cliente_id);

-- Enable RLS
ALTER TABLE public.nps_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nps_envios ENABLE ROW LEVEL SECURITY;

-- RLS policies for nps_config (only admin can manage)
CREATE POLICY "Admin pode gerenciar config nps" ON public.nps_config
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Colaboradores podem visualizar config nps" ON public.nps_config
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS policies for nps_envios
CREATE POLICY "Admin pode gerenciar envios nps" ON public.nps_envios
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Colaboradores podem visualizar envios nps" ON public.nps_envios
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Update nps_respostas to allow public insert (for survey responses)
CREATE POLICY "Qualquer um pode inserir resposta nps via token" ON public.nps_respostas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Colaboradores podem visualizar respostas nps" ON public.nps_respostas
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at on nps_config
CREATE TRIGGER update_nps_config_updated_at
  BEFORE UPDATE ON public.nps_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();