-- Função RPC para calcular estatísticas de NPS diretamente no banco de dados
CREATE OR REPLACE FUNCTION public.calculate_nps_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_respostas INT;
  v_total_envios INT;
  v_promotores INT;
  v_neutros INT;
  v_detratores INT;
  v_nps_score INT;
  v_taxa_resposta INT;
BEGIN
  -- Contar total de envios
  SELECT COUNT(*) INTO v_total_envios FROM nps_envios;
  
  -- Contar total de respostas e categorias em uma única query
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE score >= 9),
    COUNT(*) FILTER (WHERE score >= 7 AND score <= 8),
    COUNT(*) FILTER (WHERE score <= 6)
  INTO v_total_respostas, v_promotores, v_neutros, v_detratores
  FROM nps_respostas;
  
  -- Calcular NPS Score
  IF v_total_respostas > 0 THEN
    v_nps_score := ROUND(((v_promotores - v_detratores)::numeric / v_total_respostas) * 100);
  ELSE
    v_nps_score := 0;
  END IF;
  
  -- Calcular taxa de resposta
  IF v_total_envios > 0 THEN
    v_taxa_resposta := ROUND((v_total_respostas::numeric / v_total_envios) * 100);
  ELSE
    v_taxa_resposta := 0;
  END IF;
  
  RETURN jsonb_build_object(
    'nps_score', v_nps_score,
    'total_respostas', v_total_respostas,
    'promotores', v_promotores,
    'neutros', v_neutros,
    'detratores', v_detratores,
    'taxa_resposta', v_taxa_resposta
  );
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.calculate_nps_stats() TO authenticated;

-- Comentário para documentação
COMMENT ON FUNCTION public.calculate_nps_stats() IS 'Calcula estatísticas de NPS (score, total, promotores, neutros, detratores, taxa de resposta) diretamente no banco de dados para melhor performance';