import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

interface CampaignsManagerProps {
  contactGroups: string[];
}

const CampaignsManager: React.FC<CampaignsManagerProps> = ({ contactGroups }) => {
  const { user } = useAuth();
  const [newCampaign, setNewCampaign] = useState({ name: "", message: "" });
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

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
      // Aqui você pode adicionar lógica para limpar o formulário ou atualizar a lista de campanhas
    } catch (error: any) {
      toast({
        title: "Erro ao criar campanha",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      {/* Aqui você pode adicionar o formulário e a lista de campanhas */}
      <h2 className="text-2xl font-bold mb-4">Gerenciar Campanhas</h2>
      {/* Formulário e outros componentes */}
    </div>
  );
};

export default CampaignsManager;