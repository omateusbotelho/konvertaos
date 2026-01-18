-- Enum para status do contrato
CREATE TYPE public.status_contrato AS ENUM ('rascunho', 'enviado', 'assinado', 'cancelado');

-- Tabela de contratos
CREATE TABLE public.contratos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  valor NUMERIC(12,2),
  data_inicio DATE,
  data_fim DATE,
  status status_contrato DEFAULT 'rascunho',
  assinado_em TIMESTAMPTZ,
  assinado_por TEXT,
  url_pdf TEXT,
  created_by_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contratos_cliente ON public.contratos(cliente_id);
CREATE INDEX idx_contratos_status ON public.contratos(status);

-- Tabela de templates de contrato
CREATE TABLE public.contrato_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  variaveis JSONB DEFAULT '[]',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin e Financeiro acessam contratos" ON public.contratos
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND setor = 'financeiro')
  );

CREATE POLICY "Admin gerencia templates de contrato" ON public.contrato_templates
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Colaboradores veem templates ativos" ON public.contrato_templates
  FOR SELECT USING (ativo = true AND auth.uid() IS NOT NULL);

-- Trigger updated_at
CREATE TRIGGER update_contratos_updated_at
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();