-- =====================================================
-- ÍNDICES DE BUSCA PARA OTIMIZAÇÃO DE CONSULTAS
-- =====================================================

-- Índices para tabela clientes
CREATE INDEX IF NOT EXISTS idx_clientes_razao_social ON public.clientes USING btree (razao_social);
CREATE INDEX IF NOT EXISTS idx_clientes_nome_fantasia ON public.clientes USING btree (nome_fantasia);
CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON public.clientes USING btree (cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON public.clientes USING btree (cpf);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes USING btree (email);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON public.clientes USING btree (status);

-- Índices GIN para busca de texto em clientes
CREATE INDEX IF NOT EXISTS idx_clientes_razao_social_gin ON public.clientes USING gin (to_tsvector('portuguese', razao_social));
CREATE INDEX IF NOT EXISTS idx_clientes_nome_fantasia_gin ON public.clientes USING gin (to_tsvector('portuguese', COALESCE(nome_fantasia, '')));

-- Índices para tabela leads
CREATE INDEX IF NOT EXISTS idx_leads_nome ON public.leads USING btree (nome);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads USING btree (email);
CREATE INDEX IF NOT EXISTS idx_leads_empresa ON public.leads USING btree (empresa);
CREATE INDEX IF NOT EXISTS idx_leads_telefone ON public.leads USING btree (telefone);
CREATE INDEX IF NOT EXISTS idx_leads_funil_atual ON public.leads USING btree (funil_atual);
CREATE INDEX IF NOT EXISTS idx_leads_etapa_sdr ON public.leads USING btree (etapa_sdr);
CREATE INDEX IF NOT EXISTS idx_leads_etapa_closer ON public.leads USING btree (etapa_closer);
CREATE INDEX IF NOT EXISTS idx_leads_sdr_responsavel ON public.leads USING btree (sdr_responsavel_id);
CREATE INDEX IF NOT EXISTS idx_leads_closer_responsavel ON public.leads USING btree (closer_responsavel_id);

-- Índices GIN para busca de texto em leads
CREATE INDEX IF NOT EXISTS idx_leads_nome_gin ON public.leads USING gin (to_tsvector('portuguese', nome));
CREATE INDEX IF NOT EXISTS idx_leads_empresa_gin ON public.leads USING gin (to_tsvector('portuguese', COALESCE(empresa, '')));

-- Índices adicionais para tabelas frequentemente consultadas
CREATE INDEX IF NOT EXISTS idx_tarefas_responsavel ON public.tarefas USING btree (responsavel_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_projeto ON public.tarefas USING btree (projeto_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_etapa ON public.tarefas USING btree (etapa_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_concluida ON public.tarefas USING btree (concluida);
CREATE INDEX IF NOT EXISTS idx_tarefas_data_vencimento ON public.tarefas USING btree (data_vencimento);

CREATE INDEX IF NOT EXISTS idx_projetos_cliente ON public.projetos USING btree (cliente_id);
CREATE INDEX IF NOT EXISTS idx_projetos_responsavel ON public.projetos USING btree (responsavel_principal_id);
CREATE INDEX IF NOT EXISTS idx_projetos_status ON public.projetos USING btree (status);

-- =====================================================
-- FUNÇÃO RPC PARA BUSCA GLOBAL FULL TEXT SEARCH
-- =====================================================

CREATE OR REPLACE FUNCTION public.busca_global(p_termo text, p_limite integer DEFAULT 20)
RETURNS TABLE (
  tipo text,
  id uuid,
  titulo text,
  subtitulo text,
  link text,
  relevancia real
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tsquery tsquery;
  v_user_id uuid;
  v_is_admin boolean;
  v_user_cargo cargo_tipo;
BEGIN
  -- Preparar a query de busca
  v_tsquery := plainto_tsquery('portuguese', p_termo);
  v_user_id := auth.uid();
  v_is_admin := has_role(v_user_id, 'admin');
  v_user_cargo := get_user_cargo(v_user_id);
  
  RETURN QUERY
  -- Buscar em Clientes
  SELECT 
    'cliente'::text AS tipo,
    c.id,
    c.razao_social AS titulo,
    COALESCE(c.nome_fantasia, c.email) AS subtitulo,
    '/clientes/' || c.id AS link,
    ts_rank(
      to_tsvector('portuguese', c.razao_social || ' ' || COALESCE(c.nome_fantasia, '') || ' ' || COALESCE(c.cnpj, '') || ' ' || c.email),
      v_tsquery
    ) AS relevancia
  FROM clientes c
  WHERE (
    v_is_admin 
    OR EXISTS (
      SELECT 1 FROM cliente_servicos cs 
      WHERE cs.cliente_id = c.id AND cs.responsavel_id = v_user_id
    )
  )
  AND (
    to_tsvector('portuguese', c.razao_social || ' ' || COALESCE(c.nome_fantasia, '') || ' ' || COALESCE(c.cnpj, '') || ' ' || c.email) @@ v_tsquery
    OR c.razao_social ILIKE '%' || p_termo || '%'
    OR c.nome_fantasia ILIKE '%' || p_termo || '%'
    OR c.cnpj ILIKE '%' || p_termo || '%'
    OR c.email ILIKE '%' || p_termo || '%'
  )
  
  UNION ALL
  
  -- Buscar em Leads
  SELECT 
    'lead'::text AS tipo,
    l.id,
    l.nome AS titulo,
    COALESCE(l.empresa, l.email, l.telefone) AS subtitulo,
    CASE 
      WHEN l.funil_atual = 'sdr' THEN '/comercial/sdr?id=' || l.id
      WHEN l.funil_atual = 'closer' THEN '/comercial/closer?id=' || l.id
      ELSE '/comercial/frios?id=' || l.id
    END AS link,
    ts_rank(
      to_tsvector('portuguese', l.nome || ' ' || COALESCE(l.empresa, '') || ' ' || COALESCE(l.email, '')),
      v_tsquery
    ) AS relevancia
  FROM leads l
  WHERE (
    v_is_admin
    OR (v_user_cargo = 'sdr' AND (l.sdr_responsavel_id = v_user_id OR (l.sdr_responsavel_id IS NULL AND l.funil_atual = 'sdr')))
    OR (v_user_cargo = 'closer' AND (l.closer_responsavel_id = v_user_id OR (l.closer_responsavel_id IS NULL AND l.funil_atual = 'closer')))
  )
  AND (
    to_tsvector('portuguese', l.nome || ' ' || COALESCE(l.empresa, '') || ' ' || COALESCE(l.email, '')) @@ v_tsquery
    OR l.nome ILIKE '%' || p_termo || '%'
    OR l.empresa ILIKE '%' || p_termo || '%'
    OR l.email ILIKE '%' || p_termo || '%'
    OR l.telefone ILIKE '%' || p_termo || '%'
  )
  
  UNION ALL
  
  -- Buscar em Projetos
  SELECT 
    'projeto'::text AS tipo,
    p.id,
    p.nome AS titulo,
    COALESCE(p.descricao, '') AS subtitulo,
    '/projetos/' || p.id AS link,
    ts_rank(
      to_tsvector('portuguese', p.nome || ' ' || COALESCE(p.descricao, '')),
      v_tsquery
    ) AS relevancia
  FROM projetos p
  WHERE (
    v_is_admin
    OR p.responsavel_principal_id = v_user_id
    OR EXISTS (SELECT 1 FROM tarefas t WHERE t.projeto_id = p.id AND t.responsavel_id = v_user_id)
  )
  AND (
    to_tsvector('portuguese', p.nome || ' ' || COALESCE(p.descricao, '')) @@ v_tsquery
    OR p.nome ILIKE '%' || p_termo || '%'
    OR p.descricao ILIKE '%' || p_termo || '%'
  )
  
  UNION ALL
  
  -- Buscar em Tarefas
  SELECT 
    'tarefa'::text AS tipo,
    t.id,
    t.titulo AS titulo,
    COALESCE(t.descricao, '') AS subtitulo,
    '/tarefas?id=' || t.id AS link,
    ts_rank(
      to_tsvector('portuguese', t.titulo || ' ' || COALESCE(t.descricao, '')),
      v_tsquery
    ) AS relevancia
  FROM tarefas t
  WHERE (
    v_is_admin
    OR t.responsavel_id = v_user_id
    OR t.created_by_id = v_user_id
  )
  AND (
    to_tsvector('portuguese', t.titulo || ' ' || COALESCE(t.descricao, '')) @@ v_tsquery
    OR t.titulo ILIKE '%' || p_termo || '%'
    OR t.descricao ILIKE '%' || p_termo || '%'
  )
  
  ORDER BY relevancia DESC
  LIMIT p_limite;
END;
$$;