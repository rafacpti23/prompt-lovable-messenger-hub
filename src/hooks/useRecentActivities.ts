import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

const fetchRecentActivities = async (userId: string) => {
  const { data, error } = await supabase
    .from('messages_log')
    .select('*, contact:contacts(name)')
    .eq('user_id', userId)
    .order('sent_at', { ascending: false })
    .limit(4);

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

export function useRecentActivities() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recentActivities", user?.id],
    queryFn: () => fetchRecentActivities(user!.id),
    enabled: !!user,
  });
}