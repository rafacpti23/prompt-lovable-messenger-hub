-- Instala a extensão pgmq
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Cria a fila 'whatsapp_campaigns' se ela ainda não existir
-- A função correta é pgmq.create_queue(text)
SELECT pgmq.create_queue('whatsapp_campaigns');