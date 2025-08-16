
-- Adicionar colunas para suporte ao QStash nos planos
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS enable_qstash_sending boolean NOT NULL DEFAULT false;

-- Adicionar coluna qstash_webhook_url nas campanhas  
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS qstash_webhook_url text;

-- Criar função RPC para iniciar processamento de campanhas
CREATE OR REPLACE FUNCTION public.start_campaign_processing(campaign_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    campaign_record RECORD;
BEGIN
    -- Buscar a campanha
    SELECT * INTO campaign_record 
    FROM campaigns 
    WHERE id = campaign_id_param AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RETURN 'Error: Campanha não encontrada ou sem permissão.';
    END IF;
    
    -- Atualizar status para scheduled
    UPDATE campaigns 
    SET status = 'scheduled'::campaign_status,
        updated_at = now()
    WHERE id = campaign_id_param;
    
    RETURN 'Campanha agendada com sucesso.';
END;
$$;
