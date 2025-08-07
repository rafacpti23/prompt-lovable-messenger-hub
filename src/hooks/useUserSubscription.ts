import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  credits_remaining: number;
  total_credits: number;
  expires_at: string | null;
  status: string;
  plan: {
    name: string;
    price: number;
    credits: number;
    price_per_message: number;
    duration_days: number;
  };
}

const fetchSubscription = async (userId: string): Promise<UserSubscription | null> => {
  const { data, error } = await supabase
    .from("user_subscriptions")
    .select(`
      *,
      plan:plans(*)
    `)
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Ignore 'PGRST116' which means no rows were found, not a real error.
  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }
  
  return data as UserSubscription | null;
}

export function useUserSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading: loading } = useQuery({
    queryKey: ["userSubscription", user?.id],
    queryFn: () => fetchSubscription(user!.id),
    enabled: !!user,
  });

  const refreshSubscription = () => {
    queryClient.invalidateQueries({ queryKey: ["userSubscription", user?.id] });
  };

  return { subscription: subscription ?? null, loading, refreshSubscription };
}