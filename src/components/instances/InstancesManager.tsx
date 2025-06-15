
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Plus, QrCode, Trash2, Wifi, WifiOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Database } from "@/integrations/supabase/types";

type Instance = Database['public']['Tables']['instances']['Row'];

const InstancesManager = () => {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newInstance, setNewInstance] = useState({
    instanceName: "",
    integration: "WHATSAPP-BAILEYS"
  });
  const { toast } = useToast();
  const { user } = useAuth();

  // Carregar instâncias do usuário
  const loadInstances = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('instances')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstances(data || []);
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar instâncias",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstances();
  }, [user]);

  const handleCreateInstance = async () => {
    if (!newInstance.instanceName) {
      toast({
        title: "Erro",
        description: "Nome da instância é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!user) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('instances')
        .insert({
          user_id: user.id,
          instance_name: newInstance.instanceName,
          integration: newInstance.integration,
          status: 'connecting'
        })
        .select()
        .single();

      if (error) throw error;

      setInstances([data, ...instances]);
      setNewInstance({ instanceName: "", integration: "WHATSAPP-BAILEYS" });
      setShowCreateDialog(false);

      toast({
        title: "Instância criada!",
        description: "Instância criada com sucesso. Conecte-se para gerar o QR Code"
      });

      // Simular processo de conexão (aqui você integraria com a Evolution API)
      setTimeout(async () => {
        const qrCode = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
        
        await supabase
          .from('instances')
          .update({ qr_code: qrCode })
          .eq('id', data.id);
        
        loadInstances();
      }, 2000);

    } catch (error) {
      console.error('Erro ao criar instância:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar instância",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteInstance = async (instanceId: string) => {
    try {
      const { error } = await supabase
        .from('instances')
        .delete()
        .eq('id', instanceId);

      if (error) throw error;

      setInstances(instances.filter(instance => instance.id !== instanceId));
      toast({
        title: "Instância removida",
        description: "A instância foi excluída com sucesso"
      });
    } catch (error) {
      console.error('Erro ao deletar instância:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar instância",
        variant: "destructive"
      });
    }
  };

  const handleConnect = async (instance: Instance) => {
    try {
      const { error } = await supabase
        .from('instances')
        .update({ status: 'connecting' })
        .eq('id', instance.id);

      if (error) throw error;

      loadInstances();
      
      toast({
        title: "Conectando...",
        description: "Iniciando processo de conexão"
      });

      // Aqui você faria a chamada para a Evolution API para iniciar conexão
      // Por enquanto, simular geração de QR Code
      setTimeout(async () => {
        const qrCode = `data:image/svg+xml;base64,${btoa(`
          <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="white"/>
            <text x="100" y="100" text-anchor="middle" fill="black">QR Code</text>
            <text x="100" y="120" text-anchor="middle" fill="black">${instance.instance_name}</text>
          </svg>
        `)}`;
        
        await supabase
          .from('instances')
          .update({ qr_code: qrCode })
          .eq('id', instance.id);
        
        loadInstances();
      }, 1500);

    } catch (error) {
      console.error('Erro ao conectar instância:', error);
      toast({
        title: "Erro",
        description: "Erro ao conectar instância",
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = async (instanceId: string) => {
    try {
      const { error } = await supabase
        .from('instances')
        .update({ 
          status: 'disconnected',
          qr_code: null,
          phone_number: null
        })
        .eq('id', instanceId);

      if (error) throw error;

      loadInstances();
      toast({
        title: "Desconectado",
        description: "Instância desconectada com sucesso"
      });
    } catch (error) {
      console.error('Erro ao desconectar instância:', error);
      toast({
        title: "Erro",
        description: "Erro ao desconectar instância",
        variant: "destructive"
      });
    }
  };

  const showQrCode = (instance: Instance) => {
    setSelectedInstance(instance);
    setShowQrDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "bg-green-100 text-green-800";
      case "disconnected": return "bg-red-100 text-red-800";
      case "connecting": return "bg-yellow-100 text-yellow-800";
      case "error": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "connected": return "Conectado";
      case "disconnected": return "Desconectado";
      case "connecting": return "Conectando";
      case "error": return "Erro";
      default: return "Desconhecido";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
                <Button onClick={handleCreateInstance} disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar Instância
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog do QR Code */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - {selectedInstance?.instance_name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            {selectedInstance?.qr_code ? (
              <div className="p-4 bg-white rounded-lg border">
                <img 
                  src={selectedInstance.qr_code} 
                  alt="QR Code" 
                  className="w-64 h-64 object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center w-64 h-64 bg-gray-100 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            <p className="text-sm text-gray-600 text-center">
              Escaneie o QR Code com seu WhatsApp para conectar a instância
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instances.map((instance) => (
          <Card key={instance.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-lg">{instance.instance_name}</span>
                </CardTitle>
                <Badge className={getStatusColor(instance.status || 'disconnected')}>
                  {instance.status === "connected" && <Wifi className="h-3 w-3 mr-1" />}
                  {instance.status === "disconnected" && <WifiOff className="h-3 w-3 mr-1" />}
                  {instance.status === "connecting" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  {getStatusText(instance.status || 'disconnected')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <p><strong>Integração:</strong> {instance.integration}</p>
                <p><strong>Criado em:</strong> {new Date(instance.created_at).toLocaleDateString('pt-BR')}</p>
                {instance.phone_number && (
                  <p><strong>Telefone:</strong> {instance.phone_number}</p>
                )}
              </div>

              <div className="flex space-x-2">
                {instance.status === "connecting" && instance.qr_code && (
                  <Button size="sm" className="flex-1" onClick={() => showQrCode(instance)}>
                    <QrCode className="h-4 w-4 mr-2" />
                    Ver QR Code
                  </Button>
                )}
                {instance.status === "connecting" && !instance.qr_code && (
                  <Button size="sm" className="flex-1" disabled>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando QR...
                  </Button>
                )}
                {instance.status === "disconnected" && (
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleConnect(instance)}>
                    <Wifi className="h-4 w-4 mr-2" />
                    Conectar
                  </Button>
                )}
                {instance.status === "connected" && (
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDisconnect(instance.id)}>
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
