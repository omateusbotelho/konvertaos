-- Permitir que administradores atualizem roles de outros usuários
CREATE POLICY "Admin pode atualizar roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));