
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CampaignForm from "./CampaignForm";
import CampaignList from "./CampaignList";
import { useBilling } from "@/hooks/useBilling";
import { useCampaignList } from "@/hooks/useCampaignList";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

interface CampaignsManagerProps {
  contactGroups: string[];
}

const CampaignsManager: React.FC<CampaignsManagerProps> = ({ contactGroups }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { canSendMessage, subscription } = useBilling();
  const { toast } = useToast();
  const { campaigns, setCampaigns } = useCampaignList(toast);
  const { user } = useAuth();

  // Estados para o formulário
  const [newCampaign, setNewCampaign] = useState({ name: "", message: "" });
  const [contactSource, setContactSource] = useState<"supabase" | "google">("supabase");
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleSheetName, setGoogleSheetName] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [scheduleType, setScheduleType] = useState<"once" | "recurring">("once");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [recurringInterval, setRecurringInterval] = useState(1);
  const [selectedInstanceId, setSelectedInstanceId] = useState("");

  // Buscar instâncias reais do usuário
  const [instances, setInstances] = useState<Array<{id: string, instance_name: string, status: string}>>([]);
  
  React.useEffect(() => {
    const fetchInstances = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("instances")
        .select("id, instance_name, status")
        .eq("user_id", user.id);
      setInstances(data || []);
    };
    fetchInstances();
  }, [user]);

  const handleCampaignCreated = () => {
    setShowCreateForm(false);
    // Resetar formulário
    setNewCampaign({ name: "", message: "" });
    setSelectedGroup("");
  };

  const handleConnectGoogle = () => {
    // Implementar conexão com Google Sheets
    setGoogleConnected(true);
    setGoogleSheetName("Planilha de Contatos");
  };

  const createCampaign = async () => {
    if (!user || !newCampaign.name || !newCampaign.message || !selectedInstanceId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          user_id: user.id,
          instance_id: selectedInstanceId,
          name: newCampaign.name,
          message: newCampaign.message,
          contact_ids: [], // Por enquanto vazio
          status: "draft"
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Campanha criada com sucesso!",
      });

      handleCampaignCreated();
      
      // Atualizar lista de campanhas com os campos sent e total
      setCampaigns(prev => [{
        id: data.id,
        name: data.name,
        message: data.message,
        status: data.status || "draft",
        created_at: data.created_at,
        sent: 0,
        total: 0,
      }, ...prev]);
    } catch (error: any) {
      toast({
        title: "Erro ao criar campanha",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setCampaigns(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Sucesso",
        description: "Campanha excluída com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir campanha",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sending": return "bg-blue-100 text-blue-800";
      case "sent": return "bg-green-100 text-green-800";
      case "scheduled": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      case "draft": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "sending": return "Enviando";
      case "sent": return "Enviada";
      case "scheduled": return "Agendada";
      case "failed": return "Falhou";
      case "draft": return "Rascunho";
      default: return status;
    }
  };

  const onStartCampaign = async (id: string) => {
    try {
      // Chamar a edge function para processar a campanha
      const { data, error } = await supabase.functions.invoke('campaign-dispatcher', {
        body: { campaignId: id }
      });

      if (error) {
        console.error('Error calling campaign-dispatcher:', error);
        throw new Error(error.message || 'Erro ao processar campanha');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro desconhecido ao processar campanha');
      }

      setCampaigns(prev => 
        prev.map(c => 
          c.id === id ? { ...c, status: "sent" } : c
        )
      );

      toast({
        title: "Sucesso",
        description: `Campanha processada! ${data.successCount} mensagens enviadas.`,
      });
    } catch (error: any) {
      console.error('Error starting campaign:', error);
      toast({
        title: "Erro ao iniciar campanha",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Campanhas</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Crie e gerencie suas campanhas de mensagens
          </p>
        </div>
        
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button disabled={!canSendMessage()}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Campanha</DialogTitle>
            </DialogHeader>
            <CampaignForm 
              newCampaign={newCampaign}
              setNewCampaign={setNewCampaign}
              contactSource={contactSource}
              setContactSource={setContactSource}
              googleConnected={googleConnected}
              googleSheetName={googleSheetName}
              handleConnectGoogle={handleConnectGoogle}
              setGoogleConnected={setGoogleConnected}
              setGoogleSheetName={setGoogleSheetName}
              supabaseGroups={contactGroups}
              googleSheetGroups={[]}
              selectedGroup={selectedGroup}
              setSelectedGroup={setSelectedGroup}
              scheduleType={scheduleType}
              setScheduleType={setScheduleType}
              scheduleDate={scheduleDate}
              setScheduleDate={setScheduleDate}
              scheduleTime={scheduleTime}
              setScheduleTime={setScheduleTime}
              recurringInterval={recurringInterval}
              setRecurringInterval={setRecurringInterval}
              createCampaign={createCampaign}
              instances={instances}
              selectedInstanceId={selectedInstanceId}
              setSelectedInstanceId={setSelectedInstanceId}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Alertas sobre créditos */}
      {!canSendMessage() && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            {!subscription ? (
              "Você não possui uma assinatura ativa. Adquira um plano para criar campanhas."
            ) : subscription.credits_remaining <= 0 ? (
              "Você não possui créditos suficientes para criar campanhas. Renove seu plano."
            ) : subscription.expires_at && new Date(subscription.expires_at) < new Date() ? (
              "Sua assinatura expirou. Renove para continuar criando campanhas."
            ) : (
              "Não é possível criar campanhas no momento."
            )}
          </AlertDescription>
        </Alert>
      )}

      {subscription && subscription.credits_remaining <= 10 && subscription.credits_remaining > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Atenção: Você possui apenas {subscription.credits_remaining} crédito(s) restante(s). 
            Considere renovar seu plano.
          </AlertDescription>
        </Alert>
      )}

      <CampaignList 
        campaigns={campaigns}
        deleteCampaign={deleteCampaign}
        getStatusColor={getStatusColor}
        getStatusText={getStatusText}
        onStartCampaign={onStartCampaign}
      />
    </div>
  );
};

export default CampaignsManager;
