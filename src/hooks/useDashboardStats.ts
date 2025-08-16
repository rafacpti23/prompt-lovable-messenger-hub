
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

const fetchDashboardStats = async (userId: string) => {
  // Buscar campanhas ativas
  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("id, status")
    .eq("user_id", userId)
    .eq("status", "sending");

  if (campaignsError) throw campaignsError;

  // Buscar total de campanhas
  const { count: totalCampaignsCount, error: totalCampaignsError } = await supabase
    .from("campaigns")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", userId);

  if (totalCampaignsError) throw totalCampaignsError;

  // Buscar total de contatos
  const { count: contactsCount, error: contactsError } = await supabase
    .from("contacts")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", userId);

  if (contactsError) throw contactsError;

  // Buscar mensagens enviadas hoje
  const today = new Date().toISOString().split('T')[0];
  const { count: todayMessages, error: messagesError } = await supabase
    .from("messages_log")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", userId)
    .eq("status", "sent")
    .gte("sent_at", `${today}T00:00:00.000Z`)
    .lt("sent_at", `${today}T23:59:59.999Z`);

  if (messagesError) throw messagesError;

  // Buscar total de mensagens enviadas
  const { count: sentMessagesCount, error: sentMessagesError } = await supabase
    .from("messages_log")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", userId)
    .eq("status", "sent");

  if (sentMessagesError) throw sentMessagesError;

  // Buscar total de instâncias
  const { count: instancesCount, error: instancesError } = await supabase
    .from("instances")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", userId);

  if (instancesError) throw instancesError;

  return {
    activeCampaigns: campaigns?.length || 0,
    totalCampaigns: totalCampaignsCount || 0,
    totalContacts: contactsCount || 0,
    messagesSentToday: todayMessages || 0,
    sentMessages: sentMessagesCount || 0,
    totalInstances: instancesCount || 0,
  };
};

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboardStats", user?.id],
    queryFn: () => fetchDashboardStats(user!.id),
    enabled: !!user,
  });
}
