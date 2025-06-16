
import { createClient } from "npm:@supabase/supabase-js";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Configure Supabase client for Edge Functions context
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Evolution API configuration - usando configuração centralizada
  const evolutionApiUrl = "https://api.ramelseg.com.br";
  const evolutionApiKey = "d86920ba398e31464c46401214779885";

  console.log("Evolution API Config:", { evolutionApiUrl, evolutionApiKey });

  // Horário atual em UTC para comparação
  const nowUTC = new Date().toISOString();
  console.log("Horário atual UTC:", nowUTC);
  
  // Converte para horário brasileiro (UTC-3) para logging
  const nowBrazil = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
  console.log("Horário atual Brasil (UTC-3):", nowBrazil);

  // Busca campanhas ativas OU agendadas que já passaram do horário
  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("*")
    .in("status", ["active", "scheduled"])
    .or(`status.eq.active,and(status.eq.scheduled,scheduled_for.lte.${nowUTC})`)
    .limit(1);

  console.log("Campanhas encontradas:", campaigns?.length || 0);
  if (campaigns && campaigns.length > 0) {
    console.log("Primeira campanha:", {
      id: campaigns[0].id,
      status: campaigns[0].status,
      scheduled_for: campaigns[0].scheduled_for,
      name: campaigns[0].name
    });
  }

  if (campaignsError || !campaigns || campaigns.length === 0) {
    return new Response(
      JSON.stringify({ 
        message: "Nenhuma campanha ativa ou agendada para disparo no momento.",
        debug: {
          nowUTC,
          nowBrazil,
          campaignsError
        }
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  const campaign = campaigns[0];
  
  // Se a campanha está como "scheduled", muda para "active" automaticamente
  if (campaign.status === "scheduled") {
    console.log("Ativando campanha agendada:", campaign.id);
    await supabase
      .from("campaigns")
      .update({ status: "active" })
      .eq("id", campaign.id);
  }

  const pauseSeconds =
    typeof campaign.pause_between_messages === "number"
      ? campaign.pause_between_messages
      : 5;

  // Busca mensagens pendentes dessa campanha
  const { data: scheduleRows, error: scheduleError } = await supabase
    .from("scheduled_messages")
    .select(`
      *,
      contacts!inner(phone, name)
    `)
    .eq("campaign_id", campaign.id)
    .eq("status", "pending")
    .order("scheduled_for", { ascending: true })
    .limit(1);

  console.log("Mensagens pendentes encontradas:", scheduleRows?.length || 0);

  if (scheduleError || !scheduleRows || scheduleRows.length === 0) {
    console.log("Nenhuma mensagem pendente, marcando campanha como concluída");
    // Marca a campanha como completed se não houver mais mensagens pendentes
    await supabase
      .from("campaigns")
      .update({ status: "completed" })
      .eq("id", campaign.id);
    return new Response(
      JSON.stringify({
        message: "Não há mensagens pendentes, campanha concluída.",
        debug: {
          campaign_id: campaign.id,
          scheduleError
        }
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  const messageRow = scheduleRows[0];
  const contact = messageRow.contacts;

  // Pega o telefone do contato relacionado
  const destinationPhone = contact.phone.replace(/^\+/, "");

  // URL correta da Evolution API com instance_id
  const evolutionUrl = `${evolutionApiUrl}/message/sendText/${campaign.instance_id}`;
  
  const sendBody = {
    number: destinationPhone,
    text: messageRow.message,
  };

  console.log("Enviando mensagem:", {
    url: evolutionUrl,
    contact_name: contact.name,
    phone: destinationPhone,
    message_preview: messageRow.message.substring(0, 50) + "..."
  });

  // Envio pela Evolution API
  const evolutionResp = await fetch(evolutionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: evolutionApiKey,
    },
    body: JSON.stringify(sendBody),
  });

  const respData = await evolutionResp.json();
  console.log("Resposta da Evolution API:", { 
    status: evolutionResp.status, 
    success: evolutionResp.ok,
    data: respData 
  });

  // Atualiza status da mensagem como enviada ou erro
  const nowISO = new Date().toISOString();

  if (evolutionResp.ok) {
    await supabase
      .from("scheduled_messages")
      .update({
        status: "sent",
        sent_at: nowISO,
      })
      .eq("id", messageRow.id);

    await supabase
      .from("messages_log")
      .insert([
        {
          campaign_id: campaign.id,
          contact_id: messageRow.contact_id,
          phone: destinationPhone,
          message: messageRow.message,
          status: "sent",
          sent_at: nowISO,
          response: respData,
        },
      ]);

    console.log(`Mensagem enviada com sucesso para ${contact.name} (${destinationPhone})`);
  } else {
    await supabase
      .from("scheduled_messages")
      .update({
        status: "failed",
      })
      .eq("id", messageRow.id);

    await supabase
      .from("messages_log")
      .insert([
        {
          campaign_id: campaign.id,
          contact_id: messageRow.contact_id,
          phone: destinationPhone,
          message: messageRow.message,
          status: "failed",
          sent_at: nowISO,
          response: respData,
        },
      ]);
    
    console.log(`Falha ao enviar mensagem para ${contact.name} (${destinationPhone}):`, respData);
    
    return new Response(
      JSON.stringify({
        error: "Falha ao enviar mensagem via Evolution API",
        respData,
        debug: {
          contact_name: contact.name,
          phone: destinationPhone,
          url: evolutionUrl
        }
      }),
      { status: 500, headers: corsHeaders }
    );
  }

  // Espera pelo intervalo desejado (pausa entre mensagens)
  await new Promise((res) => setTimeout(res, pauseSeconds * 1000));

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: "Mensagem enviada", 
      details: {
        contact_name: contact.name,
        phone: destinationPhone,
        campaign: campaign.name
      }
    }),
    { status: 200, headers: corsHeaders }
  );
});
