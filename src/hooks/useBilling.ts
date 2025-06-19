
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useUserSubscription } from "./useUserSubscription";

export function useBilling() {
  const { user } = useAuth();
  const { subscription, refreshSubscription } = useUserSubscription();

  const purchasePlan = async (planId: string) => {
    if (!user) return { error: "Usuário não autenticado" };

    try {
      // Criar transação
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          plan_id: planId,
          amount: 0, // Será atualizado com o valor real do plano
          status: "pending"
        })
        .select()
        .single();

      if (transactionError) {
        throw transactionError;
      }

      // Buscar dados do plano
      const { data: planData, error: planError } = await supabase
        .from("plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (planError) {
        throw planError;
      }

      // Atualizar valor da transação
      await supabase
        .from("transactions")
        .update({ amount: planData.price })
        .eq("id", transactionData.id);

      // Por enquanto, vamos simular pagamento aprovado automaticamente
      // Em produção, aqui seria integrado com gateway de pagamento
      await supabase
        .from("transactions")
        .update({ status: "completed" })
        .eq("id", transactionData.id);

      // Cancelar assinatura atual se existir
      if (subscription) {
        await supabase
          .from("user_subscriptions")
          .update({ status: "cancelled" })
          .eq("id", subscription.id);
      }

      // Criar nova assinatura
      const expiresAt = planData.name === "trial" 
        ? new Date(Date.now() + planData.duration_days * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + planData.duration_days * 24 * 60 * 60 * 1000);

      const { error: subscriptionError } = await supabase
        .from("user_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: planId,
          credits_remaining: planData.credits,
          total_credits: planData.credits,
          expires_at: expiresAt.toISOString(),
          status: "active"
        });

      if (subscriptionError) {
        throw subscriptionError;
      }

      await refreshSubscription();
      return { success: true };

    } catch (error: any) {
      console.error("Erro ao processar compra:", error);
      return { error: error.message || "Erro ao processar compra" };
    }
  };

  const hasCredits = () => {
    return subscription && subscription.credits_remaining > 0 && subscription.status === "active";
  };

  const canSendMessage = () => {
    if (!subscription) return false;
    if (subscription.status !== "active") return false;
    if (subscription.credits_remaining <= 0) return false;
    if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) return false;
    return true;
  };

  return {
    subscription,
    purchasePlan,
    hasCredits,
    canSendMessage,
    refreshSubscription
  };
}
