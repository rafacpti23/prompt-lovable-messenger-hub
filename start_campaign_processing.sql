CREATE OR REPLACE FUNCTION public.start_campaign_processing(campaign_id_param uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  campaign_record RECORD;
BEGIN
  -- Buscar campanha
  SELECT * INTO campaign_record FROM public.campaigns WHERE id = campaign_id_param FOR UPDATE;

  IF campaign_record IS NULL THEN
    RETURN 'Error: Campanha não encontrada.';
  END IF;

  -- Verificar se já está em status que permite iniciar
  IF campaign_record.status NOT IN ('draft', 'paused', 'scheduled') THEN
    RETURN 'Info: A campanha não pode ser iniciada. Status atual: ' || campaign_record.status;
  END IF;

  -- Verificar se scheduled_for está definido e é futuro
  IF campaign_record.scheduled_for IS NULL THEN
    RETURN 'Error: Data e hora de agendamento (scheduled_for) não definida.';
  END IF;

  IF campaign_record.scheduled_for <= now() THEN
    RETURN 'Error: Data e hora de agendamento deve ser no futuro.';
  END IF;

  -- Verificar se há contatos
  IF campaign_record.contact_ids IS NULL OR array_length(campaign_record.contact_ids, 1) = 0 THEN
    UPDATE public.campaigns
    SET status = 'completed', updated_at = now()
    WHERE id = campaign_id_param;
    RETURN 'Info: Campanha sem contatos, marcada como concluída.';
  END IF;

  -- Inserir mensagens na tabela scheduled_messages
  INSERT INTO public.scheduled_messages (campaign_id, contact_id, phone, message, media_url, scheduled_for, status)
  SELECT
    campaign_id_param,
    c.id,
    c.phone,
    campaign_record.message,
    campaign_record.media_url,
    campaign_record.scheduled_for,
    'pending'
  FROM public.contacts c
  WHERE c.id = ANY(campaign_record.contact_ids);

  -- Atualizar status da campanha para 'sending'
  UPDATE public.campaigns
  SET status = 'sending', updated_at = now()
  WHERE id = campaign_id_param;

  RETURN 'Success: Campanha ativada e mensagens enfileiradas.';
END;
$$;