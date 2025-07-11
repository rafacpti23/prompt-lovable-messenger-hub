
import { useEffect, useCallback } from "react";
import { useBilling } from "./useBilling";
import { useAuth } from "@/components/auth/AuthProvider";

export function usePaymentVerification() {
  const { verifyPayment } = useBilling();
  const { user } = useAuth();

  const checkPayment = useCallback(async () => {
    if (!user) return;
    
    try {
      await verifyPayment();
    } catch (error) {
      console.error("Erro ao verificar pagamento:", error);
    }
  }, [user, verifyPayment]);

  // Verificar pagamento ao carregar a página
  useEffect(() => {
    if (user) {
      checkPayment();
    }
  }, [user, checkPayment]);

  // Verificar pagamento periodicamente (a cada 30 segundos)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      checkPayment();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, checkPayment]);

  // Verificar pagamento quando a aba volta ao foco
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        checkPayment();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, checkPayment]);

  return { checkPayment };
}
