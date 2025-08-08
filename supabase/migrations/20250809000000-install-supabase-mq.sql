-- Instala a extensão supabase_mq. Esta é a única linha necessária para a instalação.
CREATE EXTENSION IF NOT EXISTS "supabase_mq";

-- Cria a tabela de mensagens da fila, se ela ainda não existir.
-- Esta tabela é usada pelo sistema de filas avançadas.
CREATE TABLE IF NOT EXISTS supabase_mq.messages (
    id BIGSERIAL PRIMARY KEY,
    msg_id BIGINT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cria um índice na coluna msg_id para melhorar o desempenho da função de leitura da fila.
CREATE INDEX IF NOT EXISTS idx_supabase_mq_messages_msg_id ON supabase_mq.messages (msg_id);

-- Cria um índice na coluna created_at para garantir que as mensagens sejam processadas na ordem em que foram criadas.
CREATE INDEX IF NOT EXISTS idx_supabase_mq_messages_created_at ON supabase_mq.messages (created_at);

-- Concede permissão à função 'authenticated' (seus usuários logados) para inserir mensagens na fila.
GRANT INSERT ON supabase_mq.messages TO authenticated;

-- Concede permissão à função 'authenticated' para selecionar (ler) mensagens da fila.
GRANT SELECT ON supabase_mq.messages TO authenticated;

-- Concede permissão à função 'authenticated' para atualizar o status das mensagens (usado pelo worker para marcar como processado).
GRANT UPDATE ON supabase_mq.messages TO authenticated;

-- Concede permissão à função 'authenticated' para excluir mensagens da fila (usado pelo worker para remover após o processamento).
GRANT DELETE ON supabase_mq.messages TO authenticated;

-- Concede permissão para usar o esquema 'supabase_mq' e suas funções.
GRANT USAGE ON SCHEMA supabase_mq TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA supabase_mq TO authenticated;