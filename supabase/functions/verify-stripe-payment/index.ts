
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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("Usuário não autenticado");
    }

    const stripe = new Stripe(Deno.env.get("striper_token") || "", {
      apiVersion: "2023-10-16",
    });

    // Buscar customer no Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ hasActiveSubscription: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;

    // Verificar assinaturas ativas
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return new Response(JSON.stringify({ hasActiveSubscription: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0].price.id;
    const price = await stripe.prices.retrieve(priceId);
    
    // Determinar qual plano baseado no preço
    let planName = "starter";
    if (price.unit_amount && price.unit_amount > 3000) { // Mais de R$ 30
      planName = "master";
    }

    // Buscar plano no banco
    const { data: planData } = await supabaseClient
      .from("plans")
      .select("*")
      .eq("name", planName)
      .single();

    if (!planData) {
      throw new Error("Plano não encontrado");
    }

    // Verificar se já existe assinatura ativa no banco
    const { data: existingSub } = await supabaseClient
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!existingSub) {
      // Cancelar assinaturas antigas
      await supabaseClient
        .from("user_subscriptions")
        .update({ status: "cancelled" })
        .eq("user_id", user.id);

      // Criar nova assinatura
      const expiresAt = new Date(subscription.current_period_end * 1000);
      
      await supabaseClient
        .from("user_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: planData.id,
          credits_remaining: planData.credits,
          total_credits: planData.credits,
          expires_at: expiresAt.toISOString(),
          status: "active"
        });
    }

    return new Response(JSON.stringify({ 
      hasActiveSubscription: true,
      planName: planName,
      expiresAt: new Date(subscription.current_period_end * 1000).toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Erro ao verificar pagamento:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
