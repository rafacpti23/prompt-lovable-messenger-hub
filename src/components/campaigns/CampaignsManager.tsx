
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Plus, Calendar, Clock, Users, MessageSquare, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Campaign {
  id: string;
  name: string;
  message: string;
  instanceId: string;
  selectedContacts: string[];
  scheduledDate: string;
  scheduledTime: string;
  status: "draft" | "scheduled" | "sending" | "completed" | "failed";
  createdAt: string;
  sendDelay?: number; // Pausa entre envios em segundos
}

const CampaignsManager = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: "1",
      name: "Promoção Black Friday",
      message: "Olá {{nome}}! Não perca nossa super promoção de Black Friday com até 70% de desconto!",
      instanceId: "marketing-principal",
      selectedContacts: ["1", "2", "3"],
      scheduledDate: "2024-12-15",
      scheduledTime: "14:00",
      status: "scheduled",
      createdAt: "2024-01-15",
      sendDelay: 5
    },
    {
      id: "2",
      name: "Newsletter Semanal",
      message: "Oi {{nome}}! Confira as novidades desta semana em nosso blog.",
      instanceId: "marketing-principal",
      selectedContacts: ["1", "2"],
      scheduledDate: "2024-12-16",
      scheduledTime: "09:00",
      status: "completed",
      createdAt: "2024-01-10",
      sendDelay: 3
    }
  ]);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    message: "",
    instanceId: "",
    selectedContacts: [] as string[],
    scheduledDate: "",
    scheduledTime: "",
    sendDelay: 5
  });

  const { toast } = useToast();

  // Mock data
  const availableInstances = [
    { id: "marketing-principal", name: "Marketing Principal" },
    { id: "suporte-cliente", name: "Suporte ao Cliente" }
  ];

  const availableContacts = [
    { id: "1", name: "João Silva" },
    { id: "2", name: "Maria Santos" },
    { id: "3", name: "Pedro Oliveira" }
  ];

  const handleCreateCampaign = () => {
    if (!newCampaign.name || !newCampaign.message || !newCampaign.instanceId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const campaign: Campaign = {
      id: Date.now().toString(),
      ...newCampaign,
      status: "draft",
      createdAt: new Date().toISOString().split('T')[0]
    };

    setCampaigns([...campaigns, campaign]);
    setNewCampaign({
      name: "",
      message: "",
      instanceId: "",
      selectedContacts: [],
      scheduledDate: "",
      scheduledTime: "",
      sendDelay: 5
    });
    setShowCreateDialog(false);

    toast({
      title: "Campanha criada!",
      description: "A campanha foi salva como rascunho"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-800";
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "sending": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "draft": return "Rascunho";
      case "scheduled": return "Agendado";
      case "sending": return "Enviando";
      case "completed": return "Concluído";
      case "failed": return "Falhou";
      default: return "Desconhecido";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Campanhas</h2>
          <p className="text-gray-600">Crie e agende suas campanhas de mensagem</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Campanha</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Campanha</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Promoção Natal 2024"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="instance">Instância WhatsApp</Label>
                  <Select 
                    value={newCampaign.instanceId} 
                    onValueChange={(value) => setNewCampaign({...newCampaign, instanceId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma instância" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableInstances.map((instance) => (
                        <SelectItem key={instance.id} value={instance.id}>
                          {instance.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  placeholder="Digite sua mensagem... Use {{nome}} para personalizar"
                  value={newCampaign.message}
                  onChange={(e) => setNewCampaign({...newCampaign, message: e.target.value})}
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use variáveis como {{nome}} para personalizar as mensagens
                </p>
              </div>

              <div>
                <Label>Selecionar Contatos</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto border rounded-md p-2">
                  {availableContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={contact.id}
                        checked={newCampaign.selectedContacts.includes(contact.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewCampaign({
                              ...newCampaign,
                              selectedContacts: [...newCampaign.selectedContacts, contact.id]
                            });
                          } else {
                            setNewCampaign({
                              ...newCampaign,
                              selectedContacts: newCampaign.selectedContacts.filter(id => id !== contact.id)
                            });
                          }
                        }}
                      />
                      <Label htmlFor={contact.id} className="text-sm">
                        {contact.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="date">Data de Envio</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newCampaign.scheduledDate}
                    onChange={(e) => setNewCampaign({...newCampaign, scheduledDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Horário</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newCampaign.scheduledTime}
                    onChange={(e) => setNewCampaign({...newCampaign, scheduledTime: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="delay">Pausa entre envios (seg)</Label>
                  <Input
                    id="delay"
                    type="number"
                    min="1"
                    max="60"
                    value={newCampaign.sendDelay}
                    onChange={(e) => setNewCampaign({...newCampaign, sendDelay: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateCampaign}>
                  Criar Campanha
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaign Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Send className="h-5 w-5" />
                  <span className="text-lg">{campaign.name}</span>
                </CardTitle>
                <Badge className={getStatusColor(campaign.status)}>
                  {getStatusText(campaign.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <p className="truncate">
                  <strong>Mensagem:</strong> {campaign.message.substring(0, 50)}...
                </p>
                <p><strong>Instância:</strong> {campaign.instanceId}</p>
                <p><strong>Contatos:</strong> {campaign.selectedContacts.length}</p>
                {campaign.scheduledDate && (
                  <p>
                    <strong>Agendado:</strong> {new Date(campaign.scheduledDate).toLocaleDateString('pt-BR')} às {campaign.scheduledTime}
                  </p>
                )}
                <p><strong>Pausa:</strong> {campaign.sendDelay}s entre envios</p>
              </div>

              <div className="flex space-x-2">
                {campaign.status === "draft" && (
                  <>
                    <Button size="sm" className="flex-1">
                      <Calendar className="h-4 w-4 mr-2" />
                      Agendar
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {campaign.status === "scheduled" && (
                  <>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Clock className="h-4 w-4 mr-2" />
                      Reagendar
                    </Button>
                    <Button size="sm" variant="destructive">
                      Cancelar
                    </Button>
                  </>
                )}
                {campaign.status === "completed" && (
                  <Button size="sm" variant="outline" className="flex-1">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Ver Relatório
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {campaigns.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma campanha criada
            </h3>
            <p className="text-gray-600 mb-4">
              Crie sua primeira campanha para começar a enviar mensagens
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Campanha
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CampaignsManager;
