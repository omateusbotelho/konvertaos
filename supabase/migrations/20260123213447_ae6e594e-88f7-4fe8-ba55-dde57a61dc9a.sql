-- Adiciona política para permitir que todos os usuários autenticados vejam os profiles ativos
-- Necessário para funcionalidades como selecionar Closers, responsáveis, etc.
CREATE POLICY "Usuários autenticados veem profiles ativos"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND ativo = true
);