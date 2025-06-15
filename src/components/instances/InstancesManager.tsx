import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Plus, QrCode, Trash2, Power } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import InstanceQrModal from "./InstanceQrModal";
import {
  createInstance as createInstanceApi,
  isApiConfigured,
  getApiConfig,
  getQrCode,
  connectInstance,
  deleteInstance as deleteInstanceApi,
} from "@/services/evolutionApi";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

type Instance = {
  instanceId: string;
  instanceName: string;
  status: string;
  number?: string;
};

const InstancesManager = () => {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [newInstanceName, setNewInstanceName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [qrModal, setQrModal] = useState<{ open: boolean; instanceName?: string; qrBase64?: string }>({ open: false });
  const { toast } = useToast();
  const { user } = useAuth();

  // Carrega as instâncias reais da Evolution API
  const fetchInstances = async () => {
    if (!isApiConfigured()) {
      setInstances([]);
      return;
    }
    setLoadingInstances(true);
    try {
      const { apiUrl } = getApiConfig();
      const headers = {
        "Content-Type": "application/json",
        apikey: localStorage.getItem("evolution_api_key")!,
      };
      const res = await fetch(`${apiUrl}/instance/fetchInstances`, { headers });
      if (!res.ok) throw new Error("Falha ao buscar instâncias");
      const responseJson = await res.json();

      let instanceArray: any[] = [];
      if (Array.isArray(responseJson)) {
        instanceArray = responseJson;
      } else if (responseJson?.instances && Array.isArray(responseJson.instances)) {
        instanceArray = responseJson.instances;
      }

      const parsedInstances: Instance[] = instanceArray.map((i: any) => ({
        instanceId: i.instanceId || i.id || "",
        instanceName: i.instanceName || i.name || "",
        status: i.status || i.connectionStatus || "unknown",
        number: i.number || null,
      }));

      setInstances(parsedInstances);
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err?.message || "Falha ao buscar instâncias.",
        variant: "destructive",
      });
      setInstances([]);
    } finally {
      setLoadingInstances(false);
    }
  };

  useEffect(() => {
    fetchInstances();
    // Recarregar sempre que uma nova for criada/excluída/alterada usando fetchInstances
    // eslint-disable-next-line
  }, []);

  // Helper para atualizar Supabase
  const updateInstanceSupabase = async (instanceName: string, data: any) => {
    if (!user) return;
    await supabase
      .from("instances")
      .update(data)
      .eq("instance_name", instanceName)
      .eq("user_id", user.id);
  };

  const handleCreateInstance = async () => {
    if (!newInstanceName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da instância é obrigatório",
        variant: "destructive",
      });
      return;
    }
    if (!isApiConfigured()) {
      toast({
        title: "Configuração faltando",
        description: "Configure a URL da API e a API Key nas Configurações.",
        variant: "destructive",
      });
      return;
    }
    if (!user) {
      toast({
        title: "Precisa estar logado",
        description: "Faça login para criar uma instância.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      await createInstanceApi(newInstanceName);

      const { error: insertError } = await supabase
        .from("instances")
        .insert([
          {
            instance_name: newInstanceName,
            user_id: user.id,
            integration: "WHATSAPP-BAILEYS",
            status: "disconnected", // status inicial padrão
            // Nenhuma phone_number ou qr_code neste momento
          },
        ]);
      if (insertError) {
        throw new Error("Erro ao inserir a instância no Supabase: " + insertError.message);
      }

      toast({
        title: "Instância criada com sucesso!",
        description: `Instância ${newInstanceName} criada.`,
      });
      setNewInstanceName("");
      fetchInstances();
    } catch (error: any) {
      toast({
        title: "Erro ao criar instância",
        description: error?.message || "Falha ao criar instância via Evolution API/Supabase.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleConnect = async (instanceName: string) => {
    try {
      const response = await connectInstance(instanceName);
      // Atualizar no Supabase o status, caso possível (vai depender do retorno da API)
      if (response?.status) {
        await updateInstanceSupabase(instanceName, { status: response.status });
      }
      toast({
        title: "Solicitação de conexão enviada!",
        description: `Aguarde o status atualizar.`,
      });
      fetchInstances();
    } catch (error: any) {
      toast({
        title: "Erro ao conectar",
        description: error?.message || "Falha ao conectar instância.",
        variant: "destructive",
      });
    }
  };

  const handleShowQr = async (instanceName: string) => {
    try {
      const qrBase64 = await getQrCode(instanceName);

      // Não temos o número, mas podemos já marcar como "pending" ou manter "disconnected" se quiser.
      await updateInstanceSupabase(instanceName, {
        qr_code: qrBase64 || null,
        status: "pending",
      });

      setQrModal({ open: true, instanceName, qrBase64 });
      // Aqui, em um sistema ideal, após escanear o QR, deveríamos ouvir por evento/status
      // Entretanto, só atualizamos para "pending" ao exibir o QR.
    } catch (error: any) {
      toast({
        title: "Erro ao buscar QR Code",
        description: error?.message || "Falha ao buscar QR Code.",
        variant: "destructive",
      });
      setQrModal({ open: true, instanceName, qrBase64: undefined });
    }
  };

  const handleDelete = async (instanceName: string) => {
    try {
      await deleteInstanceApi(instanceName);
      toast({
        title: "Instância removida",
        description: "Instância deletada com sucesso",
      });
      fetchInstances();
    } catch (error: any) {
      toast({
        title: "Erro ao deletar instância",
        description: error?.message || "Falha ao deletar instância.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
      case "connected":
        return "bg-green-100 text-green-800";
      case "close":
      case "disconnected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
      case "connected":
        return "Conectado";
      case "close":
      case "disconnected":
        return "Desconectado";
      default:
        return "Desconhecido";
    }
  };

  return (
    <div className="space-y-6">

      <InstanceQrModal
        open={qrModal.open}
        instanceName={qrModal.instanceName}
        qrBase64={qrModal.qrBase64}
        onOpenChange={open => setQrModal(v => ({ ...v, open }))}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Instâncias</h2>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInstances} disabled={loadingInstances}>
          Atualizar
        </Button>
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
            <Button onClick={handleCreateInstance} disabled={isCreating}>
              <Plus className="h-4 w-4 mr-2" />
              {isCreating ? "Criando..." : "Criar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Instâncias */}
      <div className="grid gap-4">
        {loadingInstances ? (
          <div className="text-center py-12 text-gray-500">Carregando instâncias...</div>
        ) : instances.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Nenhuma instância cadastrada.
          </div>
        ) : (
          instances.map((instance) => (
            <Card key={instance.instanceId}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5 text-green-600" />
                      <span className="font-medium">{instance.instanceName}</span>
                    </div>
                    <Badge className={getStatusColor(instance.status)}>
                      {getStatusText(instance.status)}
                    </Badge>
                    {instance.number && (
                      <span className="text-sm text-gray-500">{instance.number}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {(instance.status === "close" || instance.status === "disconnected") && (
                      <Button variant="outline" size="sm" onClick={() => handleShowQr(instance.instanceName)}>
                        <QrCode className="h-4 w-4 mr-2" />
                        QR Code
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConnect(instance.instanceName)}
                    >
                      <Power className="h-4 w-4 mr-2" />
                      {["connected", "open"].includes(instance.status) ? "Desconectar" : "Conectar"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(instance.instanceName)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default InstancesManager;
