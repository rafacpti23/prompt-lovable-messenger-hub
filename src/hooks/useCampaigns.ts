import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

const fetchCampaigns = async (userId: string) => {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*, messages_log(count)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    message: c.message,
    status: c.status || "draft",
    created_at: c.created_at,
    sent: c.messages_log[0]?.count || 0,
    total: c.contact_ids?.length || 0,
  }));
};

export function useCampaigns() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["campaigns", user?.id],
    queryFn: () => fetchCampaigns(user!.id),
    enabled: !!user,
  });
}