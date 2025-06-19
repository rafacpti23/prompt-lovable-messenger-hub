
import { useState, useEffect } from "react";
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

export function useUserSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      setLoading(true);
      if (!user) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(`
          *,
          plan:plans(*)
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setSubscription(data as UserSubscription);
      } else {
        setSubscription(null);
      }
      setLoading(false);
    }

    fetchSubscription();
  }, [user]);

  const refreshSubscription = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select(`
        *,
        plan:plans(*)
      `)
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!error && data) {
      setSubscription(data as UserSubscription);
    }
  };

  return { subscription, loading, refreshSubscription };
}
