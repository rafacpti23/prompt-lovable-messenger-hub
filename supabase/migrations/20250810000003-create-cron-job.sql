-- Cria um job cron que executa a cada minuto
SELECT cron.schedule(
  'whatsapp-worker',
  '*/1 * * * *',  -- A cada minuto
  $$SELECT queue_worker()$$
);

-- Habilita o job
SELECT cron.enable('whatsapp-worker');