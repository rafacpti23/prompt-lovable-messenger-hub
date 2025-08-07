
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export interface Instance {
  id: string;
  instance_name: string;
  status: string | null;
  user_id: string; // <-- Add this line
}

export function useInstanceList() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchInstances() {
      setLoading(true);
      if (!user) {
        setInstances([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("instances")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) {
        setInstances(
          data.map((inst: any) => ({
            id: inst.id,
            instance_name: inst.instance_name,
            status: inst.status,
            user_id: inst.user_id, // <-- Map user_id from db
          }))
        );
      }
      setLoading(false);
    }
    fetchInstances();
  }, [user]);

  return { instances, loading };
}
