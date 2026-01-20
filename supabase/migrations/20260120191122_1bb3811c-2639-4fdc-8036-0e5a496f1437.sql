-- Add 'no_show' to etapa_closer enum (before perdido)
ALTER TYPE etapa_closer ADD VALUE IF NOT EXISTS 'no_show' BEFORE 'perdido';

-- Add 'no_show' to etapa_sdr enum (before perdido)  
ALTER TYPE etapa_sdr ADD VALUE IF NOT EXISTS 'no_show' BEFORE 'perdido';