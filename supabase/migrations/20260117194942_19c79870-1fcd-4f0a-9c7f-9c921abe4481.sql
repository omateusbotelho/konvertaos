-- Tipo de notificação
CREATE TYPE tipo_notificacao AS ENUM (
  'tarefa_atribuida',
  'tarefa_prazo',
  'tarefa_comentario',
  'tarefa_mencao',
  'lead_recebido',
  'reuniao_agendada',
  'reuniao_lembrete',
  'cliente_ativado',
  'pagamento_confirmado',
  'pagamento_atrasado',
  'sla_alerta',
  'ausencia_solicitada',
  'ausencia_aprovada',
  'nps_detrator',
  'contrato_vencendo',
  'geral'
);

-- Tabela de notificações
CREATE TABLE notificacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tipo tipo_notificacao NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  link TEXT,
  dados JSONB,
  lida BOOLEAN DEFAULT false,
  lida_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_lida ON notificacoes(usuario_id, lida);
CREATE INDEX idx_notificacoes_data ON notificacoes(created_at DESC);

-- RLS
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve proprias notificacoes" ON notificacoes
  FOR SELECT USING (usuario_id = auth.uid());

CREATE POLICY "Usuario atualiza proprias notificacoes" ON notificacoes
  FOR UPDATE USING (usuario_id = auth.uid());

CREATE POLICY "Sistema pode inserir notificacoes" ON notificacoes
  FOR INSERT WITH CHECK (true);

-- Função para criar notificação
CREATE OR REPLACE FUNCTION criar_notificacao(
  p_usuario_id UUID,
  p_tipo tipo_notificacao,
  p_titulo TEXT,
  p_mensagem TEXT,
  p_link TEXT DEFAULT NULL,
  p_dados JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_notificacao_id UUID;
BEGIN
  INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, link, dados)
  VALUES (p_usuario_id, p_tipo, p_titulo, p_mensagem, p_link, p_dados)
  RETURNING id INTO v_notificacao_id;
  
  RETURN v_notificacao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger: Ao atribuir tarefa
CREATE OR REPLACE FUNCTION on_tarefa_atribuida()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.responsavel_id IS NOT NULL AND 
     (OLD IS NULL OR OLD.responsavel_id IS NULL OR OLD.responsavel_id != NEW.responsavel_id) THEN
    PERFORM criar_notificacao(
      NEW.responsavel_id,
      'tarefa_atribuida',
      'Nova tarefa atribuída',
      '"' || NEW.titulo || '" foi atribuída a você',
      '/tarefas?id=' || NEW.id,
      jsonb_build_object('tarefa_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_tarefa_responsavel_changed
  AFTER INSERT OR UPDATE OF responsavel_id ON tarefas
  FOR EACH ROW EXECUTE FUNCTION on_tarefa_atribuida();

-- Trigger: Ao criar menção
CREATE OR REPLACE FUNCTION on_mencao_criada()
RETURNS TRIGGER AS $$
DECLARE
  v_comentario RECORD;
  v_tarefa RECORD;
BEGIN
  SELECT * INTO v_comentario FROM tarefa_comentarios WHERE id = NEW.comentario_id;
  SELECT * INTO v_tarefa FROM tarefas WHERE id = v_comentario.tarefa_id;
  
  PERFORM criar_notificacao(
    NEW.usuario_mencionado_id,
    'tarefa_mencao',
    'Mencionaram você em um comentário',
    'Você foi mencionado em "' || v_tarefa.titulo || '"',
    '/tarefas?id=' || v_tarefa.id,
    jsonb_build_object('tarefa_id', v_tarefa.id, 'comentario_id', NEW.comentario_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_mencao_insert
  AFTER INSERT ON tarefa_mencoes
  FOR EACH ROW EXECUTE FUNCTION on_mencao_criada();

-- Trigger: Lead atribuído ao SDR
CREATE OR REPLACE FUNCTION on_lead_atribuido()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sdr_responsavel_id IS NOT NULL AND 
     (OLD IS NULL OR OLD.sdr_responsavel_id IS NULL) THEN
    PERFORM criar_notificacao(
      NEW.sdr_responsavel_id,
      'lead_recebido',
      'Novo lead recebido',
      NEW.nome || ' - ' || COALESCE(NEW.empresa, 'Sem empresa'),
      '/comercial/sdr?id=' || NEW.id,
      jsonb_build_object('lead_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_lead_sdr_atribuido
  AFTER INSERT OR UPDATE OF sdr_responsavel_id ON leads
  FOR EACH ROW EXECUTE FUNCTION on_lead_atribuido();

-- Trigger: Ausência solicitada (notifica admin)
CREATE OR REPLACE FUNCTION on_ausencia_solicitada()
RETURNS TRIGGER AS $$
DECLARE
  v_admin RECORD;
  v_colaborador RECORD;
BEGIN
  SELECT * INTO v_colaborador FROM profiles WHERE id = NEW.colaborador_id;
  
  FOR v_admin IN SELECT user_id FROM user_roles WHERE role = 'admin' LOOP
    PERFORM criar_notificacao(
      v_admin.user_id,
      'ausencia_solicitada',
      'Nova solicitação de ausência',
      v_colaborador.nome || ' solicitou ' || NEW.tipo || ' de ' || 
      to_char(NEW.data_inicio, 'DD/MM') || ' a ' || to_char(NEW.data_fim, 'DD/MM'),
      '/configuracoes/ausencias',
      jsonb_build_object('ausencia_id', NEW.id, 'colaborador_id', NEW.colaborador_id)
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_ausencia_insert
  AFTER INSERT ON ausencias
  FOR EACH ROW EXECUTE FUNCTION on_ausencia_solicitada();

-- Trigger: Ausência aprovada/recusada (notifica colaborador)
CREATE OR REPLACE FUNCTION on_ausencia_status_changed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'pendente' AND NEW.status IN ('aprovada', 'recusada') THEN
    PERFORM criar_notificacao(
      NEW.colaborador_id,
      'ausencia_aprovada',
      CASE WHEN NEW.status = 'aprovada' THEN 'Ausência aprovada' ELSE 'Ausência recusada' END,
      'Sua solicitação de ' || NEW.tipo || ' foi ' || NEW.status,
      '/ausencias',
      jsonb_build_object('ausencia_id', NEW.id, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_ausencia_status_update
  AFTER UPDATE OF status ON ausencias
  FOR EACH ROW EXECUTE FUNCTION on_ausencia_status_changed();

-- Trigger: Reunião agendada (notifica participantes)
CREATE OR REPLACE FUNCTION on_reuniao_participante_added()
RETURNS TRIGGER AS $$
DECLARE
  v_reuniao RECORD;
BEGIN
  SELECT * INTO v_reuniao FROM reunioes WHERE id = NEW.reuniao_id;
  
  IF NEW.participante_id != v_reuniao.organizador_id THEN
    PERFORM criar_notificacao(
      NEW.participante_id,
      'reuniao_agendada',
      'Nova reunião agendada',
      v_reuniao.titulo || ' em ' || to_char(v_reuniao.data_inicio, 'DD/MM às HH24:MI'),
      '/calendario?reuniao=' || NEW.reuniao_id,
      jsonb_build_object('reuniao_id', NEW.reuniao_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_reuniao_participante_insert
  AFTER INSERT ON reuniao_participantes
  FOR EACH ROW EXECUTE FUNCTION on_reuniao_participante_added();