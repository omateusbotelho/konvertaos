-- Criar função RPC para calcular resumo financeiro no servidor
CREATE OR REPLACE FUNCTION public.get_financeiro_summary(mes_ref int, ano_ref int)
RETURNS TABLE (
  receita numeric,
  despesa numeric,
  lucro numeric,
  inadimplencia numeric,
  taxa_inadimplencia numeric,
  clientes_inadimplentes bigint,
  total_custos_fixos numeric,
  total_custos_variaveis numeric,
  cobrancas_no_periodo bigint,
  cobrancas_pagas bigint,
  cobrancas_atrasadas bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date date;
  v_end_date date;
  v_receita numeric := 0;
  v_total_custos_fixos numeric := 0;
  v_total_custos_variaveis numeric := 0;
  v_inadimplencia numeric := 0;
  v_clientes_inadimplentes bigint := 0;
  v_total_cobrancas_periodo numeric := 0;
  v_cobrancas_no_periodo bigint := 0;
  v_cobrancas_pagas bigint := 0;
  v_cobrancas_atrasadas bigint := 0;
BEGIN
  -- Calculate date range for the month
  v_start_date := make_date(ano_ref, mes_ref, 1);
  v_end_date := (v_start_date + interval '1 month' - interval '1 day')::date;

  -- Calculate receita (paid invoices in the period by payment date)
  SELECT COALESCE(SUM(valor), 0), COUNT(*)
  INTO v_receita, v_cobrancas_pagas
  FROM cobrancas
  WHERE status = 'pago'
    AND data_pagamento >= v_start_date
    AND data_pagamento <= v_end_date;

  -- Get total custos fixos ativos (monthly recurring)
  SELECT COALESCE(SUM(valor), 0)
  INTO v_total_custos_fixos
  FROM custos_fixos
  WHERE ativo = true;

  -- Get custos variáveis do período
  SELECT COALESCE(SUM(valor), 0)
  INTO v_total_custos_variaveis
  FROM custos_variaveis
  WHERE data_referencia >= v_start_date
    AND data_referencia <= v_end_date;

  -- Calculate inadimplência (overdue/failed invoices in the period)
  SELECT 
    COALESCE(SUM(valor), 0),
    COUNT(DISTINCT cliente_id),
    COUNT(*)
  INTO v_inadimplencia, v_clientes_inadimplentes, v_cobrancas_atrasadas
  FROM cobrancas
  WHERE status IN ('atrasado', 'falhou')
    AND data_vencimento >= v_start_date
    AND data_vencimento <= v_end_date;

  -- Get total cobrancas value in period (for calculating inadimplência rate)
  SELECT COALESCE(SUM(valor), 0), COUNT(*)
  INTO v_total_cobrancas_periodo, v_cobrancas_no_periodo
  FROM cobrancas
  WHERE data_vencimento >= v_start_date
    AND data_vencimento <= v_end_date;

  RETURN QUERY SELECT 
    v_receita,
    v_total_custos_fixos + v_total_custos_variaveis,
    v_receita - (v_total_custos_fixos + v_total_custos_variaveis),
    v_inadimplencia,
    CASE 
      WHEN v_total_cobrancas_periodo > 0 
      THEN ROUND((v_inadimplencia / v_total_cobrancas_periodo) * 100, 2)
      ELSE 0 
    END,
    v_clientes_inadimplentes,
    v_total_custos_fixos,
    v_total_custos_variaveis,
    v_cobrancas_no_periodo,
    v_cobrancas_pagas,
    v_cobrancas_atrasadas;
END;
$$;