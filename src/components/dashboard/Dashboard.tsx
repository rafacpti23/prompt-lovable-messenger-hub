import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, MessageSquare, Users, Send, Zap, Play } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useMessagesByDay } from "@/hooks/useMessagesByDay";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, XAxis, YAxis, Tooltip, Bar, ResponsiveContainer, CartesianGrid } from "recharts";

// Função utilitária para verificar se o cron job está ativo
async function isCampaignCronEnabled() {
  // Use 'as any' on supabase to bypass strict typing for this call
  const { data, error } = await (supabase as any).rpc("cron_get_job", {
    job_name: "dispatch-campaign-messages",
  });
  if (error || !data) return false;
  return (data as { active: boolean }).active === true;
}

// Função para ativar/desativar o cron (só simula para o botão, no frontend)
async function enableCampaignCron(enable: boolean) {
  if (enable) {
    toast({
      title: "Agendamento automático ativado",
      description: "O job pg_cron está ativado para disparar campanhas.",
      variant: "default",
    });
  } else {
    toast({
      title: "Agendamento automático desativado",
      description: "O job pg_cron foi desativado e não irá mais disparar campanhas automaticamente.",
      variant: "default",
    });
  }
}

// Função para testar disparo manual de campanha
async function testCampaignDispatch() {
  try {
    toast({
      title: "Disparando campanha...",
      description: "Testando envio manual da campanha.",
    });

    const { data, error } = await supabase.functions.invoke('campaign-dispatcher', {
      body: {}
    });

    if (error) {
      console.error('Erro ao disparar campanha:', error);
      toast({
        title: "Erro no disparo",
        description: `Erro: ${error.message}`,
        variant: "destructive",
      });
      return;
    }

    console.log('Resposta do disparo:', data);
    toast({
      title: "Disparo executado",
      description: "Verifique os logs da Edge Function para detalhes.",
      variant: "default",
    });
  } catch (err: any) {
    console.error('Erro no teste de disparo:', err);
    toast({
      title: "Erro no teste",
      description: `Erro: ${err.message}`,
      variant: "destructive",
    });
  }
}

type StatConfig = {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
};

const Dashboard = () => {
  const { stats, loading } = useDashboardStats();
  const { data: messagesByDay, loading: loadingGraph } = useMessagesByDay();
  const [cronEnabled, setCronEnabled] = useState(true);

  // Explicitly type array
  const statsConfig: StatConfig[] = [
    {
      title: "Mensagens Enviadas",
      value: loading ? "..." : stats.sentMessages.toLocaleString(),
      icon: Send,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Instâncias Ativas",
      value: loading ? "..." : stats.totalInstances.toLocaleString(),
      icon: MessageSquare,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Contatos",
      value: loading ? "..." : stats.totalContacts.toLocaleString(),
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Campanhas",
      value: loading ? "..." : stats.totalCampaigns.toLocaleString(),
      icon: BarChart3,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={testCampaignDispatch}
            className="flex items-center space-x-2"
          >
            <Play className="h-4 w-4" />
            <span>Testar Disparo</span>
          </Button>
          
          {/* Tutorial Button */}
          <TutorialModal />
          
          <Zap className="h-5 w-5 text-yellow-500" />
          <Switch
            checked={cronEnabled}
            onCheckedChange={(v: boolean) => {
              setCronEnabled(v);
              enableCampaignCron(v);
            }}
            className="scale-110"
            id="auto-campaign-dispatch"
          />
          <label htmlFor="auto-campaign-dispatch" className="ml-2 text-sm text-gray-700">
            Disparar campanhas automaticamente via pg_cron
          </label>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <IconComponent className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gráfico de Mensagens por Dia */}
      <Card>
        <CardHeader>
          <CardTitle>Mensagens por Dia (Últ. 30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            {loadingGraph ? (
              <div className="text-gray-400">Carregando gráfico...</div>
            ) : messagesByDay && messagesByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={messagesByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => `Dia: ${value}`} 
                    formatter={(value) => [value, "Enviadas"]}
                  />
                  <Bar dataKey="count" fill="#60a5fa" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 text-center">
                Nenhuma mensagem enviada nos últimos 30 dias.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
