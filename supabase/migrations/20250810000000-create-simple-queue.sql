-- Cria a tabela de fila para mensagens de campanha
CREATE TABLE IF NOT EXISTS campaign_messages_queue (
    id BIGSERIAL PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    phone TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cria índices para melhorar o desempenho da leitura da fila
CREATE INDEX IF NOT EXISTS idx_campaign_messages_queue_status_scheduled ON campaign_messages_queue (status, scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_campaign_messages_queue_campaign_id ON campaign_messages_queue (campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_queue_user_id ON campaign_messages_queue (user_id);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Gatilho para usar a função de atualização de timestamp
CREATE TRIGGER update_campaign_messages_queue_updated_at
    BEFORE UPDATE ON campaign_messages_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Concede permissões para a função 'authenticated' (seus usuários)
-- E para a função 'anon' (se necessário para funções públicas)
GRANT INSERT, SELECT, UPDATE, DELETE ON campaign_messages_queue TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;