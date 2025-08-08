-- Instala a extensão pgmq
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Cria a fila 'whatsapp_campaigns' se ela ainda não existir
-- Esta é a fila que usaremos para as mensagens das campanhas
SELECT pgmq_create('whatsapp_campaigns');