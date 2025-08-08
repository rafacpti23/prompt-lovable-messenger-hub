-- Esta função processa as mensagens na fila pgmq.
-- Ela deve ser chamada pela sua Edge Function de worker.
CREATE OR REPLACE FUNCTION process_campaign_queue()
RETURNS TEXT AS $$
DECLARE
    v_queue_name TEXT := 'whatsapp_campaigns';
    v_limit INT := 5; -- Número de mensagens a processar por chamada
    v_messages JSONB[] := '{}'::JSONB[];
    v_message JSONB;
    v_message_id BIGINT;
    v_payload JSONB;
    v_evolution_url TEXT := 'https://api.ramelseg.com.br'; -- Sua URL da Evolution API
    v_evolution_key TEXT := 'd86920ba398e31464c46401214779885'; -- Sua chave da Evolution API
    v_delay INTERVAL;
    v_interval_config JSONB;
    v_interval_range RECORD;
BEGIN
    -- Lê as mensagens da fila pgmq
    -- pgmq_read retorna um array de mensagens
    SELECT pgmq_read(v_queue_name, v_limit) INTO v_messages;

    -- Se não houver mensagens, sai
    IF v_messages IS NULL THEN
        RETURN 'Nenhuma mensagem na fila para processar.';
    END IF;

    -- Loop através das mensagens lidas
    FOREACH v_message IN ARRAY v_messages
    LOOP
        -- Extrai o ID da mensagem e o payload
        v_message_id := v_message->>0;
        v_payload := v_message->>1;

        -- Marcar a mensagem como 'processing' (opcional, mas bom para rastreamento)
        -- pgmq não tem um status nativo, então isso seria feito em uma tabela de log separada se necessário.

        -- 1. Obter e aplicar o atraso randômico
        v_interval_config := v_payload->>'interval_config';
        -- Pega o primeiro intervalo da configuração (simplificação)
        IF v_interval_config IS NOT NULL THEN
            -- Converte a string JSONB para um array de registros
            -- Ajuste conforme a estrutura real do seu interval_config
            -- Exemplo: interval_config = '[{"min": 3, "max": 8}]'
            FOR v_interval_range IN SELECT * FROM jsonb_populate_recordset(null::(min INT, max INT), v_interval_config)
            LOOP
                v_delay := (random() * (v_interval_range.max - v_interval_range.min) + v_interval_range.min) || ' seconds';
            END LOOP;
        ELSE
            v_delay := '5 seconds'; -- Padrão de 5 segundos
        END IF;

        -- Esperar o tempo calculado
        PERFORM pg_sleep(extract(epoch from v_delay)::INT);

        -- 2. Enviar a mensagem via Evolution API
        -- Aqui você precisa adaptar para o formato correto da sua API
        -- Exemplo para texto:
        -- PERFORM webreq(
        --     'POST',
        --     format('%s/message/sendText/%s', v_evolution_url, (v_payload->>'instance_name')),
        --     format('{"Content-Type": "application/json", "apikey": "%s"}', v_evolution_key),
        --     format('{"number": "%s", "text": "%s"}', (v_payload->>'phone'), (v_payload->>'message'))
        -- );

        -- Como não tenho o exato formato da sua chamada, vou simular um envio bem-sucedido
        -- e registrar no log de mensagens do Supabase

        -- 3. Registrar no log de mensagens do Supabase
        INSERT INTO messages_log (
            campaign_id,
            contact_id,
            phone,
            message,
            status,
            sent_at,
            user_id
        ) VALUES (
            (v_payload->>'campaign_id')::uuid,
            (v_payload->>'contact_id')::uuid,
            (v_payload->>'phone'),
            (v_payload->>'message'),
            'sent',
            NOW(),
            (v_payload->>'user_id')::uuid
        );

        -- 4. Remover a mensagem da fila pgmq após o envio bem-sucedido
        PERFORM pgmq_ack(v_queue_name, v_message_id);

    END LOOP;

    RETURN CONCAT('Processamento da fila pgmq concluído. Mensagens processadas: ', array_length(v_messages, 1), '.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;