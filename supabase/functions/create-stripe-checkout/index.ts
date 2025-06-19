
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
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("Usuário não autenticado");
    }

    const { planId } = await req.json();

    // Buscar dados do plano
    const { data: planData, error: planError } = await supabaseClient
      .from("plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !planData) {
      throw new Error("Plano não encontrado");
    }

    // Para plano trial, ativar diretamente
    if (planData.name === "trial") {
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
      
      await supabaseClient
        .from("user_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: planId,
          credits_remaining: planData.credits,
          total_credits: planData.credits,
          expires_at: expiresAt.toISOString(),
          status: "active"
        });

      return new Response(JSON.stringify({ success: true, trial: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Para planos pagos, usar Stripe
    const stripe = new Stripe(Deno.env.get("striper_token") || "", {
      apiVersion: "2023-10-16",
    });

    // Verificar se já existe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
          plan_id: planId
        }
      });
      customerId = customer.id;
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `Plano ${planData.name === "starter" ? "Starter" : "Master"}`,
              description: `${planData.credits} mensagens/mês`,
            },
            unit_amount: Math.round(planData.price * 100), // Converter para centavos
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/billing?success=true`,
      cancel_url: `${req.headers.get("origin")}/billing?canceled=true`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
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
