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

  // Evolution API configuration (from localStorage in app, here must use secrets)
  const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL");
  const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY");

  if (!evolutionApiUrl || !evolutionApiKey) {
    return new Response(
      JSON.stringify({ error: "Evolution API URL/KEY não configurados." }),
      { status: 500, headers: corsHeaders }
    );
  }

  // Busca uma campanha ativa (buscaremos sempre uma por execução)
  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("status", "active")
    .limit(1);

  if (campaignsError || !campaigns || campaigns.length === 0) {
    return new Response(
      JSON.stringify({ message: "Nenhuma campanha ativa para disparo." }),
      { status: 200, headers: corsHeaders }
    );
  }

  const campaign = campaigns[0];
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

  const sendBody = {
    instanceName: campaign.instance_id, // Pode ser instance_name, confira na sua estrutura
    number: destinationPhone,
    message: messageRow.message,
  };

  // Envio pela Evolution API
  const evolutionResp = await fetch(`${evolutionApiUrl}/message/sendText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: evolutionApiKey,
    },
    body: JSON.stringify(sendBody),
  });

  const respData = await evolutionResp.json();

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
