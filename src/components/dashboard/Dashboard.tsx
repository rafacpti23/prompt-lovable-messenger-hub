import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { 
  MessageSquare, 
  Users, 
  Send, 
  Smartphone, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Target,
  PlayCircle,
  Loader2,
  BarChart3
} from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useMessagesByDay } from "@/hooks/useMessagesByDay";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useBilling } from "@/hooks/useBilling";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import TutorialModal from "@/components/TutorialModal";
import { useRecentActivities } from "@/hooks/useRecentActivities";

const Dashboard = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: messagesByDay, isLoading: chartLoading } = useMessagesByDay();
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns();
  const { subscription } = useBilling();
  const [isDispatching, setIsDispatching] = useState(false);
  const { data: recentActivities, isLoading: activitiesLoading } = useRecentActivities();

  const handleManualDispatch = async () => {
    setIsDispatching(true);
    toast.info("Iniciando disparo manual...", {
      description: "Processando a fila de mensagens agendadas.",
    });

    try {
      // Invoca a função message-sender para processar mensagens da fila avançada
      const { data, error } = await supabase.functions.invoke('message-sender');

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      toast.success("Disparo manual concluído!", {
        description: data.message || "Verifique o status das suas campanhas.",
      });

    } catch (error: any) {
      toast.error("Falha no disparo manual", {
        description: error.message,
      });
    } finally {
      setIsDispatching(false);
    }
  };

  const statCards = [
    { title: "Mensagens Enviadas", value: stats?.sentMessages ?? 0, icon: Send, color: "text-green-600" },
    { title: "Campanhas Ativas", value: stats?.activeCampaigns ?? 0, icon: MessageSquare, color: "text-blue-600" },
    { title: "Total de Contatos", value: stats?.totalContacts ?? 0, icon: Users, color: "text-purple-600" },
    { title: "Instâncias Ativas", value: stats?.totalInstances ?? 0, icon: Smartphone, color: "text-orange-600" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sending": return "bg-blue-100 text-blue-800";
      case "scheduled": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "sending": return "Enviando";
      case "scheduled": return "Agendada";
      case "completed": return "Concluída";
      default: return status;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " anos atrás";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " meses atrás";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " dias atrás";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " horas atrás";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutos atrás";
    return "agora mesmo";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Visão geral do seu sistema de mensagens</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleManualDispatch} disabled={isDispatching}>
            <PlayCircle className="h-4 w-4 mr-2" />
            {isDispatching ? "Enviando..." : "Enviar Mensagens da Fila"}
          </Button>
          <TutorialModal />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                      {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stat.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full bg-gray-100 dark:bg-gray-800`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Mensagens Enviadas (Últimos 30 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <div className="h-[300px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : messagesByDay && messagesByDay.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={messagesByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} />
                    <YAxis />
                    <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')} />
                    <Area type="monotone" dataKey="count" name="Mensagens" stroke="#3b82f6" fill="#dbeafe" fillOpacity={0.8} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-center text-gray-500">
                  <BarChart3 className="h-12 w-12 mb-4 text-gray-300" />
                  <h3 className="font-semibold">Nenhum dado de envio</h3>
                  <p className="text-sm">As mensagens enviadas nos últimos 30 dias aparecerão aqui.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Status das Campanhas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {campaignsLoading ? <div className="h-[300px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                <div className="space-y-4">
                  {(campaigns || []).slice(0, 4).map((campaign) => (
                    <div key={campaign.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm truncate">{campaign.name}</span>
                        <Badge className={getStatusColor(campaign.status)}>{getStatusText(campaign.status)}</Badge>
                      </div>
                      <Progress value={(campaign.sent / campaign.total) * 100} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>{campaign.sent} de {campaign.total}</span>
                        <span>{Math.round((campaign.sent / campaign.total) * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Atividades Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? <div className="h-[200px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                <div className="space-y-4">
                  {(recentActivities || []).map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg border dark:border-gray-700">
                      <div className={`p-2 rounded-full ${activity.status === "sent" ? "bg-green-100 dark:bg-green-900/50" : "bg-red-100 dark:bg-red-900/50"}`}>
                        {activity.status === "sent" ? 
                          <CheckCircle className="h-5 w-5 text-green-600" /> : 
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        }
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Mensagem {activity.status === 'sent' ? 'enviada' : 'falhou'}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{activity.contact?.name || activity.phone}</p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(activity.sent_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Métricas Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total de Campanhas</span>
                  <span className="font-bold text-gray-900 dark:text-white">{stats?.totalCampaigns ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Créditos Restantes</span>
                  <span className="font-bold text-orange-600">{subscription?.credits_remaining?.toLocaleString() ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Plano Atual</span>
                  <span className="font-bold text-blue-600 capitalize">{subscription?.plan?.name ?? 'Nenhum'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;