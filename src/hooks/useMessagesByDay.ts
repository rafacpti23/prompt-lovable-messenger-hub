import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export interface MessagesByDay {
  day: string;
  count: number;
}

const fetchMessagesByDay = async (userId: string): Promise<MessagesByDay[]> => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: result, error } = await supabase
    .from("messages_log")
    .select("sent_at")
    .eq("status", "sent")
    .filter(
      "campaign_id",
      "in",
      `(select id from campaigns where user_id='${userId}')`
    )
    .gte("sent_at", thirtyDaysAgo)
    .order("sent_at", { ascending: true });

  if (error) {
    throw new Error(`Error fetching messages: ${error.message}`);
  }

  const grouped: { [k: string]: number } = {};
  for (const item of result as any[]) {
    const date = item.sent_at?.split("T")[0];
    if (date) {
      grouped[date] = (grouped[date] || 0) + 1;
    }
  }

  return Object.keys(grouped).sort().map(day => ({
    day,
    count: grouped[day],
  }));
};

export const useMessagesByDay = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["messagesByDay", user?.id],
    queryFn: () => fetchMessagesByDay(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}