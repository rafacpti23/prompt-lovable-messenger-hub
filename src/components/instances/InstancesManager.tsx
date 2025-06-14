
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Plus, QrCode, Trash2, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Instance {
  id: string;
  instanceName: string;
  integration: string;
  status: "connected" | "disconnected" | "connecting";
  createdAt: string;
  phoneNumber?: string;
}

const InstancesManager = () => {
  const [instances, setInstances] = useState<Instance[]>([
    {
      id: "1",
      instanceName: "marketing-principal",
      integration: "WHATSAPP-BAILEYS",
      status: "connected",
      createdAt: "2024-01-15",
      phoneNumber: "+55 11 99999-9999"
    },
    {
      id: "2", 
      instanceName: "suporte-cliente",
      integration: "WHATSAPP-BAILEYS",
      status: "disconnected",
      createdAt: "2024-01-10"
    }
  ]);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newInstance, setNewInstance] = useState({
    instanceName: "",
    integration: "WHATSAPP-BAILEYS"
  });
  const { toast } = useToast();

  const handleCreateInstance = async () => {
    if (!newInstance.instanceName) {
      toast({
        title: "Erro",
        description: "Nome da instância é obrigatório",
        variant: "destructive"
      });
      return;
    }

    // Simulate API call
    const instance: Instance = {
      id: Date.now().toString(),
      instanceName: newInstance.instanceName,
      integration: newInstance.integration,
      status: "connecting",
      createdAt: new Date().toISOString().split('T')[0]
    };

    setInstances([...instances, instance]);
    setNewInstance({ instanceName: "", integration: "WHATSAPP-BAILEYS" });
    setShowCreateDialog(false);

    toast({
      title: "Instância criada!",
      description: "Escaneie o QR Code para conectar ao WhatsApp"
    });
  };

  const handleDeleteInstance = (id: string) => {
    setInstances(instances.filter(instance => instance.id !== id));
    toast({
      title: "Instância removida",
      description: "A instância foi excluída com sucesso"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "bg-green-100 text-green-800";
      case "disconnected": return "bg-red-100 text-red-800";
      case "connecting": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "connected": return "Conectado";
      case "disconnected": return "Desconectado";
      case "connecting": return "Conectando";
      default: return "Desconhecido";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Instâncias</h2>
          <p className="text-gray-600">Configure e monitore suas conexões WhatsApp</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Instância
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Instância</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="instanceName">Nome da Instância</Label>
                <Input
                  id="instanceName"
                  placeholder="ex: marketing-principal"
                  value={newInstance.instanceName}
                  onChange={(e) => setNewInstance({...newInstance, instanceName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="integration">Integração</Label>
                <Select 
                  value={newInstance.integration} 
                  onValueChange={(value) => setNewInstance({...newInstance, integration: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WHATSAPP-BAILEYS">WhatsApp Baileys</SelectItem>
                    <SelectItem value="WHATSAPP-WEB">WhatsApp Web</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateInstance}>
                  Criar Instância
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instances.map((instance) => (
          <Card key={instance.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-lg">{instance.instanceName}</span>
                </CardTitle>
                <Badge className={getStatusColor(instance.status)}>
                  {instance.status === "connected" && <Wifi className="h-3 w-3 mr-1" />}
                  {instance.status === "disconnected" && <WifiOff className="h-3 w-3 mr-1" />}
                  {getStatusText(instance.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <p><strong>Integração:</strong> {instance.integration}</p>
                <p><strong>Criado em:</strong> {new Date(instance.createdAt).toLocaleDateString('pt-BR')}</p>
                {instance.phoneNumber && (
                  <p><strong>Telefone:</strong> {instance.phoneNumber}</p>
                )}
              </div>

              <div className="flex space-x-2">
                {instance.status === "connecting" && (
                  <Button size="sm" className="flex-1">
                    <QrCode className="h-4 w-4 mr-2" />
                    Ver QR Code
                  </Button>
                )}
                {instance.status === "disconnected" && (
                  <Button size="sm" variant="outline" className="flex-1">
                    <Wifi className="h-4 w-4 mr-2" />
                    Conectar
                  </Button>
                )}
                {instance.status === "connected" && (
                  <Button size="sm" variant="outline" className="flex-1">
                    <WifiOff className="h-4 w-4 mr-2" />
                    Desconectar
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleDeleteInstance(instance.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {instances.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma instância criada
            </h3>
            <p className="text-gray-600 mb-4">
              Crie sua primeira instância para começar a enviar mensagens
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Instância
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InstancesManager;
