-- Trigger function para registrar mudanças de etapa e responsável nos leads
CREATE OR REPLACE FUNCTION public.on_lead_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_descricao TEXT;
  v_tipo atividade_tipo;
  v_user_id UUID;
BEGIN
  -- Pegar o usuário atual ou usar o responsável como fallback
  v_user_id := COALESCE(auth.uid(), NEW.sdr_responsavel_id, NEW.closer_responsavel_id, OLD.sdr_responsavel_id, OLD.closer_responsavel_id);
  
  -- Se não houver usuário, não fazer nada
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 1. Verificar mudança de etapa SDR
  IF OLD.etapa_sdr IS DISTINCT FROM NEW.etapa_sdr AND NEW.etapa_sdr IS NOT NULL THEN
    v_descricao := 'Lead movido para etapa: ' || NEW.etapa_sdr::text;
    v_tipo := 'anotacao';
    
    INSERT INTO atividades_lead (lead_id, tipo, descricao, realizado_por_id, data_atividade)
    VALUES (NEW.id, v_tipo, v_descricao, v_user_id, NOW());
  END IF;

  -- 2. Verificar mudança de etapa Closer
  IF OLD.etapa_closer IS DISTINCT FROM NEW.etapa_closer AND NEW.etapa_closer IS NOT NULL THEN
    v_descricao := 'Lead movido para etapa: ' || NEW.etapa_closer::text;
    v_tipo := 'anotacao';
    
    INSERT INTO atividades_lead (lead_id, tipo, descricao, realizado_por_id, data_atividade)
    VALUES (NEW.id, v_tipo, v_descricao, v_user_id, NOW());
  END IF;

  -- 3. Verificar mudança de etapa Frios
  IF OLD.etapa_frios IS DISTINCT FROM NEW.etapa_frios AND NEW.etapa_frios IS NOT NULL THEN
    v_descricao := 'Lead movido para etapa: ' || NEW.etapa_frios::text;
    v_tipo := 'anotacao';
    
    INSERT INTO atividades_lead (lead_id, tipo, descricao, realizado_por_id, data_atividade)
    VALUES (NEW.id, v_tipo, v_descricao, v_user_id, NOW());
  END IF;

  -- 4. Verificar mudança de responsável SDR
  IF OLD.sdr_responsavel_id IS DISTINCT FROM NEW.sdr_responsavel_id THEN
    -- Registrar atividade
    IF NEW.sdr_responsavel_id IS NOT NULL THEN
      v_descricao := 'Lead atribuído a novo SDR';
      v_tipo := 'anotacao';
      
      INSERT INTO atividades_lead (lead_id, tipo, descricao, realizado_por_id, data_atividade)
      VALUES (NEW.id, v_tipo, v_descricao, v_user_id, NOW());
      
      -- Criar notificação para o novo responsável SDR
      PERFORM criar_notificacao(
        NEW.sdr_responsavel_id,
        'lead_recebido',
        'Lead atribuído a você',
        NEW.nome || COALESCE(' - ' || NEW.empresa, ''),
        '/comercial/sdr?id=' || NEW.id,
        jsonb_build_object('lead_id', NEW.id, 'lead_nome', NEW.nome)
      );
    ELSE
      v_descricao := 'SDR responsável removido do lead';
      v_tipo := 'anotacao';
      
      INSERT INTO atividades_lead (lead_id, tipo, descricao, realizado_por_id, data_atividade)
      VALUES (NEW.id, v_tipo, v_descricao, v_user_id, NOW());
    END IF;
  END IF;

  -- 5. Verificar mudança de responsável Closer
  IF OLD.closer_responsavel_id IS DISTINCT FROM NEW.closer_responsavel_id THEN
    -- Registrar atividade
    IF NEW.closer_responsavel_id IS NOT NULL THEN
      v_descricao := 'Lead atribuído a novo Closer';
      v_tipo := 'anotacao';
      
      INSERT INTO atividades_lead (lead_id, tipo, descricao, realizado_por_id, data_atividade)
      VALUES (NEW.id, v_tipo, v_descricao, v_user_id, NOW());
      
      -- Criar notificação para o novo responsável Closer
      PERFORM criar_notificacao(
        NEW.closer_responsavel_id,
        'lead_recebido',
        'Lead atribuído a você',
        NEW.nome || COALESCE(' - ' || NEW.empresa, '') || ' (Closer)',
        '/comercial/closer?id=' || NEW.id,
        jsonb_build_object('lead_id', NEW.id, 'lead_nome', NEW.nome)
      );
    ELSE
      v_descricao := 'Closer responsável removido do lead';
      v_tipo := 'anotacao';
      
      INSERT INTO atividades_lead (lead_id, tipo, descricao, realizado_por_id, data_atividade)
      VALUES (NEW.id, v_tipo, v_descricao, v_user_id, NOW());
    END IF;
  END IF;

  -- 6. Verificar mudança de funil
  IF OLD.funil_atual IS DISTINCT FROM NEW.funil_atual AND NEW.funil_atual IS NOT NULL THEN
    v_descricao := 'Lead movido para funil: ' || NEW.funil_atual::text;
    v_tipo := 'anotacao';
    
    INSERT INTO atividades_lead (lead_id, tipo, descricao, realizado_por_id, data_atividade)
    VALUES (NEW.id, v_tipo, v_descricao, v_user_id, NOW());
  END IF;

  RETURN NEW;
END;
$$;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_lead_changes ON public.leads;

-- Criar trigger para mudanças em leads
CREATE TRIGGER trigger_lead_changes
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.on_lead_changes();

-- Remover trigger antigo duplicado (on_lead_atribuido) se existir, pois agora está consolidado
DROP TRIGGER IF EXISTS trigger_lead_atribuido ON public.leads;