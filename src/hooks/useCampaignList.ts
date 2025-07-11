
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export interface CampaignDB {
  id: string;
  name: string;
  message: string;
  status: string;
  created_at?: string;
  sent: number;
  total: number;
}

export function useCampaignList(toast: any) {
  const [campaigns, setCampaigns] = useState<CampaignDB[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchCampaigns() {
      setLoading(true);
      if (!user) {
        setCampaigns([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        toast({
          title: "Erro ao buscar campanhas",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      const formatted = (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        message: c.message,
        status: c.status || "draft",
        created_at: c.created_at,
        sent: 0,
        total: 0,
      }));
      setCampaigns(formatted);
      setLoading(false);
    }
    fetchCampaigns();
  }, [user, toast]);

  return { campaigns, setCampaigns, loading };
}
