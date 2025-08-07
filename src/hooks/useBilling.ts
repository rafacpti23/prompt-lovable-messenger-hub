import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useUserSubscription } from "./useUserSubscription";

export function useBilling() {
  const { user } = useAuth();
  const { subscription, refreshSubscription } = useUserSubscription();

  const purchasePlan = async (planId: string) => {
    if (!user) return { error: "Usuário não autenticado" };

    try {
      console.log("Purchasing plan:", planId);
      
      const { data, error } = await supabase.functions.invoke("create-stripe-checkout", {
        body: { planId }
      });

      if (error) {
        console.error("Error calling create-stripe-checkout:", error);
        throw error;
      }

      console.log("Response from create-stripe-checkout:", data);

      // Se for trial, não precisa redirecionar
      if (data.trial) {
        refreshSubscription();
        return { success: true };
      }

      // Redirecionar para checkout do Stripe
      if (data.url) {
        window.open(data.url, '_blank');
        return { success: true };
      }

      return { error: "Erro ao criar sessão de pagamento" };

    } catch (error: any) {
      console.error("Erro ao processar compra:", error);
      return { error: error.message || "Erro ao processar compra" };
    }
  };

  const verifyPayment = async () => {
    if (!user) return;

    try {
      console.log("Verifying payment for user:", user.email);
      
      const { data, error } = await supabase.functions.invoke("verify-stripe-payment");
      
      if (error) {
        console.error("Error calling verify-stripe-payment:", error);
        throw error;
      }
      
      console.log("Response from verify-stripe-payment:", data);
      
      if (data.hasActiveSubscription) {
        refreshSubscription();
      }
      
      return data;
    } catch (error: any) {
      console.error("Erro ao verificar pagamento:", error);
      return { error: error.message };
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
    verifyPayment,
    hasCredits,
    canSendMessage,
    refreshSubscription
  };
}