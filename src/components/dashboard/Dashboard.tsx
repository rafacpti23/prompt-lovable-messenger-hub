
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, Users, Send, TrendingUp, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";

const Dashboard = () => {
  // Mock data - replace with real data from your backend
  const stats = {
    totalInstances: 3,
    activeInstances: 2,
    totalContacts: 1250,
    totalCampaigns: 8,
    messagesThisMonth: 4580,
    successRate: 94.2
  };

  const recentActivity = [
    { id: 1, type: "success", message: "Campanha 'Promoção Black Friday' enviada com sucesso", time: "2 min atrás" },
    { id: 2, type: "warning", message: "Instância 'Marketing-01' desconectada", time: "15 min atrás" },
    { id: 3, type: "success", message: "152 contatos importados via CSV", time: "1 hora atrás" },
    { id: 4, type: "info", message: "Nova campanha 'Newsletter' agendada", time: "2 horas atrás" }
  ];

  const upcomingCampaigns = [
    { id: 1, name: "Newsletter Semanal", contacts: 850, scheduled: "Hoje, 14:00" },
    { id: 2, name: "Lembrete de Pagamento", contacts: 120, scheduled: "Amanhã, 09:00" },
    { id: 3, name: "Promoção Fim de Semana", contacts: 2500, scheduled: "Sexta, 18:00" }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Bem-vindo ao WhatsApp Pro!</h2>
        <p className="text-green-100">
          Gerencie suas campanhas, instâncias e contatos em um só lugar.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instâncias Ativas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.activeInstances}/{stats.totalInstances}
            </div>
            <p className="text-xs text-muted-foreground">
              +1 desde ontem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalContacts.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +152 esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.messagesThisMonth.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.successRate}%
            </div>
            <Progress value={stats.successRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Atividade Recente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {activity.type === "success" && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {activity.type === "warning" && (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                    {activity.type === "error" && (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    {activity.type === "info" && (
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Send className="h-5 w-5" />
              <span>Campanhas Agendadas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-sm">{campaign.name}</h4>
                    <p className="text-xs text-gray-500">
                      {campaign.contacts} contatos
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {campaign.scheduled}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
