
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
      let sentMessages = 0;
      const sentMessagesResult = await supabase
        .from("messages_log")
        .select("*", { count: "exact", head: true })
        .eq("status", "sent");
      if (!sentMessagesResult.error && typeof sentMessagesResult.count === "number") {
        sentMessages = sentMessagesResult.count;
      }

      // Campanhas
      let totalCampaigns = 0;
      const totalCampaignsRes = await supabase
        .from("campaigns")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (!totalCampaignsRes.error && typeof totalCampaignsRes.count === "number") {
        totalCampaigns = totalCampaignsRes.count;
      }

      let activeCampaigns = 0;
      const activeCampaignsRes = await supabase
        .from("campaigns")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active");
      if (!activeCampaignsRes.error && typeof activeCampaignsRes.count === "number") {
        activeCampaigns = activeCampaignsRes.count;
      }

      // Contatos
      let totalContacts = 0;
      const totalContactsRes = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (!totalContactsRes.error && typeof totalContactsRes.count === "number") {
        totalContacts = totalContactsRes.count;
      }

      // Instâncias
      let totalInstances = 0;
      const totalInstancesRes = await supabase
        .from("instances")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (!totalInstancesRes.error && typeof totalInstancesRes.count === "number") {
        totalInstances = totalInstancesRes.count;
      }

      setStats({
        sentMessages,
        activeCampaigns,
        totalCampaigns,
        totalContacts,
        totalInstances,
      });
      setLoading(false);
    }

    fetchStats();
  }, [user]);

  return { stats, loading };
}
