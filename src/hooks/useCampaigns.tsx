import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect } from "react";
import { toast as sonner } from "sonner";
import { Bell } from "lucide-react";

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
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('public:campaigns')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'campaigns', filter: `user_id=eq.${user.id}` },
        (payload) => {
          // Notificar quando a campanha for concluída
          if (payload.old.status !== 'completed' && payload.new.status === 'completed') {
            sonner.success("Campanha Concluída!", {
              description: `A campanha "${payload.new.name}" foi finalizada.`,
              icon: <Bell className="h-4 w-4" />,
            });
          }
          
          // Atualizar os dados na tela
          queryClient.invalidateQueries({ queryKey: ['campaigns', user.id] });
          queryClient.invalidateQueries({ queryKey: ['dashboardStats', user.id] });
          queryClient.invalidateQueries({ queryKey: ['userSubscription', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ["campaigns", user?.id],
    queryFn: () => fetchCampaigns(user!.id),
    enabled: !!user,
  });
}