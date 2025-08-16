
-- Create the enqueue_campaign_messages RPC function for advanced queue processing
CREATE OR REPLACE FUNCTION public.enqueue_campaign_messages(campaign_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  campaign_record RECORD;
  contact_ids_array UUID[];
  contact_id_val UUID;
  contact_phone TEXT;
  message_payload JSONB;
BEGIN
  -- Get campaign details
  SELECT * INTO campaign_record FROM public.campaigns WHERE id = campaign_id_param FOR UPDATE;

  IF campaign_record IS NULL THEN
    RETURN 'Error: Campaign not found.';
  END IF;

  IF campaign_record.status NOT IN ('draft', 'scheduled') THEN
    RETURN 'Error: Campaign cannot be started. Current status: ' || campaign_record.status;
  END IF;

  contact_ids_array := campaign_record.contact_ids;

  IF array_length(contact_ids_array, 1) IS NULL OR array_length(contact_ids_array, 1) = 0 THEN
    UPDATE public.campaigns SET status = 'completed', updated_at = now() WHERE id = campaign_id_param;
    RETURN 'Info: Campaign has no contacts, marked as completed.';
  END IF;

  -- Create queue if it doesn't exist
  PERFORM pgmq.create_queue('whatsapp_campaigns');

  -- Enqueue messages for each contact
  FOREACH contact_id_val IN ARRAY contact_ids_array
  LOOP
    SELECT phone INTO contact_phone FROM public.contacts WHERE id = contact_id_val;
    
    message_payload := jsonb_build_object(
      'campaign_id', campaign_id_param,
      'contact_id', contact_id_val,
      'phone', contact_phone,
      'message', campaign_record.message,
      'media_url', campaign_record.media_url,
      'user_id', campaign_record.user_id,
      'instance_name', (SELECT instance_name FROM public.instances WHERE id = campaign_record.instance_id),
      'interval_config', campaign_record.interval_config
    );
    
    -- Send to pgmq queue
    PERFORM pgmq.send('whatsapp_campaigns', message_payload);
  END LOOP;

  -- Update campaign status to sending
  UPDATE public.campaigns SET status = 'sending', updated_at = now() WHERE id = campaign_id_param;

  RETURN 'Success: ' || array_length(contact_ids_array, 1) || ' messages enqueued for processing.';
END;
$function$
