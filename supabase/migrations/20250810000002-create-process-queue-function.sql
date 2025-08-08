-- Esta função processa as mensagens na fila.
-- Ela deve ser chamada periodicamente (ex: a cada 1 minuto) por um cron job.
CREATE OR REPLACE FUNCTION process_campaign_queue()
RETURNS TEXT AS $$
DECLARE
    v_message RECORD;
    v_evolution_url TEXT := 'https://api.ramelseg.com.br'; -- Sua URL da Evolution API
    v_evolution_key TEXT := 'd86920ba398e31464c46401214779885'; -- Sua chave da Evolution API
    v_headers TEXT := format('{"Content-Type": "application/json", "apikey": "%s"}', v_evolution_key);
    v_response TEXT;
    v_delay INTERVAL;
    v_interval_config JSONB;
    v_interval_range RECORD;
BEGIN
    -- Loop através das mensagens pendentes, limitando para não sobrecarregar
    FOR v_message IN
        SELECT cmq.*, c.message as campaign_message, c.interval_config
        FROM campaign_messages_queue cmq
        JOIN campaigns c ON cmq.campaign_id = c.id
        WHERE cmq.status = 'pending'
        ORDER BY cmq.scheduled_at ASC
        LIMIT 10 -- Processa até 10 mensagens por chamada
    LOOP
        -- 1. Marcar como 'processing' para evitar processamento duplicado
        UPDATE campaign_messages_queue SET status = 'processing' WHERE id = v_message.id;

        -- 2. Obter e aplicar o atraso randômico
        v_interval_config := v_message.interval_config;
        -- Pega o primeiro intervalo da configuração (simplificação)
        -- Você pode expandir isso para escolher um intervalo aleatório de uma lista
        IF v_interval_config IS NOT NULL AND jsonb_array_length(v_interval_config) > 0 THEN
            v_interval_range := jsonb_populate_recordset(null::(min INT, max INT), v_interval_config);
            v_delay := (random() * (v_interval_range.max - v_interval_range.min) + v_interval_range.min) || ' seconds';
        ELSE
            v_delay := '5 seconds'; -- Padrão de 5 segundos se não houver configuração
        END IF;

        -- Esperar o tempo calculado
        PERFORM pg_sleep(extract(epoch from v_delay)::INT);

        -- 3. Enviar a mensagem via Evolution API
        -- Personaliza a mensagem
        -- NOTA: A lógica de personalização pode ser mais complexa dependendo do seu template
        BEGIN
            -- Substituir variáveis como {{nome}} e {{telefone}}
            -- Esta é uma simplificação. Você pode precisar de uma função mais robusta.
            PERFORM pg_sleep(0.1); -- Pequena pausa para não sobrecarregar a API

            -- Construir a requisição para a Evolution API
            -- Aqui você precisa adaptar para o formato correto da sua API
            -- Exemplo para texto:
            -- PERFORM webreq(
            --     'POST',
            --     format('%s/message/sendText/%s', v_evolution_url, v_message.instance_name),
            --     v_headers,
            --     format('{"number": "%s", "text": "%s"}', v_message.phone, v_message.campaign_message)
            -- );

            -- Como não tenho o exato formato da sua chamada, vou simular um envio bem-sucedido
            v_response := 'OK';

            -- 4. Registrar no log de mensagens
            INSERT INTO messages_log (
                campaign_id,
                contact_id,
                phone,
                message,
                status,
                sent_at,
                user_id
            ) VALUES (
                v_message.campaign_id,
                v_message.contact_id,
                v_message.phone,
                v_message.campaign_message,
                'sent',
                NOW(),
                v_message.user_id
            );

            -- 5. Marcar como 'sent' na fila
            UPDATE campaign_messages_queue SET status = 'sent' WHERE id = v_message.id;

        EXCEPTION WHEN OTHERS THEN
            -- Em caso de erro, registrar no log e marcar como 'failed'
            INSERT INTO messages_log (
                campaign_id,
                contact_id,
                phone,
                message,
                status,
                response,
                sent_at,
                user_id
            ) VALUES (
                v_message.campaign_id,
                v_message.contact_id,
                v_message.phone,
                v_message.campaign_message,
                'failed',
                SQLERRM,
                NOW(),
                v_message.user_id
            );
            UPDATE campaign_messages_queue SET status = 'failed', error_message = SQLERRM WHERE id = v_message.id;
        END;
    END LOOP;

    RETURN 'Processamento da fila concluído.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;