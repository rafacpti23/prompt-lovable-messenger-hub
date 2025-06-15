
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Plus, QrCode, Trash2, Power } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const InstancesManager = () => {
  const [instances, setInstances] = useState([
    {
      id: 1,
      name: "whatsapp-1",
      status: "connected",
      phone: "+55 11 99999-1234"
    },
    {
      id: 2,
      name: "whatsapp-2", 
      status: "disconnected",
      phone: ""
    }
  ]);
  const [newInstanceName, setNewInstanceName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const createInstance = async () => {
    if (!newInstanceName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da instância é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Simular criação
      const newInstance = {
        id: Date.now(),
        name: newInstanceName,
        status: "disconnected" as const,
        phone: ""
      };
      
      setInstances([...instances, newInstance]);
      setNewInstanceName("");
      
      toast({
        title: "Instância criada",
        description: `Instância ${newInstanceName} criada com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar instância",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteInstance = (id: number) => {
    setInstances(instances.filter(instance => instance.id !== id));
    toast({
      title: "Instância removida",
      description: "Instância deletada com sucesso",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-800";
      case "disconnected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "connected":
        return "Conectado";
      case "disconnected":
        return "Desconectado";
      default:
        return "Desconhecido";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Instâncias</h2>
        </div>
      </div>

      {/* Criar Nova Instância */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Criar Nova Instância
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Nome da instância (ex: whatsapp-vendas)"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
              />
            </div>
            <Button onClick={createInstance} disabled={isCreating}>
              <Plus className="h-4 w-4 mr-2" />
              {isCreating ? "Criando..." : "Criar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Instâncias */}
      <div className="grid gap-4">
        {instances.map((instance) => (
          <Card key={instance.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <span className="font-medium">{instance.name}</span>
                  </div>
                  <Badge className={getStatusColor(instance.status)}>
                    {getStatusText(instance.status)}
                  </Badge>
                  {instance.phone && (
                    <span className="text-sm text-gray-500">{instance.phone}</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {instance.status === "disconnected" && (
                    <Button variant="outline" size="sm">
                      <QrCode className="h-4 w-4 mr-2" />
                      QR Code
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Power className="h-4 w-4 mr-2" />
                    {instance.status === "connected" ? "Desconectar" : "Conectar"}
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => deleteInstance(instance.id)}
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

export default InstancesManager;
