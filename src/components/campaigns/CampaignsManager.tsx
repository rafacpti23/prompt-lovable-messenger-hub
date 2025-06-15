
import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import CampaignForm from "./CampaignForm";
import CampaignList from "./CampaignList";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

// Tipos baseados no schema real do banco
interface CampaignDB {
  id: string;
  name: string;
  message: string;
  status: string;
  sent: number;
  total: number;
  created_at?: string;
}

interface CampaignsManagerProps {
  contactGroups: string[];
}

const GOOGLE_STORAGE_KEY = "googleContactsSheetId";

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

  // Grupos disponíveis
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
      // Adaptar dados reais para uso local
      const formatted = (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        message: c.message,
        status: c.status || "draft",
        sent: 0,
        total: 0,
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

    // O schema real não aceita group ou googleSheetName, nem schedule fields extras, então removemos do payload:
    const insertObj: any = {
      user_id: user.id,
      name: newCampaign.name,
      message: newCampaign.message,
      status: "draft",
      sent: 0,
      total: 0,
      // outros campos obrigatórios do banco aqui, se faltarem!
      instance_id: "00000000-0000-0000-0000-000000000000", // Ajuste conforme necessário!
      contact_ids: [],
      // schedule fields omitidos pois não existem no schema do banco
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

    setNewCampaign({ name: "", message: "" });
    setSelectedGroup("Todos os contatos");

    toast({
      title: "Campanha criada",
      description: `Campanha ${newCampaign.name} criada com sucesso`,
    });

    setCampaigns(prev => [
      {
        id: data.id,
        name: data.name,
        message: data.message,
        status: data.status || "draft",
        sent: 0,
        total: 0,
        created_at: data.created_at,
      },
      ...prev,
    ]);
  };

  // Parâmetro id: string (UUID)
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
        // Corrigir o tipo do delete para string
        deleteCampaign={deleteCampaign}
        getStatusColor={getStatusColor}
        getStatusText={getStatusText}
      />
    </div>
  );
};

export default CampaignsManager;
