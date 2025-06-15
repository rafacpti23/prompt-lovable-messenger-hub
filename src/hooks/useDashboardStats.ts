
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export interface DashboardStats {
  sentMessages: number;
  activeCampaigns: number;
  totalCampaigns: number;
  totalContacts: number;
  totalInstances: number;
}

export function useDashboardStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    sentMessages: 0,
    activeCampaigns: 0,
    totalCampaigns: 0,
    totalContacts: 0,
    totalInstances: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      if (!user) {
        setLoading(false);
        return;
      }

      // Mensagens enviadas (messages_log)
      const [{ count: sentMessages = 0 } = {}] = await Promise.all([
        supabase
          .from("messages_log")
          .select("*", { count: "exact", head: true })
          .eq("status", "sent")
          .eq("user_id", user.id), // só se messages_log tiver user_id. Caso não tenha, remova essa linha.
      ]).then(
        ([msgResult]) => [msgResult]
      );

      // Campanhas
      const { count: totalCampaigns = 0 } = await supabase
        .from("campaigns")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { count: activeCampaigns = 0 } = await supabase
        .from("campaigns")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active");

      // Contatos
      const { count: totalContacts = 0 } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Instâncias
      const { count: totalInstances = 0 } = await supabase
        .from("instances")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setStats({
        sentMessages: sentMessages ?? 0,
        activeCampaigns: activeCampaigns ?? 0,
        totalCampaigns: totalCampaigns ?? 0,
        totalContacts: totalContacts ?? 0,
        totalInstances: totalInstances ?? 0,
      });
      setLoading(false);
    }

    fetchStats();
  }, [user]);

  return { stats, loading };
}
