-- Instala a extensão pgmq
CREATE EXTENSION pgmq;

-- Cria a fila 'whatsapp_campaigns' usando a função correta da documentação
-- A função é pgmq.create(text)
SELECT pgmq.create('whatsapp_campaigns');