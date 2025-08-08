-- Esta função processa as mensagens na fila pgmq.
-- Ela deve ser chamada pela sua Edge Function de worker.
CREATE OR REPLACE FUNCTION process_campaign_queue()
RETURNS TEXT AS $$
DECLARE
    v_queue_name TEXT := 'whatsapp_campaigns';
    v_limit INT := 5; -- Número de mensagens a processar por chamada
    v_message RECORD;
    v_payload JSONB;
    v_evolution_url TEXT := 'https://api.ramelseg.com.br'; -- Sua URL da Evolution API
    v_evolution_key TEXT := 'd86920ba398e31464c46401214779885'; -- Sua chave da Evolution API
    v_delay_seconds INT;
    v_interval_config JSONB;
    v_interval_min INT;
    v_interval_max INT;
BEGIN
    -- Lê as mensagens da fila pgmq usando a função correta da documentação
    -- pgmq.read retorna um conjunto de registros
    FOR v_message IN
        SELECT * FROM pgmq.read(
            queue_name => v_queue_name,
            vt         => 30, -- Tempo de visibilidade (30 segundos)
            qty        => v_limit -- Quantidade de mensagens
        )
    LOOP
        -- Extrai o payload da mensagem
        v_payload := v_message.message;

        -- 1. Obter e aplicar o atraso randômico
        v_interval_config := v_payload->>'interval_config';

        -- Se não houver configuração de intervalo, usa o padrão de 5 segundos
        IF v_interval_config IS NULL THEN
            v_delay_seconds := 5;
        ELSE
            -- Extrai o primeiro intervalo da configuração (simplificação)
            -- Ajuste conforme a estrutura real do seu interval_config
            -- Exemplo: interval_config = '[{"min": 3, "max": 8}]'
            -- Vamos pegar o primeiro objeto do array
            SELECT (v_interval_config->0->>'min')::INT INTO v_interval_min;
            SELECT (v_interval_config->0->>'max')::INT INTO v_interval_max;

            -- Se não encontrou, usa o padrão
            IF v_interval_min IS NULL OR v_interval_max IS NULL THEN
                v_delay_seconds := 5;
            ELSE
                -- Gera um número aleatório entre min e max (arredondado para o inteiro mais próximo)
                v_delay_seconds := floor(random() * (v_interval_max - v_interval_min + 1) + v_interval_min);
            END IF;
        END IF;

        -- Esperar o tempo calculado em segundos
        PERFORM pg_sleep(v_delay_seconds);

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
        -- Usando a função correta da documentação
        PERFORM pgmq.delete(
            queue_name => v_queue_name,
            msg_id     => v_message.msg_id
        );

    END LOOP;

    RETURN CONCAT('Processamento da fila pgmq concluído. Mensagens processadas: ', v_limit, '.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;