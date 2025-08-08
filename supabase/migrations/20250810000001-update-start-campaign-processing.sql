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

    -- 2. Obter IDs dos contatos do grupo
    -- Esta é uma simplificação. Você pode precisar ajustar a lógica de busca de contatos.
    SELECT array_agg(id) INTO v_contact_ids
    FROM contacts
    WHERE user_id = (SELECT auth.uid()::uuid)
    AND tags @> ARRAY[v_campaign.group_name]; -- Ajuste se o nome do campo for diferente

    IF v_contact_ids IS NULL OR array_length(v_contact_ids, 1) = 0 THEN
        RETURN 'Erro: Nenhum contato encontrado no grupo da campanha.';
    END IF;

    -- 3. Inserir cada contato na fila pgmq
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
            'scheduled_for', COALESCE(v_campaign.scheduled_for, NOW()),
            'sending_method', v_campaign.sending_method,
            'interval_config', v_campaign.interval_config
        );

        -- Envia a mensagem para a fila usando a função correta da documentação
        PERFORM pgmq.send(
            queue_name => v_queue_name,
            msg        => v_message_json
        );
    END LOOP;

    -- 4. Atualizar o status da campanha para 'sending'
    UPDATE campaigns SET status = 'sending' WHERE id = campaign_id_param;

    RETURN CONCAT('Fila pgmq criada com sucesso para ', array_length(v_contact_ids, 1), ' mensagens da campanha ', v_campaign.name, '.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;