-- Criar função RPC otimizada para buscar contagens de tarefas por projeto
CREATE OR REPLACE FUNCTION public.get_projetos_task_counts(p_projeto_ids uuid[])
RETURNS TABLE (
  projeto_id uuid,
  total_tarefas bigint,
  tarefas_concluidas bigint,
  tarefas_atrasadas bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.projeto_id,
    COUNT(*) as total_tarefas,
    COUNT(*) FILTER (WHERE t.concluida = true) as tarefas_concluidas,
    COUNT(*) FILTER (WHERE t.concluida = false AND t.data_vencimento < NOW()) as tarefas_atrasadas
  FROM public.tarefas t
  WHERE t.projeto_id = ANY(p_projeto_ids)
  GROUP BY t.projeto_id
$$;

-- Criar função RPC para buscar estatísticas gerais de projetos em uma única query
CREATE OR REPLACE FUNCTION public.get_projetos_stats()
RETURNS TABLE (
  projetos_ativos bigint,
  tarefas_pendentes bigint,
  tarefas_atrasadas bigint,
  onboardings bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM public.projetos WHERE status = 'ativo') as projetos_ativos,
    (SELECT COUNT(*) FROM public.tarefas WHERE concluida = false) as tarefas_pendentes,
    (SELECT COUNT(*) FROM public.tarefas WHERE concluida = false AND data_vencimento < NOW()) as tarefas_atrasadas,
    (SELECT COUNT(*) FROM public.projetos WHERE status = 'ativo') as onboardings
$$;