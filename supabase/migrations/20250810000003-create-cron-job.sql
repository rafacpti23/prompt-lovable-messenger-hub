-- Cria um job cron que executa a cada minuto
-- A sintaxe correta é: SELECT cron.schedule('job-name', 'cron-expression', 'command')
SELECT cron.schedule(
  'whatsapp-worker',
  '*/1 * * * *',  -- A cada minuto
  $$SELECT queue_worker()$$
);

-- Não é necessário usar cron.enable() com a sintaxe acima
-- O job será criado e habilitado automaticamente