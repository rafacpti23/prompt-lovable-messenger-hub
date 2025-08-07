
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  price_per_message: number;
  duration_days: number;
  is_active: boolean;
}

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (!error && data) {
        setPlans(data);
      }
      setLoading(false);
    }

    fetchPlans();
  }, []);

  return { plans, loading };
}
