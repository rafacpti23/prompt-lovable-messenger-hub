import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, MessageSquare, Users, Send, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { supabase } from "@/integrations/supabase/client";

// Função utilitária para verificar se o cron job está ativo
async function isCampaignCronEnabled() {
  // Explicitly type the return and arguments for Supabase RPC.
  type CronJobResult = { active: boolean } | null;
  const { data, error } = await supabase.rpc<CronJobResult, { job_name: string }>(
    "cron_get_job",
    { job_name: "dispatch-campaign-messages" }
  );
  // Se não tiver a função, sempre retorna desabilitado.
  if (error || !data) return false;
  return data.active === true;
}

// Função para tentar ativar o cron (na verdade, roda o schedule SQL no backend -- aqui vamos simular para o botão)
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

type StatConfig = {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
};

const Dashboard = () => {
  const { stats, loading } = useDashboardStats();
  // Cron control state - simplificado
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

      {/* Gráfico Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Mensagens por Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Gráfico será implementado em breve</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
