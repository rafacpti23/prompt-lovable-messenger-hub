-- Adiciona a coluna enable_queue_sending na tabela plans para controlar envio por fila avançada
ALTER TABLE public.plans
ADD COLUMN IF NOT EXISTS enable_queue_sending boolean DEFAULT false NOT NULL;