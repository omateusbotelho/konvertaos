-- 1. Criar função helper para verificar se usuário é admin ou financeiro (se não existir)
CREATE OR REPLACE FUNCTION public.is_admin_or_financeiro()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'::app_role
  ) OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.setor = 'financeiro'
  )
$$;

-- 2. Criar função helper para verificar cargo do usuário
CREATE OR REPLACE FUNCTION public.get_user_cargo(_user_id uuid)
RETURNS cargo_tipo
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cargo FROM public.profiles WHERE id = _user_id
$$;

-- 3. Atualizar políticas da tabela profiles para impedir alteração de cargo/setor por usuários comuns

-- Remover política existente de update do usuário
DROP POLICY IF EXISTS "Usuário atualiza próprio profile" ON public.profiles;

-- Criar nova política que impede alteração de cargo e setor
CREATE POLICY "Usuário atualiza próprio profile sem cargo/setor"
ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() AND
  -- Verifica se cargo e setor permanecem iguais (usando subquery para pegar valores antigos)
  cargo IS NOT DISTINCT FROM (SELECT cargo FROM public.profiles WHERE id = auth.uid()) AND
  setor IS NOT DISTINCT FROM (SELECT setor FROM public.profiles WHERE id = auth.uid())
);

-- 4. Revisar políticas da tabela leads para SDR e Closer

-- Remover políticas antigas de SELECT
DROP POLICY IF EXISTS "SDR vê seus leads" ON public.leads;
DROP POLICY IF EXISTS "Closer vê seus leads" ON public.leads;

-- Criar política unificada para SDR: vê leads atribuídos a ele OU leads sem responsável no funil SDR
CREATE POLICY "SDR vê leads atribuídos ou sem responsável"
ON public.leads
FOR SELECT
USING (
  (get_user_cargo(auth.uid()) = 'sdr' AND (
    sdr_responsavel_id = auth.uid() OR 
    (sdr_responsavel_id IS NULL AND funil_atual = 'sdr')
  ))
);

-- Criar política para Closer: vê leads atribuídos a ele OU leads sem closer no funil closer
CREATE POLICY "Closer vê leads atribuídos ou sem responsável"
ON public.leads
FOR SELECT
USING (
  (get_user_cargo(auth.uid()) = 'closer' AND (
    closer_responsavel_id = auth.uid() OR 
    (closer_responsavel_id IS NULL AND funil_atual = 'closer')
  ))
);

-- 5. Garantir que cobrancas só é acessível por admin/financeiro (já existe, mas vamos garantir)
-- As políticas atuais já usam is_admin_or_financeiro(), então estão corretas

-- 6. Garantir que custos_fixos só é acessível por admin/financeiro (já existe)
-- As políticas atuais já usam is_admin_or_financeiro(), então estão corretas

-- 7. Garantir que comissoes permite visualização pelo colaborador mas gestão apenas por admin/financeiro
-- As políticas atuais já estão corretas