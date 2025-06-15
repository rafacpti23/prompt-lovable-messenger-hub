
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Plus, 
  Smartphone, 
  QrCode, 
  Trash2, 
  RefreshCw,
  Settings,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import * as evolutionApi from "@/services/evolutionApi";
import SettingsModal from "@/components/settings/SettingsModal";

interface Instance {
  id: string;
  instance_name: string;
  integration: string;
  status: string;
  qr_code?: string;
  phone_number?: string;
  created_at: string;
}

const InstancesManager = () => {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [newInstanceName, setNewInstanceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadInstances();
  }, [user]);

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
        description: "Falha ao carregar instâncias.",
        variant: "destructive",
      });
    }
  };

  const checkApiConfiguration = () => {
    if (!evolutionApi.isApiConfigured()) {
      toast({
        title: "API não configurada",
        description: "Configure a Evolution API nas configurações primeiro.",
        variant: "destructive",
      });
      setShowSettings(true);
      return false;
    }
    return true;
  };

  const createInstance = async () => {
    if (!newInstanceName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para a instância.",
        variant: "destructive",
      });
      return;
    }

    if (!checkApiConfiguration()) return;

    setLoading(true);
    try {
      // Criar na Evolution API
      await evolutionApi.createInstance(newInstanceName);

      // Salvar no banco de dados
      const { data, error } = await supabase
        .from('instances')
        .insert({
          user_id: user?.id,
          instance_name: newInstanceName,
          integration: 'WHATSAPP-BAILEYS',
          status: 'disconnected'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Instância criada com sucesso!",
      });

      setNewInstanceName("");
      await loadInstances();
    } catch (error: any) {
      console.error('Erro ao criar instância:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar instância.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const connectInstance = async (instanceName: string) => {
    if (!checkApiConfiguration()) return;

    setQrLoading(instanceName);
    try {
      const response = await evolutionApi.connectInstance(instanceName);
      
      if (response.base64) {
        // Atualizar QR code no banco
        await supabase
          .from('instances')
          .update({ 
            qr_code: response.base64,
            status: 'connecting'
          })
          .eq('instance_name', instanceName)
          .eq('user_id', user?.id);

        await loadInstances();
        
        toast({
          title: "QR Code gerado",
          description: "Escaneie o QR Code com seu WhatsApp.",
        });
      }
    } catch (error: any) {
      console.error('Erro ao conectar instância:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao conectar instância.",
        variant: "destructive",
      });
    } finally {
      setQrLoading(null);
    }
  };

  const deleteInstance = async (instance: Instance) => {
    if (!checkApiConfiguration()) return;

    try {
      // Deletar da Evolution API
      await evolutionApi.deleteInstance(instance.instance_name);

      // Deletar do banco de dados
      const { error } = await supabase
        .from('instances')
        .delete()
        .eq('id', instance.id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Instância removida com sucesso!",
      });

      await loadInstances();
    } catch (error: any) {
      console.error('Erro ao deletar instância:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao remover instância.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando';
      case 'disconnected': return 'Desconectado';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Instâncias WhatsApp</h2>
          <p className="text-muted-foreground">
            Gerencie suas conexões do WhatsApp
          </p>
        </div>
        <Button onClick={() => setShowSettings(true)} variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Configurações
        </Button>
      </div>

      {!evolutionApi.isApiConfigured() && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <h3 className="font-medium text-orange-800">API não configurada</h3>
                <p className="text-sm text-orange-700">
                  Configure a Evolution API para começar a usar o sistema.
                </p>
              </div>
              <Button 
                onClick={() => setShowSettings(true)}
                variant="outline"
                size="sm"
                className="ml-auto"
              >
                Configurar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="instances" className="space-y-4">
        <TabsList>
          <TabsTrigger value="instances">Minhas Instâncias</TabsTrigger>
          <TabsTrigger value="create">Nova Instância</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Criar Nova Instância</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="Nome da instância (ex: vendas-whatsapp)"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createInstance()}
                />
                <Button onClick={createInstance} disabled={loading || !evolutionApi.isApiConfigured()}>
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? "Criando..." : "Criar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instances">
          <div className="grid gap-4">
            {instances.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium">Nenhuma instância encontrada</h3>
                    <p className="text-gray-500 mb-4">
                      Crie sua primeira instância para começar a enviar mensagens.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              instances.map((instance) => (
                <Card key={instance.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="h-5 w-5" />
                          <h3 className="font-medium">{instance.instance_name}</h3>
                          <Badge 
                            variant="secondary" 
                            className={`text-white ${getStatusColor(instance.status)}`}
                          >
                            {getStatusText(instance.status)}
                          </Badge>
                        </div>
                        
                        {instance.phone_number && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Smartphone className="h-4 w-4" />
                            {instance.phone_number}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {instance.status === 'disconnected' && (
                          <Button
                            size="sm"
                            onClick={() => connectInstance(instance.instance_name)}
                            disabled={qrLoading === instance.instance_name}
                          >
                            <QrCode className="h-4 w-4 mr-2" />
                            {qrLoading === instance.instance_name ? "Gerando..." : "Conectar"}
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteInstance(instance)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {instance.qr_code && instance.status === 'connecting' && (
                      <div className="mt-4 p-4 border rounded-lg">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-3">
                            Escaneie o QR Code com seu WhatsApp
                          </p>
                          <img 
                            src={`data:image/png;base64,${instance.qr_code}`}
                            alt="QR Code"
                            className="mx-auto border rounded"
                            style={{ maxWidth: '200px' }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <SettingsModal 
        open={showSettings} 
        onOpenChange={setShowSettings} 
      />
    </div>
  );
};

export default InstancesManager;
