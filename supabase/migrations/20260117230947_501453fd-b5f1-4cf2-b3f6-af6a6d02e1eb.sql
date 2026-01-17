-- Otimização da função de notificações: batch queries em vez de loops individuais
CREATE OR REPLACE FUNCTION public.process_scheduled_notifications()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_em_24_horas TIMESTAMP WITH TIME ZONE := v_now + INTERVAL '24 hours';
  v_em_1_hora TIMESTAMP WITH TIME ZONE := v_now + INTERVAL '1 hour';
  v_tarefas_inseridas INT;
  v_reunioes_inseridas INT;
BEGIN
  -- 1. Inserir notificações de tarefas vencendo em 24h (batch insert)
  -- Usando NOT EXISTS para filtrar notificações já enviadas
  WITH tarefas_pendentes AS (
    SELECT 
      t.id,
      t.titulo,
      t.responsavel_id,
      t.data_vencimento,
      ROUND(EXTRACT(EPOCH FROM (t.data_vencimento - v_now)) / 3600)::INT as horas_restantes
    FROM tarefas t
    WHERE t.concluida = false
      AND t.data_vencimento >= v_now
      AND t.data_vencimento <= v_em_24_horas
      AND t.responsavel_id IS NOT NULL
      -- Excluir tarefas que já têm notificação recente
      AND NOT EXISTS (
        SELECT 1 FROM notificacoes n
        WHERE n.usuario_id = t.responsavel_id
          AND n.tipo = 'tarefa_prazo'
          AND n.dados->>'tarefa_id' = t.id::text
          AND n.created_at >= v_now - INTERVAL '24 hours'
      )
  )
  INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, link, dados)
  SELECT 
    tp.responsavel_id,
    'tarefa_prazo'::tipo_notificacao,
    'Tarefa vencendo em breve',
    '"' || tp.titulo || '" vence em ' || tp.horas_restantes || 'h',
    '/tarefas?id=' || tp.id,
    jsonb_build_object('tarefa_id', tp.id)
  FROM tarefas_pendentes tp;
  
  GET DIAGNOSTICS v_tarefas_inseridas = ROW_COUNT;

  -- 2. Inserir notificações de reuniões em 1h (batch insert)
  WITH reunioes_proximas AS (
    SELECT 
      r.id,
      r.titulo,
      r.data_inicio,
      rp.participante_id,
      ROUND(EXTRACT(EPOCH FROM (r.data_inicio - v_now)) / 60)::INT as minutos_restantes
    FROM reunioes r
    INNER JOIN reuniao_participantes rp ON rp.reuniao_id = r.id
    WHERE r.status = 'agendada'
      AND r.data_inicio >= v_now
      AND r.data_inicio <= v_em_1_hora
      -- Excluir participantes que já têm notificação
      AND NOT EXISTS (
        SELECT 1 FROM notificacoes n
        WHERE n.usuario_id = rp.participante_id
          AND n.tipo = 'reuniao_lembrete'
          AND n.dados->>'reuniao_id' = r.id::text
      )
  )
  INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, link, dados)
  SELECT 
    rpr.participante_id,
    'reuniao_lembrete'::tipo_notificacao,
    'Reunião em breve',
    '"' || rpr.titulo || '" começa em ' || rpr.minutos_restantes || ' minutos',
    '/calendario?reuniao=' || rpr.id,
    jsonb_build_object('reuniao_id', rpr.id)
  FROM reunioes_proximas rpr;
  
  GET DIAGNOSTICS v_reunioes_inseridas = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'tarefas_vencendo', v_tarefas_inseridas,
    'reunioes_proximas', v_reunioes_inseridas,
    'processed_at', v_now
  );
END;
$$;