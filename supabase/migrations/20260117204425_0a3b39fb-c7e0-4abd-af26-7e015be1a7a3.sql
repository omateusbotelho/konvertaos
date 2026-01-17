-- Função RPC para lidar com signup via convite de forma segura
CREATE OR REPLACE FUNCTION public.handle_invite_signup(
  p_user_id UUID,
  p_cargo cargo_tipo,
  p_setor setor_tipo,
  p_role app_role
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar profile com cargo e setor
  UPDATE public.profiles
  SET 
    cargo = p_cargo,
    setor = p_setor,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Atualizar role se for admin
  IF p_role = 'admin' THEN
    UPDATE public.user_roles
    SET role = 'admin'
    WHERE user_id = p_user_id;
  END IF;
END;
$$;