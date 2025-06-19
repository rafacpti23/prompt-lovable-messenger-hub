
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MessageSquare, Users, Send, Smartphone } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useMessagesByDay } from "@/hooks/useMessagesByDay";
import UserCredits from "@/components/billing/UserCredits";

const Dashboard = () => {
  const { stats, loading: statsLoading } = useDashboardStats();
  const { data: messagesByDay, loading: chartLoading } = useMessagesByDay();

  const statCards = [
    {
      title: "Mensagens Enviadas",
      value: stats.sentMessages,
      icon: Send,
      color: "text-green-600"
    },
    {
      title: "Campanhas Ativas",
      value: stats.activeCampaigns,
      icon: MessageSquare,
      color: "text-blue-600"
    },
    {
      title: "Total de Contatos",
      value: stats.totalContacts,
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: "Instâncias WhatsApp",
      value: stats.totalInstances,
      icon: Smartphone,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Créditos do usuário */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <UserCredits />
        </div>
        
        {/* Cards de estatísticas */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                    ) : (
                      card.value.toLocaleString()
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Gráfico de mensagens por dia */}
      <Card>
        <CardHeader>
          <CardTitle>Mensagens por Dia (Últimos 30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-pulse text-gray-500">Carregando dados...</div>
            </div>
          ) : messagesByDay.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma mensagem enviada nos últimos 30 dias</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={messagesByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="day" 
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: '2-digit' 
                    });
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    });
                  }}
                  formatter={(value) => [value, 'Mensagens']}
                />
                <Bar dataKey="count" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
