-- Fix security definer views by recreating them with SECURITY INVOKER

DROP VIEW IF EXISTS resumo_financeiro_mensal;
DROP VIEW IF EXISTS margem_por_cliente;
DROP VIEW IF EXISTS mrr_atual;

-- Recreate views with SECURITY INVOKER (explicit)
CREATE VIEW resumo_financeiro_mensal 
WITH (security_invoker = on) AS
SELECT 
  date_trunc('month', data) as mes,
  SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as receita,
  SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as despesa,
  SUM(CASE WHEN tipo = 'receita' THEN valor ELSE -valor END) as lucro
FROM lancamentos
GROUP BY date_trunc('month', data)
ORDER BY mes DESC;

CREATE VIEW margem_por_cliente 
WITH (security_invoker = on) AS
SELECT 
  c.id as cliente_id,
  c.razao_social,
  c.nome_fantasia,
  c.fee_mensal as receita_mensal,
  COALESCE(SUM(cv.valor), 0) as custos_variaveis,
  c.fee_mensal - COALESCE(SUM(cv.valor), 0) as margem
FROM clientes c
LEFT JOIN custos_variaveis cv ON cv.cliente_id = c.id 
  AND cv.data_referencia >= date_trunc('month', CURRENT_DATE)
WHERE c.status = 'ativo'
GROUP BY c.id
ORDER BY margem DESC;

CREATE VIEW mrr_atual 
WITH (security_invoker = on) AS
SELECT 
  SUM(fee_mensal) as mrr,
  COUNT(*) as total_clientes
FROM clientes
WHERE status = 'ativo';