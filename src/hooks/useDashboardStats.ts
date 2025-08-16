
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

  return {
    activeCampaigns: campaigns?.length || 0,
    totalContacts: contactsCount || 0,
    messagesSentToday: todayMessages || 0,
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
