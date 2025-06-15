
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Plus, Play, Pause, Trash2 } from "lucide-react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import CampaignForm from "./CampaignForm";
import CampaignList from "./CampaignList";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

const GOOGLE_STORAGE_KEY = "googleContactsSheetId";

interface CampaignsManagerProps {
  contactGroups: string[];
}

interface CampaignDB {
  id: string;
  name: string;
  message: string;
  status: string;
  sent: number;
  total: number;
  group?: string;
  created_at?: string;
}

const CampaignsManager: React.FC<CampaignsManagerProps> = ({ contactGroups }) => {
  const [campaigns, setCampaigns] = useState<CampaignDB[]>([]);
  const [newCampaign, setNewCampaign] = useState({ name: "", message: "" });
  const [contactSource, setContactSource] = useState<"supabase" | "google">("supabase");
  const [googleConnected, setGoogleConnected] = useState<boolean>(false);
  const [googleSheetName, setGoogleSheetName] = useState<string | null>(null);
  const [scheduleType, setScheduleType] = useState<"once" | "recurring">("once");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [recurringInterval, setRecurringInterval] = useState<number>(7);
  const [selectedGroup, setSelectedGroup] = useState("Todos os contatos");
  const { toast } = useToast();
  const { user } = useAuth();

  // Substituir supabaseGroups pelo prop contactGroups:
  const supabaseGroups = contactGroups.length > 0 ? contactGroups : ["Todos os contatos"];
  const googleSheetGroups = ["Todos os contatos", "Ativos", "Leads", "Pós-venda"];

  useEffect(() => {
    const sheetId = localStorage.getItem(GOOGLE_STORAGE_KEY);
    if (sheetId) {
      setGoogleConnected(true);
      setGoogleSheetName(sheetId);
    }
  }, []);

  // Buscar campanhas reais do Supabase
  useEffect(() => {
    async function fetchCampaigns() {
      if (!user) return;
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        toast({
          title: "Erro ao buscar campanhas",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      // Adaptar os dados para exibir corretamente na lista
      const formatted = (data || []).map(c => ({
        id: c.id,
        name: c.name,
        message: c.message,
        status: c.status || "draft",
        sent: 0,
        total: 0,
        group: c.group,
        created_at: c.created_at,
      }));
      setCampaigns(formatted);
    }
    fetchCampaigns();
  }, [user, toast]);

  const handleConnectGoogle = () => {
    const fakeSheetId = "MinhaPlanilhaContatosGoogle";
    setGoogleConnected(true);
    setGoogleSheetName(fakeSheetId);
    localStorage.setItem(GOOGLE_STORAGE_KEY, fakeSheetId);
    toast({
      title: "Google Sheets conectado",
      description: "Planilha de contatos vinculada com sucesso.",
    });
  };

  const createCampaign = async () => {
    if (!newCampaign.name || !newCampaign.message) {
      toast({
        title: "Erro",
        description: "Nome e mensagem são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "É necessário estar logado para criar campanha.",
        variant: "destructive",
      });
      return;
    }

    // Salva a campanha no Supabase
    const insertObj: any = {
      user_id: user.id,
      name: newCampaign.name,
      message: newCampaign.message,
      status: "draft",
      sent: 0,
      total: 0,
      group: selectedGroup,
      schedule_type: scheduleType,
      schedule_date: scheduleDate,
      schedule_time: scheduleTime,
      recurring_interval: scheduleType === "recurring" ? recurringInterval : null,
      googleSheetName: contactSource === "google" ? googleSheetName : null,
    };

    const { data, error } = await supabase
      .from("campaigns")
      .insert([insertObj])
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro",
        description: `Erro ao criar campanha: ${error.message}`,
        variant: "destructive",
      });
      return;
    }

    // Refaz busca após inserir nova campanha
    setNewCampaign({ name: "", message: "" });
    setSelectedGroup("Todos os contatos");

    toast({
      title: "Campanha criada",
      description: `Campanha ${newCampaign.name} criada com sucesso`,
    });

    // Atualiza lista local
    setCampaigns(prev => [
      {
        id: data.id,
        name: data.name,
        message: data.message,
        status: data.status || "draft",
        sent: 0,
        total: 0,
        group: data.group,
        created_at: data.created_at,
      },
      ...prev,
    ]);
  };

  const deleteCampaign = async (id: string) => {
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) {
      toast({
        title: "Erro ao remover campanha",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setCampaigns(campaigns.filter(campaign => campaign.id !== id));
    toast({
      title: "Campanha removida",
      description: "Campanha deletada com sucesso",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Ativa";
      case "paused":
        return "Pausada";
      case "completed":
        return "Concluída";
      case "draft":
        return "Rascunho";
      default:
        return "Desconhecido";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Send className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Campanhas</h2>
        </div>
      </div>

      {/* Criar Nova Campanha */}
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
        supabaseGroups={supabaseGroups}
        googleSheetGroups={googleSheetGroups}
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
      />

      {/* Lista de Campanhas */}
      <CampaignList
        campaigns={campaigns}
        deleteCampaign={deleteCampaign}
        getStatusColor={getStatusColor}
        getStatusText={getStatusText}
      />
    </div>
  );
};

export default CampaignsManager;

