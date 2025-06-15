
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

  // Busca uma campanha ativa OU agendada (buscaremos sempre uma por execução)
  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("*")
    .in("status", ["active", "scheduled"])
    .limit(1);

  if (campaignsError || !campaigns || campaigns.length === 0) {
    return new Response(
      JSON.stringify({ message: "Nenhuma campanha ativa ou agendada para disparo." }),
      { status: 200, headers: corsHeaders }
    );
  }

  const campaign = campaigns[0];
  
  // Se a campanha está como "scheduled", muda para "active" automaticamente
  if (campaign.status === "scheduled") {
    await supabase
      .from("campaigns")
      .update({ status: "active" })
      .eq("id", campaign.id);
  }

  const pauseSeconds =
    typeof campaign.pause_between_messages === "number"
      ? campaign.pause_between_messages
      : 5;

  // Busca todos os contatos pendentes dessa campanha
  const { data: scheduleRows, error: scheduleError } = await supabase
    .from("scheduled_messages")
    .select("*")
    .eq("campaign_id", campaign.id)
    .eq("status", "pending")
    .order("scheduled_for", { ascending: true })
    .limit(1); // Só envia uma mensagem por execução

  if (scheduleError || !scheduleRows || scheduleRows.length === 0) {
    // Pode marcar a campanha como completed se não houver mais mensagens pendentes
    await supabase
      .from("campaigns")
      .update({ status: "completed" })
      .eq("id", campaign.id);
    return new Response(
      JSON.stringify({
        message: "Não há mensagens pendentes, campanha concluída.",
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  const messageRow = scheduleRows[0];

  // Remove "+" se houver no número do contato
  const destinationPhone = messageRow.phone.replace(/^\+/, "");

  // URL correta da Evolution API com instance_id
  const evolutionUrl = `${evolutionApiUrl}/message/sendText/${campaign.instance_id}`;
  
  const sendBody = {
    number: destinationPhone,
    text: messageRow.message, // Evolution API usa 'text', não 'message'
  };

  console.log("Enviando para Evolution API:", {
    url: evolutionUrl,
    headers: { apikey: evolutionApiKey },
    body: sendBody
  });

  // Envio pela Evolution API
  const evolutionResp = await fetch(evolutionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: evolutionApiKey, // Evolution API usa 'apikey', não 'API Key'
    },
    body: JSON.stringify(sendBody),
  });

  const respData = await evolutionResp.json();
  console.log("Resposta da Evolution API:", { status: evolutionResp.status, data: respData });

  // Atualiza status da mensagem como enviada ou erro, e responde
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
    return new Response(
      JSON.stringify({
        error: "Falha ao enviar mensagem via Evolution API",
        respData,
      }),
      { status: 500, headers: corsHeaders }
    );
  }

  // Espera pelo intervalo desejado (pausa entre mensagens)
  await new Promise((res) => setTimeout(res, pauseSeconds * 1000));

  return new Response(
    JSON.stringify({ success: true, message: "Mensagem enviada" }),
    { status: 200, headers: corsHeaders }
  );
});
