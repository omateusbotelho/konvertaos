-- 1. CHECK constraint: cobrancas.valor > 0
ALTER TABLE public.cobrancas
ADD CONSTRAINT cobrancas_valor_positivo CHECK (valor > 0);

-- 2. CHECK constraint: leads.data_perda >= created_at
ALTER TABLE public.leads
ADD CONSTRAINT leads_data_perda_valida CHECK (data_perda IS NULL OR data_perda >= created_at);

-- 3. Adicionar coluna deleted_at para soft delete em clientes
ALTER TABLE public.clientes
ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- 4. Adicionar coluna deleted_at para soft delete em cobrancas
ALTER TABLE public.cobrancas
ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- 5. Criar função para soft delete (impede exclusão física)
CREATE OR REPLACE FUNCTION public.prevent_hard_delete_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Ao invés de deletar, atualiza deleted_at
  EXECUTE format(
    'UPDATE %I.%I SET deleted_at = now() WHERE id = $1',
    TG_TABLE_SCHEMA,
    TG_TABLE_NAME
  ) USING OLD.id;
  
  -- Registra no audit_log
  INSERT INTO public.audit_log (
    acao,
    entidade,
    entidade_id,
    usuario_id,
    dados_anteriores,
    usuario_cargo,
    usuario_setor
  )
  SELECT 
    'soft_delete',
    TG_TABLE_NAME,
    OLD.id,
    auth.uid(),
    to_jsonb(OLD),
    p.cargo::text,
    p.setor::text
  FROM public.profiles p
  WHERE p.id = auth.uid();
  
  -- Retorna NULL para cancelar o DELETE original
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Trigger para impedir DELETE físico em clientes
CREATE TRIGGER trigger_soft_delete_clientes
BEFORE DELETE ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.prevent_hard_delete_soft_delete();

-- 7. Trigger para impedir DELETE físico em cobrancas
CREATE TRIGGER trigger_soft_delete_cobrancas
BEFORE DELETE ON public.cobrancas
FOR EACH ROW
EXECUTE FUNCTION public.prevent_hard_delete_soft_delete();

-- 8. Criar índice para consultas que excluem registros deletados
CREATE INDEX idx_clientes_deleted_at ON public.clientes(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_cobrancas_deleted_at ON public.cobrancas(deleted_at) WHERE deleted_at IS NULL;

-- 9. Atualizar RLS para filtrar registros soft-deleted automaticamente
-- Policy para clientes - atualizar para excluir soft-deleted
DROP POLICY IF EXISTS "Admin vê todos clientes" ON public.clientes;
CREATE POLICY "Admin vê todos clientes" 
ON public.clientes 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Colaborador vê clientes atribuídos" ON public.clientes;
CREATE POLICY "Colaborador vê clientes atribuídos" 
ON public.clientes 
FOR SELECT 
USING (
  deleted_at IS NULL AND
  EXISTS (
    SELECT 1 FROM cliente_servicos
    WHERE cliente_servicos.cliente_id = clientes.id 
    AND cliente_servicos.responsavel_id = auth.uid()
  )
);

-- Policy para cobrancas - atualizar para excluir soft-deleted
DROP POLICY IF EXISTS "Admin e Financeiro gerenciam cobrancas" ON public.cobrancas;
CREATE POLICY "Admin e Financeiro gerenciam cobrancas" 
ON public.cobrancas 
FOR ALL 
USING (is_admin_or_financeiro() AND deleted_at IS NULL);