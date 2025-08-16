
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 Starting QStash sender function...");
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obter campaign_id do body da requisição
    const { campaign_id } = await req.json();
    
    if (!campaign_id) {
      return new Response(JSON.stringify({ error: 'campaign_id é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("📋 Processando campanha:", campaign_id);

    // Configurações do QStash
    const QSTASH_URL = Deno.env.get('QSTASH_URL') || 'https://qstash.upstash.io';
    const QSTASH_TOKEN = Deno.env.get('QSTASH_TOKEN') || 'eyJVc2VySUQiOiJlOWFjN2E3MC0zMDI5LTRlMDktYjVjZC03OWQyYTgyYmEwNDEiLCJQYXNzd29yZCI6IjIwNDVlZmJmMTYxMDRiMDFiMDJiNTY4NjhhNGYyYzU3In0=';
    
    if (!QSTASH_TOKEN) {
      throw new Error('QStash token não configurado');
    }

    console.log("🔑 QStash URL:", QSTASH_URL);

    // Configurações da Evolution API  
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL') || 'https://api.ramelseg.com.br';
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY') || 'd86920ba398e31464c46401214779885';

    console.log("📱 Evolution API URL:", EVOLUTION_API_URL);

    // Buscar dados da campanha
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('campaigns')
      .select(`
        id, name, message, media_url, interval_config, qstash_webhook_url, user_id, instance_id,
        contact_ids, scheduled_for,
        instances!inner(instance_name)
      `)
      .eq('id', campaign_id)
      .eq('sending_method', 'qstash')
      .single();

    if (campaignError || !campaign) {
      console.error("❌ Erro ao buscar campanha:", campaignError);
      throw new Error(`Campanha não encontrada: ${campaignError?.message}`);
    }

    console.log(`🎯 Processando campanha QStash: ${campaign.name} (ID: ${campaign.id})`);

    // Marcar campanha como "sending"
    await supabaseClient
      .from('campaigns')
      .update({ status: 'sending' })
      .eq('id', campaign.id);

    // Buscar contatos da campanha
    const { data: contacts, error: contactsError } = await supabaseClient
      .from('contacts')
      .select('id, name, phone')
      .in('id', campaign.contact_ids || []);

    if (contactsError || !contacts || contacts.length === 0) {
      console.error(`❌ Erro ao buscar contatos para campanha ${campaign.id}:`, contactsError);
      throw new Error('Nenhum contato encontrado para a campanha');
    }

    console.log(`👥 Encontrados ${contacts.length} contatos para campanha ${campaign.name}`);

    // Processar cada contato com intervalos aleatórios via QStash
    let delayAccumulator = 0;
    const intervals = campaign.interval_config || [{ quantity: 10, min: 5, max: 10 }];
    let totalProcessed = 0;

    // Usar webhook URL da campanha ou uma padrão
    const webhookUrl = campaign.qstash_webhook_url || `${Deno.env.get('SUPABASE_URL')}/functions/v1/qstash-webhook-handler`;
    console.log("🔗 Webhook URL:", webhookUrl);

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      
      // Calcular intervalo aleatório baseado na configuração
      const intervalIndex = Math.floor(i / intervals[0].quantity) % intervals.length;
      const currentInterval = intervals[intervalIndex];
      const randomDelay = Math.random() * (currentInterval.max - currentInterval.min) + currentInterval.min;
      
      delayAccumulator += randomDelay;

      console.log(`⏱️ Agendando mensagem para ${contact.name} (${contact.phone}) com delay de ${delayAccumulator.toFixed(2)}s`);

      // Personalizar mensagem
      const personalizedMessage = campaign.message
        .replace(/{{nome}}/g, contact.name || '')
        .replace(/{{telefone}}/g, contact.phone || '');

      // Preparar payload para o QStash
      const messagePayload = {
        campaign_id: campaign.id,
        contact_id: contact.id,
        user_id: campaign.user_id,
        instance_name: campaign.instances.instance_name,
        phone: contact.phone,
        message: personalizedMessage,
        media_url: campaign.media_url,
        evolution_api_url: EVOLUTION_API_URL,
        evolution_api_key: EVOLUTION_API_KEY,
        scheduled_for: new Date(Date.now() + delayAccumulator * 1000).toISOString()
      };

      // Enviar para QStash com delay
      const qstashHeaders = {
        'Authorization': `Bearer ${QSTASH_TOKEN}`,
        'Content-Type': 'application/json',
        'Upstash-Delay': `${Math.floor(delayAccumulator)}s`, // Delay no QStash
        'Upstash-Retries': '3', // Retry automático
      };

      const qstashEndpoint = `${QSTASH_URL}/v2/publish/${encodeURIComponent(webhookUrl)}`;
      
      try {
        const qstashResponse = await fetch(qstashEndpoint, {
          method: 'POST',
          headers: qstashHeaders,
          body: JSON.stringify(messagePayload)
        });

        const qstashResult = await qstashResponse.json();
        
        if (!qstashResponse.ok) {
          throw new Error(`QStash error: ${qstashResult.error || qstashResponse.statusText}`);
        }

        console.log(`✅ Mensagem enviada para QStash - ID: ${qstashResult.messageId}`);

        // Registrar no log de mensagens
        await supabaseClient.from('messages_log').insert({
          campaign_id: campaign.id,
          contact_id: contact.id,
          user_id: campaign.user_id,
          phone: contact.phone,
          message: personalizedMessage,
          status: 'queued_qstash',
          response: qstashResult,
          scheduled_for: messagePayload.scheduled_for,
          sent_at: null
        });

        totalProcessed++;

      } catch (error: any) {
        console.error(`❌ Erro ao enviar para QStash:`, error.message);
        
        // Registrar erro no log
        await supabaseClient.from('messages_log').insert({
          campaign_id: campaign.id,
          contact_id: contact.id,
          user_id: campaign.user_id,
          phone: contact.phone,
          message: personalizedMessage,
          status: 'failed',
          response: { error: error.message },
          scheduled_for: messagePayload.scheduled_for,
          sent_at: null
        });
      }
    }

    // Marcar campanha como "completed" se todos os contatos foram processados
    await supabaseClient
      .from('campaigns')
      .update({ status: 'completed' })
      .eq('id', campaign.id);

    console.log(`✅ Campanha ${campaign.name} concluída - ${contacts.length} mensagens enviadas para QStash`);
    console.log(`🎉 Processamento QStash concluído. Total: ${totalProcessed} mensagens`);
    
    return new Response(JSON.stringify({ 
      message: `${totalProcessed} mensagens enviadas para QStash com intervalos aleatórios.`,
      campaign_processed: campaign.name,
      total_messages: totalProcessed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Erro fatal no QStash sender:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
