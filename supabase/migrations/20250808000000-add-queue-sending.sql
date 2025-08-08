-- Habilitar a extensão pg_mq se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pg_mq;

-- Criar a fila de mensagens se ela não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM mq.queue WHERE name = 'message_queue') THEN
    PERFORM mq.create_queue('message_queue');
  END IF;
END $$;

-- Adicionar flag aos planos para habilitar o recurso de envio por fila
ALTER TABLE public.plans
ADD COLUMN IF NOT EXISTS enable_queue_sending BOOLEAN DEFAULT FALSE NOT NULL;

-- Adicionar colunas à tabela de campanhas para o novo método
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS sending_method TEXT DEFAULT 'batch' NOT NULL,
ADD COLUMN IF NOT EXISTS interval_config JSONB;

-- Atualizar planos existentes para habilitar o recurso nos planos premium
UPDATE public.plans
SET enable_queue_sending = TRUE
WHERE name IN ('starter', 'master');

-- Criar a função RPC para iniciar o processamento da campanha
CREATE OR REPLACE FUNCTION start_campaign_processing(campaign_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  campaign_record RECORD;
  plan_record RECORD;
  contact_record RECORD;
  payload JSONB;
BEGIN
  -- Verificar se o usuário que chama a função é o dono da campanha
  SELECT * INTO campaign_record FROM public.campaigns WHERE id = campaign_id_param AND user_id = auth.uid();
  IF NOT FOUND THEN
    RETURN 'Error: Campanha não encontrada ou acesso negado.';
  END IF;

  -- Verificar a assinatura ativa do usuário e o plano
  SELECT p.* INTO plan_record
  FROM public.user_subscriptions us
  JOIN public.plans p ON us.plan_id = p.id
  WHERE us.user_id = auth.uid() AND us.status = 'active'
  ORDER BY us.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 'Error: Nenhuma assinatura ativa encontrada.';
  END IF;

  -- Decidir o método de envio
  IF plan_record.enable_queue_sending AND campaign_record.sending_method = 'queue' THEN
    -- Método de Fila (Queue)
    FOR contact_record IN SELECT id FROM public.contacts WHERE id = ANY(campaign_record.contact_ids)
    LOOP
      payload := jsonb_build_object(
        'campaign_id', campaign_record.id,
        'contact_id', contact_record.id,
        'user_id', campaign_record.user_id,
        'instance_id', campaign_record.instance_id
      );
      PERFORM mq.send('message_queue', payload::text);
    END LOOP;

    UPDATE public.campaigns SET status = 'sending' WHERE id = campaign_id_param;
    RETURN 'Success: Campanha enfileirada para envio com intervalos aleatórios.';
  ELSE
    -- Método de Lote (Batch) - Lógica existente
    FOR contact_record IN SELECT id, phone FROM public.contacts WHERE id = ANY(campaign_record.contact_ids)
    LOOP
      INSERT INTO public.scheduled_messages (campaign_id, contact_id, message, phone, scheduled_for, status, user_id)
      VALUES (campaign_record.id, contact_record.id, campaign_record.message, contact_record.phone, campaign_record.scheduled_for, 'pending', campaign_record.user_id);
    END LOOP;

    UPDATE public.campaigns SET status = 'scheduled' WHERE id = campaign_id_param;
    RETURN 'Success: Campanha agendada para envio em lote.';
  END IF;
END;
$$;

-- Funções auxiliares para a Edge Function interagir com a fila
CREATE OR REPLACE FUNCTION read_from_message_queue(p_count INTEGER)
RETURNS TABLE(msg_id BIGINT, payload JSONB)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT message_id, payload::jsonb
  FROM mq.read('message_queue', 300, p_count); -- 300s de timeout de visibilidade
END;
$$;

CREATE OR REPLACE FUNCTION ack_message(p_msg_id BIGINT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM mq.ack(p_msg_id);
END;
$$;