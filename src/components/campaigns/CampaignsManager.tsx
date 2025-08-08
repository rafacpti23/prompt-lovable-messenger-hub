import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";
import CampaignList from "./CampaignList";
import CampaignForm from "./CampaignForm";
import CampaignDetailsModal from "./CampaignDetailsModal";
import { useInstanceList } from "@/hooks/useInstanceList";

interface Campaign {
  id: string;
  name: string;
  message: string;
  status: string;
  sent: number;
  total: number;
  scheduled_for: string | null;
}

interface CampaignsManagerProps {
  contactGroups: string[];
}

const CampaignsManager: React.FC<CampaignsManagerProps> = ({ contactGroups }) => {
  const { user } = useAuth();
  const { instances, loading: loadingInstances } = useInstanceList();
  const [newCampaign, setNewCampaign] = useState({ name: "", message: "" });
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailsCampaignId, setDetailsCampaignId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Buscar campanhas do usuário
  const fetchCampaigns = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*, messages_log(count)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        message: c.message,
        status: c.status || "draft",
        sent: c.messages_log?.[0]?.count || 0,
        total: c.contact_ids?.length || 0,
        scheduled_for: c.scheduled_for || null,
      }));

      setCampaigns(mapped);
    } catch (error: any) {
      toast({
        title: "Erro ao buscar campanhas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  const createCampaign = async (
    sendingMethod: "batch" | "queue",
    intervalConfig?: any[],
    scheduledFor?: string
  ) => {
    if (!user || !newCampaign.name || !selectedInstanceId || !selectedGroup) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios (Instância, Nome, Grupo)",
        variant: "destructive",
      });
      return;
    }

    if (!scheduledFor || new Date(scheduledFor) <= new Date()) {
      toast({
        title: "Erro",
        description: "Data e hora de agendamento devem ser preenchidas e futuras.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: contacts, error: contactsError } = await supabase
        .from("contacts")
        .select("id")
        .eq("user_id", user.id)
        .contains("tags", [selectedGroup]);

      if (contactsError) throw new Error("Erro ao buscar contatos do grupo.");
      if (!contacts || contacts.length === 0) {
        toast({
          title: "Grupo vazio",
          description: `Nenhum contato encontrado no grupo "${selectedGroup}".`,
          variant: "destructive",
        });
        return;
      }
      const contactIds = contacts.map((c) => c.id);

      const { error } = await supabase.from("campaigns").insert({
        user_id: user.id,
        instance_id: selectedInstanceId,
        name: newCampaign.name,
        message: newCampaign.message,
        media_url: mediaUrl,
        contact_ids: contactIds,
        status: "draft",
        sending_method: sendingMethod,
        interval_config: intervalConfig,
        scheduled_for: scheduledFor,
      });
      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Campanha criada com sucesso! Clique em 'Iniciar' para começar o envio.",
      });
      setNewCampaign({ name: "", message: "" });
      setSelectedGroup("");
      setMediaUrl(null);
      setShowCreateForm(false);
      fetchCampaigns();
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
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Campanha excluída", description: "Campanha removida com sucesso." });
      fetchCampaigns();
    } catch (error: any) {
      toast({ title: "Erro ao excluir campanha", description: error.message, variant: "destructive" });
    }
  };

  const startCampaign = async (id: string) => {
    try {
      const { data, error } = await supabase.rpc("start_campaign_processing", { campaign_id_param: id });
      if (error) throw error;
      if (data && typeof data === "string" && data.startsWith("Error")) {
        toast({ title: "Erro", description: data, variant: "destructive" });
      } else {
        toast({ title: "Campanha iniciada", description: "Fila de mensagens criada e envio iniciado." });
        fetchCampaigns();
      }
    } catch (error: any) {
      toast({ title: "Erro ao iniciar campanha", description: error.message, variant: "destructive" });
    }
  };

  const pauseCampaign = async (id: string) => {
    try {
      const { error } = await supabase.from("campaigns").update({ status: "paused" }).eq("id", id);
      if (error) throw error;
      toast({ title: "Campanha pausada", description: "Envio da campanha pausado." });
      fetchCampaigns();
    } catch (error: any) {
      toast({ title: "Erro ao pausar campanha", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Campanhas</h2>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          onClick={() => setShowCreateForm(true)}
        >
          Criar Nova Campanha
        </button>
      </div>

      {showCreateForm ? (
        <CampaignForm
          newCampaign={newCampaign}
          setNewCampaign={setNewCampaign}
          mediaUrl={mediaUrl}
          setMediaUrl={setMediaUrl}
          contactSource="supabase"
          setContactSource={() => {}}
          googleConnected={false}
          googleSheetName={null}
          handleConnectGoogle={() => {}}
          setGoogleConnected={() => {}}
          setGoogleSheetName={() => {}}
          supabaseGroups={contactGroups}
          googleSheetGroups={[]}
          selectedGroup={selectedGroup}
          setSelectedGroup={setSelectedGroup}
          createCampaign={createCampaign}
          instances={instances}
          selectedInstanceId={selectedInstanceId}
          setSelectedInstanceId={setSelectedInstanceId}
        />
      ) : (
        <>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Carregando campanhas...</div>
          ) : (
            <CampaignList
              campaigns={campaigns}
              deleteCampaign={deleteCampaign}
              getStatusColor={(status) => {
                switch (status) {
                  case "sending": return "bg-blue-100 text-blue-800";
                  case "scheduled": return "bg-yellow-100 text-yellow-800";
                  case "completed": return "bg-green-100 text-green-800";
                  case "paused": return "bg-orange-100 text-orange-800";
                  case "draft": return "bg-gray-100 text-gray-800";
                  default: return "bg-gray-100 text-gray-800";
                }
              }}
              getStatusText={(status) => {
                switch (status) {
                  case "sending": return "Enviando";
                  case "scheduled": return "Agendada";
                  case "completed": return "Concluída";
                  case "paused": return "Pausada";
                  case "draft": return "Rascunho";
                  default: return status;
                }
              }}
              onStartCampaign={startCampaign}
              onPauseCampaign={pauseCampaign}
              onShowDetails={setDetailsCampaignId}
            />
          )}
        </>
      )}

      <CampaignDetailsModal
        campaignId={detailsCampaignId}
        open={!!detailsCampaignId}
        onOpenChange={(open) => !open && setDetailsCampaignId(null)}
      />
    </div>
  );
};

export default CampaignsManager;