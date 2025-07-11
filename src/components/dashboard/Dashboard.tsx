import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MessageSquare, Users, Send, Smartphone, Star, TrendingUp } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useMessagesByDay } from "@/hooks/useMessagesByDay";
import UserCredits from "@/components/billing/UserCredits";
import EvolutionApiInfo from "@/components/settings/EvolutionApiInfo";
import { useBilling } from "@/hooks/useBilling";

const Dashboard = () => {
  const { stats, loading: statsLoading } = useDashboardStats();
  const { data: messagesByDay, loading: chartLoading } = useMessagesByDay();
  const { subscription } = useBilling();

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

  const benefits = [
    {
      icon: TrendingUp,
      title: "Aumente suas Vendas",
      description: "Campanhas automatizadas que convertem leads em clientes",
      color: "text-green-600"
    },
    {
      icon: MessageSquare,
      title: "Mensagens em Massa",
      description: "Envie milhares de mensagens personalizadas rapidamente",
      color: "text-blue-600"
    },
    {
      icon: Users,
      title: "Gestão de Contatos",
      description: "Organize e segmente seus contatos de forma inteligente",
      color: "text-purple-600"
    },
    {
      icon: Smartphone,
      title: "Múltiplas Instâncias",
      description: "Gerencie vários WhatsApp Business em uma plataforma",
      color: "text-orange-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Cards de créditos e estatísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <UserCredits />
        </div>
        
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

      {/* Seção de benefícios - mostrar apenas se não tiver assinatura ativa */}
      {(!subscription || subscription.status !== "active") && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border border-blue-200">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center">
              <Star className="h-6 w-6 text-yellow-500 mr-2" />
              Desbloqueie todo o potencial do sistema
            </h3>
            <p className="text-gray-600">
              Assine um plano e transforme seu WhatsApp em uma máquina de vendas
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <Icon className={`h-8 w-8 ${benefit.color} mx-auto mb-3`} />
                  <h4 className="font-semibold text-gray-900 mb-2">{benefit.title}</h4>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid com gráfico e informações da API */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
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
        
        <div className="lg:col-span-1">
          <EvolutionApiInfo />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;