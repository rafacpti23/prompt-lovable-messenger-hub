
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export interface MessagesByDay {
  day: string;
  count: number;
}

export const useMessagesByDay = () => {
  const { user } = useAuth();
  const [data, setData] = useState<MessagesByDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      if (!user) {
        setData([]);
        setLoading(false);
        return;
      }

      // Busca mensagens dos últimos 30 dias filtrando por campanhas do usuário
      const { data: result, error } = await supabase
        .from("messages_log")
        .select(`
          sent_at,
          campaigns!inner(user_id)
        `)
        .eq("status", "sent")
        .eq("campaigns.user_id", user.id)
        .gte("sent_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order("sent_at", { ascending: true });

      if (error || !result) {
        console.log("Erro ao buscar mensagens:", error);
        setData([]);
        setLoading(false);
        return;
      }

      // Agrupar localmente por dia
      const grouped: { [k: string]: number } = {};
      for (const item of result as any[]) {
        const date = item.sent_at?.split("T")[0]; // 'YYYY-MM-DD'
        if (date) {
          grouped[date] = (grouped[date] || 0) + 1;
        }
      }

      // Converter para array e ordenar
      const arr = Object.keys(grouped).sort().map(day => ({
        day,
        count: grouped[day],
      }));
      
      setData(arr);
      setLoading(false);
    }

    fetch();
  }, [user]);

  return { data, loading };
}
