import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, Loader2, ListChecks } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CampaignForm from "./CampaignForm";
import CampaignList from "./CampaignList";
import CampaignDetailsModal from "./CampaignDetailsModal";
import { useBilling } from "@/hooks/useBilling";
import { useCampaigns } from "@/hooks/useCampaigns.tsx";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast as sonner } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface CampaignsManagerProps {
  contactGroups: string[];
}

const CampaignsManager: React.FC<CampaignsManagerProps> = ({ contactGroups }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [startingCampaign, setStartingCampaign] = useState<string | null>(null);
  const { canSendMessage, subscription } = useBilling();
  const { toast } = useToast();
  const { data: campaigns = [], isLoading: campaignsLoading } = useCampaigns();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [detailsModal, setDetailsModal] = useState<{open: boolean, campaignId: string | null}>({ open: false, campaignId: null });

  // Estados para o formulário
  const [newCampaign, setNewCampaign] = useState({ name: "", message: "" });
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [contactSource, setContactSource] = useState<"supabase" | "google">("supabase");
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleSheetName, setGoogleSheetName] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [scheduleType, setScheduleType] = useState<"once" | "recurring">("once");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [recurringInterval, setRecurringInterval] = useState(1);
  const [selectedInstanceId, setSelectedInstanceId] = useState("");

  const [instances, setInstances] = useState<Array<{id: string, instance_name: string, status: string | null}>>([]);
  
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

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["campaigns", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["dashboardStats", user?.id] });
  };

  const handleCampaignCreated = () => {
    setShowCreateForm(false);
    setNewCampaign({ name: "", message: "" });
    setMediaUrl(null);
    setSelectedGroup("");
    setSelectedInstanceId("");
    setScheduleDate("");
    setScheduleTime("");
    invalidateQueries();
  };

  const handleConnectGoogle = () => {
    setGoogleConnected(true);
    setGoogleSheetName("Planilha de Contatos");
  };

  const createCampaign = async () => {
    if (!user || !newCampaign.name || !selectedInstanceId || !selectedGroup) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios (Instância, Nome, Grupo)", variant: "destructive" });
      return;
    }

    let scheduledForISO: string | null = null;
    if (scheduleDate && scheduleTime) {
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      if (scheduledDateTime < new Date()) {
        toast({ title: "Erro de Agendamento", description: "A data e hora do agendamento não podem ser no passado.", variant: "destructive" });
        return;
      }
      scheduledForISO = scheduledDateTime.toISOString();
    } else {
      toast({ title: "Erro de Agendamento", description: "Por favor, defina a data e hora para o envio.", variant: "destructive" });
      return;
    }

    try {
      const { data: contacts, error: contactsError } = await supabase.from('contacts').select('id').eq('user_id', user.id).contains('tags', [selectedGroup]);
      if (contactsError) throw new Error("Erro ao buscar contatos do grupo.");
      if (!contacts || contacts.length === 0) {
        toast({ title: "Grupo vazio", description: `Nenhum contato encontrado no grupo "${selectedGroup}".`, variant: "destructive" });
        return;
      }
      const contactIds = contacts.map(c => c.id);

      const { error } = await supabase.from("campaigns").insert({
        user_id: user.id,
        instance_id: selectedInstanceId,
        name: newCampaign.name,
        message: newCampaign.message,
        media_url: mediaUrl,
        contact_ids: contactIds,
        status: "draft",
        scheduled_for: scheduledForISO
      });
      if (error) throw error;

      toast({ title: "Sucesso", description: "Campanha criada com sucesso! Ela será enviada no horário agendado." });
      handleCampaignCreated();
    } catch (error: any) {
      toast({ title: "Erro ao criar campanha", description: error.message, variant: "destructive" });
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
      invalidateQueries();
      toast({ title: "Sucesso", description: "Campanha excluída com sucesso!" });
    } catch (error: any) {
      toast({ title: "Erro ao excluir campanha", description: error.message, variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-800";
      case "scheduled": return "bg-yellow-100 text-yellow-800";
      case "sending": return "bg-blue-100 text-blue-800";
      case "paused": return "bg-orange-100 text-orange-800";
      case "completed": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "draft": return "Rascunho";
      case "scheduled": return "Agendada";
      case "sending": return "Ativa/Enviando";
      case "paused": return "Pausada";
      case "completed": return "Concluída";
      case "failed": return "Falhou";
      default: return status;
    }
  };

  const onStartCampaign = async (campaignId: string) => {
    if (!user) return;
    setStartingCampaign(campaignId);
    
    try {
      sonner.info("Ativando campanha...", {
        description: "Aguarde enquanto a fila de mensagens é criada.",
      });

      const { data, error } = await supabase.rpc('queue_and_activate_campaign', {
        campaign_id_param: campaignId
      });

      if (error) {
        throw new Error(error.message);
      }

      // CORREÇÃO: Checar a resposta da função antes de prosseguir
      if (data.startsWith('Success:')) {
        sonner.success("Campanha ativada!", { description: data });
        invalidateQueries();
        setDetailsModal({ open: true, campaignId }); // Abrir modal apenas em caso de sucesso
      } else if (data.startsWith('Info:')) {
        sonner.info("Aviso da Campanha", { description: data });
        invalidateQueries();
      } else { // Tratar como erro
        throw new Error(data);
      }
      
    } catch (error: any) {
      console.error("Erro ao ativar campanha:", error);
      sonner.error("Erro ao ativar campanha", { description: error.message });
    } finally {
      setStartingCampaign(null);
    }
  };

  const pauseCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase.from("campaigns").update({ status: 'paused' }).eq("id", campaignId);
      if (error) throw error;
      invalidateQueries();
      sonner.success("Campanha pausada com sucesso.");
    } catch (error: any) {
      sonner.error("Erro ao pausar campanha", { description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Campanhas</h2>
          <p className="text-gray-600 dark:text-gray-300">Crie e gerencie suas campanhas de mensagens</p>
        </div>
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button disabled={!canSendMessage()}>
              <Plus className="h-4 w-4 mr-2" /> Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Criar Nova Campanha</DialogTitle></DialogHeader>
            <CampaignForm {...{ newCampaign, setNewCampaign, mediaUrl, setMediaUrl, contactSource, setContactSource, googleConnected, googleSheetName, handleConnectGoogle, setGoogleConnected, setGoogleSheetName, supabaseGroups: contactGroups, googleSheetGroups: [], selectedGroup, setSelectedGroup, scheduleType, setScheduleType, scheduleDate, setScheduleDate, scheduleTime, setScheduleTime, recurringInterval, setRecurringInterval, createCampaign, instances, selectedInstanceId, setSelectedInstanceId }} />
          </DialogContent>
        </Dialog>
      </div>

      {!canSendMessage() && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {!subscription ? "Você não possui uma assinatura ativa. Adquira um plano para criar campanhas." : subscription.credits_remaining <= 0 ? "Você não possui créditos suficientes. Renove seu plano." : subscription.expires_at && new Date(subscription.expires_at) < new Date() ? "Sua assinatura expirou. Renove para continuar." : "Não é possível criar campanhas no momento."}
          </AlertDescription>
        </Alert>
      )}

      {subscription && subscription.credits_remaining <= 10 && subscription.credits_remaining > 0 && (
        <Alert className="bg-warning/10 border-warning/20 text-warning-foreground">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Atenção: Você possui apenas {subscription.credits_remaining} crédito(s) restante(s).</AlertDescription>
        </Alert>
      )}

      {campaignsLoading ? (
        <div className="text-center py-8 text-gray-500"><Loader2 className="h-8 w-8 mx-auto animate-spin" /> Carregando campanhas...</div>
      ) : (
        <CampaignList campaigns={campaigns} deleteCampaign={deleteCampaign} getStatusColor={getStatusColor} getStatusText={getStatusText} onStartCampaign={onStartCampaign} onPauseCampaign={pauseCampaign} onShowDetails={(id) => setDetailsModal({ open: true, campaignId: id })} />
      )}

      <CampaignDetailsModal campaignId={detailsModal.campaignId} open={detailsModal.open} onOpenChange={(open) => setDetailsModal({ ...detailsModal, open })} />
    </div>
  );
};

export default CampaignsManager;