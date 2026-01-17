-- Função RPC para buscar follow-ups e última atividade de leads de forma agregada
CREATE OR REPLACE FUNCTION public.get_leads_followups_and_activities(p_lead_ids UUID[])
RETURNS TABLE (
  lead_id UUID,
  proximo_followup_data TIMESTAMPTZ,
  proximo_followup_descricao TEXT,
  ultima_atividade_data TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id AS lead_id,
    f.data_programada AS proximo_followup_data,
    f.descricao AS proximo_followup_descricao,
    a.data_atividade AS ultima_atividade_data
  FROM unnest(p_lead_ids) AS l(id)
  LEFT JOIN LATERAL (
    SELECT fu.data_programada, fu.descricao
    FROM follow_ups fu
    WHERE fu.lead_id = l.id
      AND fu.concluido = false
    ORDER BY fu.data_programada ASC
    LIMIT 1
  ) f ON true
  LEFT JOIN LATERAL (
    SELECT at.data_atividade
    FROM atividades_lead at
    WHERE at.lead_id = l.id
    ORDER BY at.data_atividade DESC
    LIMIT 1
  ) a ON true;
END;
$$;