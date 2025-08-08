-- Remove a função antiga se ela existir
DROP FUNCTION IF EXISTS start_campaign_processing(UUID);

-- Cria a nova função que usa pgmq para enfileirar mensagens
CREATE OR REPLACE FUNCTION start_campaign_processing(campaign_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    v_campaign RECORD;
    v_contact_ids UUID[];
    v_contact RECORD;
    v_queue_name TEXT := 'whatsapp_campaigns';
    v_message_json JSONB;
    v_group_name TEXT;
    v_scheduled_for TIMESTAMP;
BEGIN
    -- 1. Obter detalhes da campanha
    SELECT c.*, i.instance_name, c.scheduled_for, c.sending_method, c.interval_config
    INTO v_campaign
    FROM campaigns c
    JOIN instances i ON c.instance_id = i.id
    WHERE c.id = campaign_id_param;

    IF NOT FOUND THEN
        RETURN 'Erro: Campanha não encontrada.';
    END IF;

    -- 2. Obter o nome do grupo a partir dos contatos da campanha
    SELECT c.tags[1] INTO v_group_name
    FROM contacts c
    WHERE c.id = ANY(v_campaign.contact_ids)
    AND c.user_id = (SELECT auth.uid()::uuid)
    LIMIT 1;

    IF v_group_name IS NULL THEN
        RETURN 'Erro: Nenhum contato encontrado na campanha ou grupo não definido.';
    END IF;

    -- 3. Obter IDs dos contatos do grupo
    SELECT array_agg(id) INTO v_contact_ids
    FROM contacts
    WHERE user_id = (SELECT auth.uid()::uuid)
    AND tags @> ARRAY[v_group_name];

    IF v_contact_ids IS NULL OR array_length(v_contact_ids, 1) = 0 THEN
        RETURN 'Erro: Nenhum contato encontrado no grupo da campanha.';
    END IF;

    -- 4. Obter o horário agendado da campanha
    v_scheduled_for := v_campaign.scheduled_for;
    
    -- Se não houver horário agendado, usar o horário atual
    IF v_scheduled_for IS NULL THEN
        v_scheduled_for := NOW();
    END IF;

    -- 5. Inserir cada contato na fila pgmq com o horário agendado
    FOR v_contact IN SELECT id, name, phone FROM contacts WHERE id = ANY(v_contact_ids)
    LOOP
        -- Cria o payload JSON para a mensagem
        v_message_json := jsonb_build_object(
            'campaign_id', v_campaign.id,
            'contact_id', v_contact.id,
            'user_id', (SELECT auth.uid()::uuid),
            'instance_id', v_campaign.instance_id,
            'message', v_campaign.message,
            'phone', v_contact.phone,
            'scheduled_for', v_scheduled_for, -- Inclui o horário agendado
            'sending_method', v_campaign.sending_method,
            'interval_config', v_campaign.interval_config
        );

        -- Envia a mensagem para a fila
        PERFORM pgmq.send(
            queue_name => v_queue_name,
            msg        => v_message_json
        );
    END LOOP;

    -- 6. Atualizar o status da campanha para 'sending'
    UPDATE campaigns SET status = 'sending' WHERE id = campaign_id_param;

    RETURN CONCAT('Fila pgmq criada com sucesso para ', array_length(v_contact_ids, 1), ' mensagens da campanha ', v_campaign.name, '. Agendado para: ', v_scheduled_for);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;