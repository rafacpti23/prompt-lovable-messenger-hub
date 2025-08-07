import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting create-stripe-checkout function");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("No authorization header");
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      console.log("User not found or no email");
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    console.log("User authenticated:", user.email);

    const { planId } = await req.json();
    console.log("Plan ID requested:", planId);

    // Buscar dados do plano
    const { data: planData, error: planError } = await supabaseClient
      .from("plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !planData) {
      console.log("Plan not found:", planError);
      return new Response(JSON.stringify({ error: "Plano não encontrado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    console.log("Plan found:", planData.name);

    // Para plano trial, ativar diretamente
    if (planData.name === "trial") {
      console.log("Processing trial plan");
      
      // Cancelar assinatura atual se existir
      const { data: currentSub } = await supabaseClient
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (currentSub) {
        await supabaseClient
          .from("user_subscriptions")
          .update({ status: "cancelled" })
          .eq("id", currentSub.id);
      }

      // Criar nova assinatura trial
      const expiresAt = new Date(Date.now() + planData.duration_days * 24 * 60 * 60 * 1000);
      
      const { error: insertError } = await supabaseClient
        .from("user_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: planId,
          credits_remaining: planData.credits,
          total_credits: planData.credits,
          expires_at: expiresAt.toISOString(),
          status: "active"
        });

      if (insertError) {
        console.log("Error creating trial subscription:", insertError);
        if (insertError.message.includes("já utilizou o plano trial")) {
          return new Response(JSON.stringify({ error: "Você já utilizou o período de teste gratuito." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 409, // Conflict
          });
        }
        return new Response(JSON.stringify({ error: "Erro ao criar assinatura trial" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      return new Response(JSON.stringify({ success: true, trial: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Para planos pagos, usar links diretos do Stripe
    let stripeUrl = "";
    if (planData.name === "starter") {
      stripeUrl = "https://buy.stripe.com/aFa4gz77B8Uy87o0vi4ow01";
    } else if (planData.name === "master") {
      stripeUrl = "https://buy.stripe.com/dRmeVdfE73AegDU6TG4ow00";
    }

    if (!stripeUrl) {
      console.log("No Stripe URL found for plan:", planData.name);
      return new Response(JSON.stringify({ error: "Link de pagamento não encontrado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    console.log("Returning Stripe URL:", stripeUrl);
    return new Response(JSON.stringify({ url: stripeUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Erro ao criar checkout:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});