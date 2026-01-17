-- Criar tabela de logs de erros para debugging de produção
CREATE TABLE public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id),
  tipo TEXT NOT NULL DEFAULT 'unknown',
  mensagem TEXT NOT NULL,
  stack_trace TEXT,
  componente TEXT,
  url TEXT,
  user_agent TEXT,
  dados_extras JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para consultas comuns
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX idx_error_logs_usuario_id ON public.error_logs(usuario_id);
CREATE INDEX idx_error_logs_tipo ON public.error_logs(tipo);

-- Habilitar RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Política para inserção (qualquer usuário autenticado ou anônimo pode inserir logs de erro)
CREATE POLICY "Qualquer um pode inserir logs de erro"
  ON public.error_logs
  FOR INSERT
  WITH CHECK (true);

-- Política para leitura (apenas admin pode ver logs)
CREATE POLICY "Apenas admin pode visualizar logs de erro"
  ON public.error_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Função para limpar logs antigos (mais de 30 dias)
CREATE OR REPLACE FUNCTION public.cleanup_old_error_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.error_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;