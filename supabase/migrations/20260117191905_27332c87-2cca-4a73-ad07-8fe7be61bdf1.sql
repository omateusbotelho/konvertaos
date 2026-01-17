-- =====================
-- MÓDULO FINANCEIRO
-- =====================

-- Enums
CREATE TYPE status_cobranca AS ENUM ('pendente', 'pago', 'atrasado', 'cancelado', 'falhou');
CREATE TYPE tipo_cobranca AS ENUM ('recorrente', 'avulsa');
CREATE TYPE status_comissao AS ENUM ('pendente', 'aprovada', 'paga', 'cancelada');
CREATE TYPE tipo_comissao AS ENUM ('sdr', 'closer');
CREATE TYPE categoria_custo AS ENUM ('ferramenta', 'pessoal', 'infraestrutura', 'midia', 'freelancer', 'outros');
CREATE TYPE tipo_lancamento AS ENUM ('receita', 'despesa');

-- Tabela: cobrancas
CREATE TABLE cobrancas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  asaas_payment_id TEXT,
  tipo tipo_cobranca DEFAULT 'recorrente',
  valor NUMERIC(12,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status status_cobranca DEFAULT 'pendente',
  forma_pagamento forma_pagamento,
  url_boleto TEXT,
  url_pix TEXT,
  linha_digitavel TEXT,
  pix_copia_cola TEXT,
  tentativas INTEGER DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cobrancas_cliente ON cobrancas(cliente_id);
CREATE INDEX idx_cobrancas_status ON cobrancas(status);
CREATE INDEX idx_cobrancas_vencimento ON cobrancas(data_vencimento);

-- Tabela: comissoes
CREATE TABLE comissoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  cobranca_id UUID REFERENCES cobrancas(id),
  colaborador_id UUID REFERENCES profiles(id) NOT NULL,
  tipo_colaborador tipo_comissao NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  percentual NUMERIC(5,2),
  status status_comissao DEFAULT 'pendente',
  data_referencia DATE NOT NULL,
  data_pagamento DATE,
  observacoes TEXT,
  aprovado_por_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comissoes_colaborador ON comissoes(colaborador_id);
CREATE INDEX idx_comissoes_status ON comissoes(status);
CREATE INDEX idx_comissoes_referencia ON comissoes(data_referencia);

-- Tabela: comissao_config
CREATE TABLE comissao_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID REFERENCES profiles(id) NOT NULL,
  tipo TEXT CHECK (tipo IN ('fixo', 'percentual')) DEFAULT 'fixo',
  valor NUMERIC(12,2) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(colaborador_id)
);

-- Tabela: custos_fixos
CREATE TABLE custos_fixos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria categoria_custo NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  recorrente BOOLEAN DEFAULT true,
  dia_vencimento INTEGER,
  ativo BOOLEAN DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: custos_variaveis
CREATE TABLE custos_variaveis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id),
  nome TEXT NOT NULL,
  categoria categoria_custo NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  data_referencia DATE NOT NULL,
  observacoes TEXT,
  lancado_por_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_custos_variaveis_cliente ON custos_variaveis(cliente_id);
CREATE INDEX idx_custos_variaveis_data ON custos_variaveis(data_referencia);

-- Tabela: lancamentos
CREATE TABLE lancamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo tipo_lancamento NOT NULL,
  categoria TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  data DATE NOT NULL,
  cliente_id UUID REFERENCES clientes(id),
  cobranca_id UUID REFERENCES cobrancas(id),
  custo_fixo_id UUID REFERENCES custos_fixos(id),
  custo_variavel_id UUID REFERENCES custos_variaveis(id),
  lancado_por_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lancamentos_tipo ON lancamentos(tipo);
CREATE INDEX idx_lancamentos_data ON lancamentos(data);
CREATE INDEX idx_lancamentos_cliente ON lancamentos(cliente_id);

-- Tabela: nps_respostas
CREATE TABLE nps_respostas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 10) NOT NULL,
  comentario TEXT,
  enviado_em TIMESTAMPTZ,
  respondido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nps_cliente ON nps_respostas(cliente_id);

-- Views para Relatórios
CREATE VIEW resumo_financeiro_mensal AS
SELECT 
  date_trunc('month', data) as mes,
  SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as receita,
  SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as despesa,
  SUM(CASE WHEN tipo = 'receita' THEN valor ELSE -valor END) as lucro
FROM lancamentos
GROUP BY date_trunc('month', data)
ORDER BY mes DESC;

CREATE VIEW margem_por_cliente AS
SELECT 
  c.id as cliente_id,
  c.razao_social,
  c.nome_fantasia,
  c.fee_mensal as receita_mensal,
  COALESCE(SUM(cv.valor), 0) as custos_variaveis,
  c.fee_mensal - COALESCE(SUM(cv.valor), 0) as margem
FROM clientes c
LEFT JOIN custos_variaveis cv ON cv.cliente_id = c.id 
  AND cv.data_referencia >= date_trunc('month', CURRENT_DATE)
WHERE c.status = 'ativo'
GROUP BY c.id
ORDER BY margem DESC;

CREATE VIEW mrr_atual AS
SELECT 
  SUM(fee_mensal) as mrr,
  COUNT(*) as total_clientes
FROM clientes
WHERE status = 'ativo';

-- Enable RLS
ALTER TABLE cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissao_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE custos_fixos ENABLE ROW LEVEL SECURITY;
ALTER TABLE custos_variaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_respostas ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin or financeiro
CREATE OR REPLACE FUNCTION is_admin_or_financeiro()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND cargo = 'financeiro'
  ) OR has_role(auth.uid(), 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RLS Policies for cobrancas
CREATE POLICY "Admin e Financeiro gerenciam cobrancas" ON cobrancas
  FOR ALL USING (is_admin_or_financeiro());

-- RLS Policies for comissoes
CREATE POLICY "Admin e Financeiro gerenciam comissoes" ON comissoes
  FOR ALL USING (is_admin_or_financeiro());

CREATE POLICY "Colaborador vê próprias comissoes" ON comissoes
  FOR SELECT USING (colaborador_id = auth.uid());

-- RLS Policies for comissao_config
CREATE POLICY "Admin e Financeiro gerenciam comissao_config" ON comissao_config
  FOR ALL USING (is_admin_or_financeiro());

CREATE POLICY "Colaborador vê própria config comissao" ON comissao_config
  FOR SELECT USING (colaborador_id = auth.uid());

-- RLS Policies for custos_fixos
CREATE POLICY "Admin e Financeiro gerenciam custos_fixos" ON custos_fixos
  FOR ALL USING (is_admin_or_financeiro());

-- RLS Policies for custos_variaveis
CREATE POLICY "Admin e Financeiro gerenciam custos_variaveis" ON custos_variaveis
  FOR ALL USING (is_admin_or_financeiro());

-- RLS Policies for lancamentos
CREATE POLICY "Admin e Financeiro gerenciam lancamentos" ON lancamentos
  FOR ALL USING (is_admin_or_financeiro());

-- RLS Policies for nps_respostas
CREATE POLICY "Admin e Financeiro gerenciam nps" ON nps_respostas
  FOR ALL USING (is_admin_or_financeiro());

CREATE POLICY "Responsável vê nps do cliente" ON nps_respostas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cliente_servicos 
      WHERE cliente_servicos.cliente_id = nps_respostas.cliente_id 
      AND cliente_servicos.responsavel_id = auth.uid()
    )
  );

-- Trigger function: on_pagamento_confirmado
CREATE OR REPLACE FUNCTION on_pagamento_confirmado()
RETURNS TRIGGER AS $$
DECLARE
  v_cliente RECORD;
  v_sdr_config RECORD;
  v_closer_config RECORD;
  v_user_id UUID;
BEGIN
  IF OLD.status != 'pago' AND NEW.status = 'pago' THEN
    -- Get current user or use a system user if none
    v_user_id := COALESCE(auth.uid(), NEW.cliente_id);
    
    -- Buscar dados do cliente
    SELECT * INTO v_cliente FROM clientes WHERE id = NEW.cliente_id;
    
    -- Criar lançamento de receita
    INSERT INTO lancamentos (tipo, categoria, descricao, valor, data, cliente_id, cobranca_id, lancado_por_id)
    VALUES (
      'receita',
      'mensalidade',
      'Pagamento ' || to_char(NEW.data_vencimento, 'MM/YYYY') || ' - ' || v_cliente.razao_social,
      NEW.valor,
      COALESCE(NEW.data_pagamento, CURRENT_DATE),
      NEW.cliente_id,
      NEW.id,
      v_user_id
    );
    
    -- Criar comissão do SDR (se existir)
    IF v_cliente.sdr_responsavel_id IS NOT NULL THEN
      SELECT * INTO v_sdr_config FROM comissao_config 
      WHERE colaborador_id = v_cliente.sdr_responsavel_id AND ativo = true;
      
      IF v_sdr_config IS NOT NULL THEN
        INSERT INTO comissoes (cliente_id, cobranca_id, colaborador_id, tipo_colaborador, valor, data_referencia)
        VALUES (
          NEW.cliente_id,
          NEW.id,
          v_cliente.sdr_responsavel_id,
          'sdr',
          v_sdr_config.valor,
          NEW.data_vencimento
        );
      END IF;
    END IF;
    
    -- Criar comissão do Closer
    IF v_cliente.closer_responsavel_id IS NOT NULL THEN
      SELECT * INTO v_closer_config FROM comissao_config 
      WHERE colaborador_id = v_cliente.closer_responsavel_id AND ativo = true;
      
      IF v_closer_config IS NOT NULL THEN
        INSERT INTO comissoes (cliente_id, cobranca_id, colaborador_id, tipo_colaborador, valor, data_referencia)
        VALUES (
          NEW.cliente_id,
          NEW.id,
          v_cliente.closer_responsavel_id,
          'closer',
          v_closer_config.valor,
          NEW.data_vencimento
        );
      END IF;
    END IF;
    
    -- Registrar na timeline do cliente
    INSERT INTO cliente_timeline (cliente_id, tipo, descricao, dados_json, realizado_por_id)
    VALUES (
      NEW.cliente_id,
      'pagamento_confirmado',
      'Pagamento confirmado: R$ ' || NEW.valor,
      jsonb_build_object('cobranca_id', NEW.id, 'valor', NEW.valor),
      v_user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER on_cobranca_paga
  AFTER UPDATE ON cobrancas
  FOR EACH ROW
  EXECUTE FUNCTION on_pagamento_confirmado();

-- Trigger for updated_at
CREATE TRIGGER update_cobrancas_updated_at
  BEFORE UPDATE ON cobrancas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comissoes_updated_at
  BEFORE UPDATE ON comissoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comissao_config_updated_at
  BEFORE UPDATE ON comissao_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custos_fixos_updated_at
  BEFORE UPDATE ON custos_fixos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();