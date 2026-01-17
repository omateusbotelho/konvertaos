-- Tipos para reuniões e ausências
CREATE TYPE tipo_reuniao AS ENUM ('weekly', '1:1', 'projeto', 'cliente', 'outro');
CREATE TYPE status_reuniao AS ENUM ('agendada', 'realizada', 'cancelada');
CREATE TYPE tipo_ausencia AS ENUM ('ferias', 'ausencia');
CREATE TYPE status_ausencia AS ENUM ('pendente', 'aprovada', 'recusada');

-- Tabela de reuniões
CREATE TABLE reunioes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo tipo_reuniao DEFAULT 'outro',
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ NOT NULL,
  local TEXT,
  organizador_id UUID REFERENCES profiles(id) NOT NULL,
  projeto_id UUID REFERENCES projetos(id),
  cliente_id UUID REFERENCES clientes(id),
  lead_id UUID REFERENCES leads(id),
  recorrente BOOLEAN DEFAULT false,
  recorrencia_config JSONB,
  status status_reuniao DEFAULT 'agendada',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reunioes_data ON reunioes(data_inicio);
CREATE INDEX idx_reunioes_organizador ON reunioes(organizador_id);

-- Participantes
CREATE TABLE reuniao_participantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reuniao_id UUID REFERENCES reunioes(id) ON DELETE CASCADE NOT NULL,
  participante_id UUID REFERENCES profiles(id) NOT NULL,
  confirmado BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reuniao_id, participante_id)
);

-- Atas
CREATE TABLE reuniao_atas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reuniao_id UUID REFERENCES reunioes(id) ON DELETE CASCADE NOT NULL UNIQUE,
  conteudo TEXT NOT NULL,
  created_by_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tarefas geradas da ata
CREATE TABLE reuniao_ata_tarefas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ata_id UUID REFERENCES reuniao_atas(id) ON DELETE CASCADE NOT NULL,
  tarefa_id UUID REFERENCES tarefas(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ausências
CREATE TABLE ausencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID REFERENCES profiles(id) NOT NULL,
  tipo tipo_ausencia NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  motivo TEXT,
  status status_ausencia DEFAULT 'pendente',
  aprovado_por_id UUID REFERENCES profiles(id),
  aprovado_em TIMESTAMPTZ,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ausencias_colaborador ON ausencias(colaborador_id);
CREATE INDEX idx_ausencias_periodo ON ausencias(data_inicio, data_fim);

-- RLS para reuniões
ALTER TABLE reunioes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin vê todas reunioes" ON reunioes
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Organizador gerencia reuniao" ON reunioes
  FOR ALL USING (organizador_id = auth.uid());

CREATE POLICY "Participante vê reuniao" ON reunioes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reuniao_participantes 
      WHERE reuniao_id = reunioes.id AND participante_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated cria reuniao" ON reunioes
  FOR INSERT WITH CHECK (organizador_id = auth.uid());

-- RLS para participantes
ALTER TABLE reuniao_participantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gerencia participantes" ON reuniao_participantes
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Organizador gerencia participantes" ON reuniao_participantes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM reunioes WHERE id = reuniao_id AND organizador_id = auth.uid())
  );

CREATE POLICY "Participante vê participantes" ON reuniao_participantes
  FOR SELECT USING (
    participante_id = auth.uid() OR
    EXISTS (SELECT 1 FROM reuniao_participantes rp WHERE rp.reuniao_id = reuniao_participantes.reuniao_id AND rp.participante_id = auth.uid())
  );

CREATE POLICY "Participante atualiza confirmacao" ON reuniao_participantes
  FOR UPDATE USING (participante_id = auth.uid());

-- RLS para atas
ALTER TABLE reuniao_atas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gerencia atas" ON reuniao_atas
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Organizador gerencia ata" ON reuniao_atas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM reunioes WHERE id = reuniao_id AND organizador_id = auth.uid())
  );

CREATE POLICY "Participante vê ata" ON reuniao_atas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reuniao_participantes rp 
      WHERE rp.reuniao_id = reuniao_atas.reuniao_id AND rp.participante_id = auth.uid()
    )
  );

CREATE POLICY "Participante cria ata" ON reuniao_atas
  FOR INSERT WITH CHECK (created_by_id = auth.uid());

-- RLS para tarefas da ata
ALTER TABLE reuniao_ata_tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gerencia ata_tarefas" ON reuniao_ata_tarefas
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Participante vê ata_tarefas" ON reuniao_ata_tarefas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reuniao_atas ra
      JOIN reuniao_participantes rp ON rp.reuniao_id = ra.reuniao_id
      WHERE ra.id = ata_id AND rp.participante_id = auth.uid()
    )
  );

-- RLS para ausências
ALTER TABLE ausencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gerencia ausencias" ON ausencias
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Colaborador vê proprias ausencias" ON ausencias
  FOR SELECT USING (colaborador_id = auth.uid());

CREATE POLICY "Colaborador solicita ausencia" ON ausencias
  FOR INSERT WITH CHECK (colaborador_id = auth.uid());

CREATE POLICY "Colaborador cancela propria ausencia pendente" ON ausencias
  FOR UPDATE USING (colaborador_id = auth.uid() AND status = 'pendente');

-- Trigger para updated_at
CREATE TRIGGER update_reunioes_updated_at
  BEFORE UPDATE ON reunioes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reuniao_atas_updated_at
  BEFORE UPDATE ON reuniao_atas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ausencias_updated_at
  BEFORE UPDATE ON ausencias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();