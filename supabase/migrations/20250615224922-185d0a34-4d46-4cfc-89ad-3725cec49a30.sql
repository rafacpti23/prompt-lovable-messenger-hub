
-- Primeiro, vamos popular as campanhas existentes com todos os contatos do usuário
DO $$
DECLARE
    campaign_record RECORD;
    user_contacts UUID[];
BEGIN
    -- Para cada campanha que tem contact_ids vazio
    FOR campaign_record IN 
        SELECT id, user_id FROM campaigns 
        WHERE contact_ids = '{}' OR contact_ids IS NULL
    LOOP
        -- Busca todos os contatos do usuário da campanha
        SELECT ARRAY_AGG(id) INTO user_contacts
        FROM contacts 
        WHERE user_id = campaign_record.user_id;
        
        -- Se encontrou contatos, atualiza a campanha
        IF user_contacts IS NOT NULL AND array_length(user_contacts, 1) > 0 THEN
            UPDATE campaigns 
            SET contact_ids = user_contacts 
            WHERE id = campaign_record.id;
        END IF;
    END LOOP;
END $$;

-- Agora vamos popular a tabela scheduled_messages para campanhas que ainda não têm
INSERT INTO scheduled_messages (campaign_id, contact_id, phone, message, scheduled_for)
SELECT 
    c.id as campaign_id,
    contacts.id as contact_id,
    contacts.phone,
    c.message,
    COALESCE(c.scheduled_for, NOW()) as scheduled_for
FROM campaigns c
CROSS JOIN UNNEST(c.contact_ids) AS contact_id_unnested
JOIN contacts ON contacts.id = contact_id_unnested
WHERE NOT EXISTS (
    SELECT 1 FROM scheduled_messages sm 
    WHERE sm.campaign_id = c.id AND sm.contact_id = contacts.id
)
AND c.contact_ids != '{}';
