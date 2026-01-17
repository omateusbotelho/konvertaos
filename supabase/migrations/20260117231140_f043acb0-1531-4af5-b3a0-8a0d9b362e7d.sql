-- Adicionar colunas de cargo e setor na tabela audit_log
ALTER TABLE public.audit_log 
  ADD COLUMN IF NOT EXISTS usuario_cargo text,
  ADD COLUMN IF NOT EXISTS usuario_setor text;

-- Criar índices para facilitar filtragem
CREATE INDEX IF NOT EXISTS idx_audit_log_usuario_cargo ON public.audit_log(usuario_cargo);
CREATE INDEX IF NOT EXISTS idx_audit_log_usuario_setor ON public.audit_log(usuario_setor);

-- Atualizar o trigger de auditoria para capturar cargo e setor
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_cargo TEXT;
  v_setor TEXT;
BEGIN
  v_user_id := auth.uid();
  
  -- Buscar cargo e setor do usuário
  IF v_user_id IS NOT NULL THEN
    SELECT cargo::text, setor::text 
    INTO v_cargo, v_setor
    FROM profiles 
    WHERE id = v_user_id;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (usuario_id, acao, entidade, entidade_id, dados_novos, usuario_cargo, usuario_setor)
    VALUES (v_user_id, 'Criou', TG_TABLE_NAME, NEW.id, to_jsonb(NEW), v_cargo, v_setor);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (usuario_id, acao, entidade, entidade_id, dados_anteriores, dados_novos, usuario_cargo, usuario_setor)
    VALUES (v_user_id, 'Atualizou', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW), v_cargo, v_setor);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (usuario_id, acao, entidade, entidade_id, dados_anteriores, usuario_cargo, usuario_setor)
    VALUES (v_user_id, 'Excluiu', TG_TABLE_NAME, OLD.id, to_jsonb(OLD), v_cargo, v_setor);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Comentário para documentação
COMMENT ON COLUMN public.audit_log.usuario_cargo IS 'Cargo do usuário no momento da ação (snapshot)';
COMMENT ON COLUMN public.audit_log.usuario_setor IS 'Setor do usuário no momento da ação (snapshot)';