
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Plus, Play, Pause, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CampaignsManager = () => {
  const [campaigns, setCampaigns] = useState([
    {
      id: 1,
      name: "Promoção Black Friday",
      message: "Não perca nossa super promoção! Descontos de até 50%",
      status: "active",
      sent: 150,
      total: 200
    },
    {
      id: 2,
      name: "Lembrete Consulta",
      message: "Lembrete: Sua consulta está agendada para amanhã",
      status: "paused",
      sent: 45,
      total: 100
    }
  ]);
  const [newCampaign, setNewCampaign] = useState({ name: "", message: "" });
  const { toast } = useToast();

  const createCampaign = () => {
    if (!newCampaign.name || !newCampaign.message) {
      toast({
        title: "Erro",
        description: "Nome e mensagem são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const campaign = {
      id: Date.now(),
      ...newCampaign,
      status: "draft" as const,
      sent: 0,
      total: 0
    };

    setCampaigns([...campaigns, campaign]);
    setNewCampaign({ name: "", message: "" });
    
    toast({
      title: "Campanha criada",
      description: `Campanha ${newCampaign.name} criada com sucesso`,
    });
  };

  const deleteCampaign = (id: number) => {
    setCampaigns(campaigns.filter(campaign => campaign.id !== id));
    toast({
      title: "Campanha removida",
      description: "Campanha deletada com sucesso",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Ativa";
      case "paused":
        return "Pausada";
      case "completed":
        return "Concluída";
      case "draft":
        return "Rascunho";
      default:
        return "Desconhecido";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Send className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Campanhas</h2>
        </div>
      </div>

      {/* Criar Nova Campanha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Criar Nova Campanha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Nome da campanha"
              value={newCampaign.name}
              onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
            />
            <Textarea
              placeholder="Mensagem da campanha"
              value={newCampaign.message}
              onChange={(e) => setNewCampaign({...newCampaign, message: e.target.value})}
              rows={4}
            />
            <Button onClick={createCampaign}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Campanha
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Campanhas */}
      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{campaign.name}</h3>
                    <Badge className={getStatusColor(campaign.status)}>
                      {getStatusText(campaign.status)}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-3">{campaign.message}</p>
                  {campaign.total > 0 && (
                    <div className="text-sm text-gray-500">
                      Progresso: {campaign.sent} de {campaign.total} mensagens enviadas
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {campaign.status === "draft" && (
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Iniciar
                    </Button>
                  )}
                  {campaign.status === "active" && (
                    <Button variant="outline" size="sm">
                      <Pause className="h-4 w-4 mr-2" />
                      Pausar
                    </Button>
                  )}
                  {campaign.status === "paused" && (
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Retomar
                    </Button>
                  )}
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => deleteCampaign(campaign.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CampaignsManager;
