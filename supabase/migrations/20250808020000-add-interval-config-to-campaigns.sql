-- Adiciona a coluna interval_config na tabela campaigns para armazenar configuração de intervalos aleatórios
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS interval_config jsonb;