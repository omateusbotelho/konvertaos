-- Enums Adicionais
CREATE TYPE status_projeto AS ENUM ('ativo', 'pausado', 'concluido', 'cancelado');
CREATE TYPE prioridade_tarefa AS ENUM ('baixa', 'media', 'alta', 'urgente');
CREATE TYPE tipo_historico_tarefa AS ENUM ('criada', 'etapa_alterada', 'responsavel_alterado', 'prioridade_alterada', 'prazo_alterado', 'concluida', 'reaberta', 'editada');

-- Tabela: etapas_kanban
CREATE TABLE etapas_kanban (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    ordem INTEGER NOT NULL,
    cor TEXT,
    is_default BOOLEAN DEFAULT false,
    is_done BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seeds padrão
INSERT INTO etapas_kanban (nome, ordem, cor, is_default, is_done) VALUES
    ('Backlog', 0, '#64748B', true, false),
    ('A Fazer', 1, '#3B82F6', false, false),
    ('Em Andamento', 2, '#F59E0B', false, false),
    ('Revisão', 3, '#8B5CF6', false, false),
    ('Concluído', 4, '#10B981', false, true);

-- Tabela: projetos
CREATE TABLE projetos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
    cliente_servico_id UUID REFERENCES cliente_servicos(id),
    nome TEXT NOT NULL,
    descricao TEXT,
    responsavel_principal_id UUID REFERENCES profiles(id),
    status status_projeto DEFAULT 'ativo',
    data_inicio TIMESTAMPTZ DEFAULT NOW(),
    data_conclusao TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projetos_cliente ON projetos(cliente_id);
CREATE INDEX idx_projetos_responsavel ON projetos(responsavel_principal_id);
CREATE INDEX idx_projetos_status ON projetos(status);

-- Tabela: tarefas
CREATE TABLE tarefas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE NOT NULL,
    cliente_id UUID REFERENCES clientes(id) NOT NULL,
    etapa_id UUID REFERENCES etapas_kanban(id) NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    responsavel_id UUID REFERENCES profiles(id),
    prioridade prioridade_tarefa DEFAULT 'media',
    data_vencimento TIMESTAMPTZ,
    recorrente BOOLEAN DEFAULT false,
    recorrencia_config JSONB,
    tarefa_pai_id UUID REFERENCES tarefas(id),
    ordem INTEGER DEFAULT 0,
    concluida BOOLEAN DEFAULT false,
    concluida_em TIMESTAMPTZ,
    concluida_por_id UUID REFERENCES profiles(id),
    created_by_id UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tarefas_projeto ON tarefas(projeto_id);
CREATE INDEX idx_tarefas_cliente ON tarefas(cliente_id);
CREATE INDEX idx_tarefas_responsavel ON tarefas(responsavel_id);
CREATE INDEX idx_tarefas_etapa ON tarefas(etapa_id);
CREATE INDEX idx_tarefas_vencimento ON tarefas(data_vencimento);
CREATE INDEX idx_tarefas_pai ON tarefas(tarefa_pai_id);

-- Tabela: tarefa_comentarios
CREATE TABLE tarefa_comentarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tarefa_id UUID REFERENCES tarefas(id) ON DELETE CASCADE NOT NULL,
    autor_id UUID REFERENCES profiles(id) NOT NULL,
    conteudo TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comentarios_tarefa ON tarefa_comentarios(tarefa_id);

-- Tabela: tarefa_comentario_anexos
CREATE TABLE tarefa_comentario_anexos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comentario_id UUID REFERENCES tarefa_comentarios(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    url TEXT NOT NULL,
    tipo TEXT,
    tamanho INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: tarefa_mencoes
CREATE TABLE tarefa_mencoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comentario_id UUID REFERENCES tarefa_comentarios(id) ON DELETE CASCADE NOT NULL,
    usuario_mencionado_id UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: tarefa_anexos
CREATE TABLE tarefa_anexos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tarefa_id UUID REFERENCES tarefas(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    url TEXT NOT NULL,
    tipo TEXT,
    tamanho INTEGER,
    uploaded_por_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: tarefa_historico
CREATE TABLE tarefa_historico (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tarefa_id UUID REFERENCES tarefas(id) ON DELETE CASCADE NOT NULL,
    tipo tipo_historico_tarefa NOT NULL,
    descricao TEXT NOT NULL,
    dados_anteriores JSONB,
    dados_novos JSONB,
    realizado_por_id UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_historico_tarefa ON tarefa_historico(tarefa_id);

-- Tabelas de Templates de Onboarding
CREATE TABLE templates_onboarding (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    servico_id UUID REFERENCES servicos(id) NOT NULL,
    nome TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE template_onboarding_tarefas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES templates_onboarding(id) ON DELETE CASCADE NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    ordem INTEGER NOT NULL,
    prazo_dias INTEGER,
    setor_responsavel TEXT CHECK (setor_responsavel IN ('trafego', 'social_media', 'financeiro')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies para etapas_kanban
ALTER TABLE etapas_kanban ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read etapas_kanban"
ON etapas_kanban FOR SELECT
USING (true);

CREATE POLICY "Admin manages etapas_kanban"
ON etapas_kanban FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para projetos
ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin vê todos projetos"
ON projetos FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin gerencia projetos"
ON projetos FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Colaborador vê projetos que participa"
ON projetos FOR SELECT
USING (
    responsavel_principal_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM tarefas
        WHERE projeto_id = projetos.id
        AND responsavel_id = auth.uid()
    )
);

CREATE POLICY "Responsável atualiza projeto"
ON projetos FOR UPDATE
USING (responsavel_principal_id = auth.uid());

-- RLS Policies para tarefas
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin vê todas tarefas"
ON tarefas FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin gerencia tarefas"
ON tarefas FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Colaborador vê tarefas dos projetos que participa"
ON tarefas FOR SELECT
USING (
    responsavel_id = auth.uid()
    OR created_by_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM projetos p
        WHERE p.id = tarefas.projeto_id
        AND p.responsavel_principal_id = auth.uid()
    )
);

CREATE POLICY "Colaborador cria tarefas"
ON tarefas FOR INSERT
WITH CHECK (
    created_by_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM projetos p
        WHERE p.id = projeto_id
        AND (
            p.responsavel_principal_id = auth.uid()
            OR EXISTS (SELECT 1 FROM tarefas t WHERE t.projeto_id = p.id AND t.responsavel_id = auth.uid())
            OR public.has_role(auth.uid(), 'admin')
        )
    )
);

CREATE POLICY "Colaborador atualiza tarefas atribuídas"
ON tarefas FOR UPDATE
USING (
    responsavel_id = auth.uid()
    OR created_by_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM projetos p
        WHERE p.id = tarefas.projeto_id
        AND p.responsavel_principal_id = auth.uid()
    )
);

-- RLS Policies para tarefa_comentarios
ALTER TABLE tarefa_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gerencia comentários"
ON tarefa_comentarios FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Participante vê comentários da tarefa"
ON tarefa_comentarios FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM tarefas t
        WHERE t.id = tarefa_comentarios.tarefa_id
        AND (t.responsavel_id = auth.uid() OR t.created_by_id = auth.uid())
    )
);

CREATE POLICY "Authenticated insere comentário"
ON tarefa_comentarios FOR INSERT
WITH CHECK (autor_id = auth.uid());

CREATE POLICY "Autor atualiza comentário"
ON tarefa_comentarios FOR UPDATE
USING (autor_id = auth.uid());

CREATE POLICY "Autor deleta comentário"
ON tarefa_comentarios FOR DELETE
USING (autor_id = auth.uid());

-- RLS Policies para tarefa_comentario_anexos
ALTER TABLE tarefa_comentario_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gerencia anexos de comentário"
ON tarefa_comentario_anexos FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Participante vê anexos de comentário"
ON tarefa_comentario_anexos FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM tarefa_comentarios tc
        JOIN tarefas t ON t.id = tc.tarefa_id
        WHERE tc.id = tarefa_comentario_anexos.comentario_id
        AND (t.responsavel_id = auth.uid() OR t.created_by_id = auth.uid())
    )
);

-- RLS Policies para tarefa_mencoes
ALTER TABLE tarefa_mencoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gerencia menções"
ON tarefa_mencoes FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Mencionado vê menção"
ON tarefa_mencoes FOR SELECT
USING (usuario_mencionado_id = auth.uid());

-- RLS Policies para tarefa_anexos
ALTER TABLE tarefa_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gerencia anexos"
ON tarefa_anexos FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Participante vê anexos da tarefa"
ON tarefa_anexos FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM tarefas t
        WHERE t.id = tarefa_anexos.tarefa_id
        AND (t.responsavel_id = auth.uid() OR t.created_by_id = auth.uid())
    )
);

CREATE POLICY "Authenticated insere anexo"
ON tarefa_anexos FOR INSERT
WITH CHECK (uploaded_por_id = auth.uid());

-- RLS Policies para tarefa_historico
ALTER TABLE tarefa_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin vê todo histórico"
ON tarefa_historico FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Participante vê histórico da tarefa"
ON tarefa_historico FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM tarefas t
        WHERE t.id = tarefa_historico.tarefa_id
        AND (t.responsavel_id = auth.uid() OR t.created_by_id = auth.uid())
    )
);

-- RLS Policies para templates_onboarding
ALTER TABLE templates_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gerencia templates"
ON templates_onboarding FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated lê templates"
ON templates_onboarding FOR SELECT
USING (true);

-- RLS Policies para template_onboarding_tarefas
ALTER TABLE template_onboarding_tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gerencia template tarefas"
ON template_onboarding_tarefas FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated lê template tarefas"
ON template_onboarding_tarefas FOR SELECT
USING (true);

-- Triggers para updated_at
CREATE TRIGGER update_projetos_updated_at
    BEFORE UPDATE ON projetos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tarefas_updated_at
    BEFORE UPDATE ON tarefas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tarefa_comentarios_updated_at
    BEFORE UPDATE ON tarefa_comentarios
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Função para registrar histórico ao alterar tarefa
CREATE OR REPLACE FUNCTION public.log_tarefa_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.etapa_id != NEW.etapa_id THEN
        INSERT INTO tarefa_historico (tarefa_id, tipo, descricao, dados_anteriores, dados_novos, realizado_por_id)
        VALUES (NEW.id, 'etapa_alterada', 'Etapa alterada',
            jsonb_build_object('etapa_id', OLD.etapa_id),
            jsonb_build_object('etapa_id', NEW.etapa_id),
            auth.uid());
    END IF;

    IF OLD.responsavel_id IS DISTINCT FROM NEW.responsavel_id THEN
        INSERT INTO tarefa_historico (tarefa_id, tipo, descricao, dados_anteriores, dados_novos, realizado_por_id)
        VALUES (NEW.id, 'responsavel_alterado', 'Responsável alterado',
            jsonb_build_object('responsavel_id', OLD.responsavel_id),
            jsonb_build_object('responsavel_id', NEW.responsavel_id),
            auth.uid());
    END IF;

    IF OLD.prioridade IS DISTINCT FROM NEW.prioridade THEN
        INSERT INTO tarefa_historico (tarefa_id, tipo, descricao, dados_anteriores, dados_novos, realizado_por_id)
        VALUES (NEW.id, 'prioridade_alterada', 'Prioridade alterada',
            jsonb_build_object('prioridade', OLD.prioridade),
            jsonb_build_object('prioridade', NEW.prioridade),
            auth.uid());
    END IF;

    IF OLD.data_vencimento IS DISTINCT FROM NEW.data_vencimento THEN
        INSERT INTO tarefa_historico (tarefa_id, tipo, descricao, dados_anteriores, dados_novos, realizado_por_id)
        VALUES (NEW.id, 'prazo_alterado', 'Prazo alterado',
            jsonb_build_object('data_vencimento', OLD.data_vencimento),
            jsonb_build_object('data_vencimento', NEW.data_vencimento),
            auth.uid());
    END IF;

    IF OLD.concluida = false AND NEW.concluida = true THEN
        NEW.concluida_em = NOW();
        NEW.concluida_por_id = auth.uid();
        INSERT INTO tarefa_historico (tarefa_id, tipo, descricao, realizado_por_id)
        VALUES (NEW.id, 'concluida', 'Tarefa concluída', auth.uid());
    END IF;

    IF OLD.concluida = true AND NEW.concluida = false THEN
        NEW.concluida_em = NULL;
        NEW.concluida_por_id = NULL;
        INSERT INTO tarefa_historico (tarefa_id, tipo, descricao, realizado_por_id)
        VALUES (NEW.id, 'reaberta', 'Tarefa reaberta', auth.uid());
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_tarefa_update
    BEFORE UPDATE ON tarefas
    FOR EACH ROW
    EXECUTE FUNCTION public.log_tarefa_changes();