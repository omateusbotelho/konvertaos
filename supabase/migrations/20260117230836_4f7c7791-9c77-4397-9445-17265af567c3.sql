-- Função RPC com SECURITY DEFINER para processar notificações agendadas
-- Esta função executa com privilégios elevados de forma segura

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
  v_tarefas_vencendo INT := 0;
  v_reunioes_proximas INT := 0;
  v_tarefa RECORD;
  v_reuniao RECORD;
  v_participante RECORD;
  v_horas_restantes INT;
  v_minutos_restantes INT;
  v_notificacao_existente UUID;
BEGIN
  -- 1. Tarefas vencendo em 24 horas
  FOR v_tarefa IN
    SELECT id, titulo, responsavel_id, data_vencimento
    FROM tarefas
    WHERE concluida = false
      AND data_vencimento >= v_now
      AND data_vencimento <= v_em_24_horas
      AND responsavel_id IS NOT NULL
  LOOP
    -- Verificar se já enviou notificação de prazo para esta tarefa nas últimas 24h
    SELECT id INTO v_notificacao_existente
    FROM notificacoes
    WHERE usuario_id = v_tarefa.responsavel_id
      AND tipo = 'tarefa_prazo'
      AND dados->>'tarefa_id' = v_tarefa.id::text
      AND created_at >= v_now - INTERVAL '24 hours'
    LIMIT 1;

    IF v_notificacao_existente IS NULL THEN
      v_horas_restantes := EXTRACT(EPOCH FROM (v_tarefa.data_vencimento - v_now)) / 3600;

      INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, link, dados)
      VALUES (
        v_tarefa.responsavel_id,
        'tarefa_prazo',
        'Tarefa vencendo em breve',
        '"' || v_tarefa.titulo || '" vence em ' || v_horas_restantes || 'h',
        '/tarefas?id=' || v_tarefa.id,
        jsonb_build_object('tarefa_id', v_tarefa.id)
      );

      v_tarefas_vencendo := v_tarefas_vencendo + 1;
    END IF;
  END LOOP;

  -- 2. Reuniões em 1 hora
  FOR v_reuniao IN
    SELECT id, titulo, data_inicio
    FROM reunioes
    WHERE status = 'agendada'
      AND data_inicio >= v_now
      AND data_inicio <= v_em_1_hora
  LOOP
    -- Para cada participante da reunião
    FOR v_participante IN
      SELECT participante_id
      FROM reuniao_participantes
      WHERE reuniao_id = v_reuniao.id
    LOOP
      -- Verificar se já enviou lembrete para esta reunião
      SELECT id INTO v_notificacao_existente
      FROM notificacoes
      WHERE usuario_id = v_participante.participante_id
        AND tipo = 'reuniao_lembrete'
        AND dados->>'reuniao_id' = v_reuniao.id::text
      LIMIT 1;

      IF v_notificacao_existente IS NULL THEN
        v_minutos_restantes := EXTRACT(EPOCH FROM (v_reuniao.data_inicio - v_now)) / 60;

        INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, link, dados)
        VALUES (
          v_participante.participante_id,
          'reuniao_lembrete',
          'Reunião em breve',
          '"' || v_reuniao.titulo || '" começa em ' || v_minutos_restantes || ' minutos',
          '/calendario?reuniao=' || v_reuniao.id,
          jsonb_build_object('reuniao_id', v_reuniao.id)
        );

        v_reunioes_proximas := v_reunioes_proximas + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'tarefas_vencendo', v_tarefas_vencendo,
    'reunioes_proximas', v_reunioes_proximas,
    'processed_at', v_now
  );
END;
$$;

-- Garantir que a função pode ser chamada por usuários autenticados ou anônimos (para cron jobs)
GRANT EXECUTE ON FUNCTION public.process_scheduled_notifications() TO anon;
GRANT EXECUTE ON FUNCTION public.process_scheduled_notifications() TO authenticated;