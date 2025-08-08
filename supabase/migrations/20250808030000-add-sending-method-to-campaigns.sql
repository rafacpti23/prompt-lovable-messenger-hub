-- Adiciona a coluna sending_method na tabela campaigns para definir o método de envio da campanha
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS sending_method text DEFAULT 'batch';