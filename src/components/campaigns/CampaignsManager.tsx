import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import CampaignForm from "./CampaignForm";
import CampaignList from "./CampaignList";
import { useToast } from "@/hooks/use-toast";
import { useInstanceList } from "@/hooks/useInstanceList";
import { useCampaignList } from "@/hooks/useCampaignList";

// Tipos baseados no schema real do banco
interface CampaignDB {
  id: string;
  name: string;
  message: string;
  status: string;
  created_at?: string;
  // Os campos `sent` e `total` não existem no banco,
  // mas são exigidos pelo CampaignList como parte da tipagem `Campaign`.
  sent: number; // Agora obrigatório
  total: number; // Agora obrigatório
}

interface Instance {
  id: string;
  instance_name: string;
  status: string | null;
}

interface CampaignsManagerProps {
  contactGroups: string[];
}

const GOOGLE_STORAGE_KEY = "googleContactsSheetId";

const CampaignsManager: React.FC<CampaignsManagerProps> = ({ contactGroups }) => {
  const [newCampaign, setNewCampaign] = useState({ name: "", message: "" });
  const [contactSource, setContactSource] = useState<"supabase" | "google">("supabase");
  const [googleConnected, setGoogleConnected] = useState<boolean>(false);
  const [googleSheetName, setGoogleSheetName] = useState<string | null>(null);
  const [scheduleType, setScheduleType] = useState<"once" | "recurring">("once");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [recurringInterval, setRecurringInterval] = useState<number>(7);
  const [selectedGroup, setSelectedGroup] = useState("Todos os contatos");
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>("");

  const { toast } = useToast();

  // hooks customizados
  const { instances } = useInstanceList();
  const { campaigns, setCampaigns } = useCampaignList(toast);

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

  // Seleciona instância automaticamente se houver alguma
  useEffect(() => {
    if (instances.length > 0) {
      setSelectedInstanceId(instances[0].id);
    }
  }, [instances]);

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
    const user = instances[0]?.user_id; // O user_id não é mais pego pelo useAuth, então depende do Instance (pode ajustar isso se necessário)
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "É necessário estar logado para criar campanha.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedInstanceId) {
      toast({
        title: "Selecione uma instância",
        description: "É preciso escolher uma instância conectada.",
        variant: "destructive",
      });
      return;
    }
    const insertObj: any = {
      user_id: user,
      name: newCampaign.name,
      message: newCampaign.message,
      status: "draft",
      instance_id: selectedInstanceId,
      contact_ids: [],
    };
    const { supabase } = await import("@/integrations/supabase/client");
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
        created_at: data.created_at,
        sent: 0,
        total: 0,
      },
      ...prev,
    ]);
  };

  const deleteCampaign = async (id: string) => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) {
      toast({
        title: "Erro ao remover campanha",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setCampaigns((prev: any) => prev.filter((campaign: any) => campaign.id !== id));
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
        instances={instances}
        selectedInstanceId={selectedInstanceId}
        setSelectedInstanceId={setSelectedInstanceId}
      />
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
