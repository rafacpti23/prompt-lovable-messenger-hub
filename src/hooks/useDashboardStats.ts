import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export interface DashboardStats {
  sentMessages: number;
  activeCampaigns: number;
  totalCampaigns: number;
  totalContacts: number;
  totalInstances: number;
}

const fetchStats = async (userId: string): Promise<DashboardStats> => {
  // Mensagens enviadas (agora consulta simplificada)
  const { count: sentMessages } = await supabase
    .from("messages_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "sent");

  // Campanhas
  const { count: totalCampaigns } = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const { count: activeCampaigns } = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["sending", "scheduled"]);

  // Contatos
  const { count: totalContacts } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // Instâncias
  const { count: totalInstances } = await supabase
    .from("instances")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return {
    sentMessages: sentMessages || 0,
    activeCampaigns: activeCampaigns || 0,
    totalCampaigns: totalCampaigns || 0,
    totalContacts: totalContacts || 0,
    totalInstances: totalInstances || 0,
  };
};

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboardStats", user?.id],
    queryFn: () => fetchStats(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}