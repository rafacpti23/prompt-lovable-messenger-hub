import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import CampaignForm from "./CampaignForm";
import CampaignList from "./CampaignList";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CampaignDB {
  id: string;
  name: string;
  message: string;
  status: string;
  created_at?: string;
  sent: number;
  total: number;
}

interface Instance {
  id: string;
  instance_name: string;
  status: string | null;
  phone_number?: string | null;
  user_id: string;
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
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loadingInstances, setLoadingInstances] = useState(true);

  const { toast } = useToast();

  // Busca e mantém instâncias do Supabase atualizadas em tempo real
  useEffect(() => {
    let channel: any;
    async function fetchAndSubscribeInstances() {
      setLoadingInstances(true);
      const { data, error } = await supabase
        .from("instances")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setInstances(data);
      setLoadingInstances(false);
      channel = supabase
        .channel('public:instances:campaigns')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'instances' },
          (payload) => {
            fetchAndSubscribeInstances();
          }
        )
        .subscribe();
    }
    fetchAndSubscribeInstances();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Estado centralizado para campanhas
  const [campaigns, setCampaigns] = useState<CampaignDB[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  // Busca campanhas do Supabase
  useEffect(() => {
    async function fetchCampaigns() {
      setLoadingCampaigns(true);
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        // Mapeia os dados do banco para o formato esperado por CampaignList
        const mappedCampaigns = data.map((campaign) => ({
          id: campaign.id,
          name: campaign.name,
          message: campaign.message,
          status: campaign.status || "draft",
          created_at: campaign.created_at,
          sent: 0, // Valor padrão, ajuste conforme necessário
          total: 0, // Valor padrão, ajuste conforme necessário
        }));
        setCampaigns(mappedCampaigns);
      }
      setLoadingCampaigns(false);
    }
    fetchCampaigns();
  }, []);

  useEffect(() => {
    const sheetId = localStorage.getItem(GOOGLE_STORAGE_KEY);
    if (sheetId) {
      setGoogleConnected(true);
      setGoogleSheetName(sheetId);
    }
  }, []);

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

    if (!selectedInstanceId) {
      toast({
        title: "Selecione uma instância",
        description: "É preciso escolher uma instância conectada.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Primeiro busca o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "É necessário estar logado para criar campanha.",
          variant: "destructive",
        });
        return;
      }

      // Busca todos os contatos do usuário para popular contact_ids
      const { data: contacts, error: contactsError } = await supabase
        .from("contacts")
        .select("id")
        .eq("user_id", user.id);

      if (contactsError) {
        toast({
          title: "Erro ao buscar contatos",
          description: contactsError.message,
          variant: "destructive",
        });
        return;
      }

      const contactIds = contacts ? contacts.map(c => c.id) : [];

      if (contactIds.length === 0) {
        toast({
          title: "Nenhum contato encontrado",
          description: "Adicione contatos antes de criar uma campanha.",
          variant: "destructive",
        });
        return;
      }

      // Calcula o horário agendado se fornecido
      let scheduledForUTC = null;
      if (scheduleDate && scheduleTime) {
        // Cria o datetime com base na data e hora fornecidas (horário de Brasília)
        const brasilDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
        
        // Adiciona 3 horas para converter de Brasília para UTC
        const utcDateTime = new Date(brasilDateTime.getTime() + (3 * 60 * 60 * 1000));
        scheduledForUTC = utcDateTime.toISOString();
        
        console.log("Horário digitado (Brasília):", brasilDateTime.toISOString());
        console.log("Horário convertido (UTC):", scheduledForUTC);
      }

      const insertObj = {
        user_id: user.id,
        name: newCampaign.name,
        message: newCampaign.message,
        status: "draft",
        instance_id: selectedInstanceId,
        contact_ids: contactIds,
        scheduled_for: scheduledForUTC,
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

      // Criar scheduled_messages para cada contato
      const scheduledMessages = contactIds.map(contactId => ({
        campaign_id: data.id,
        contact_id: contactId,
        phone: "", // Será preenchido pela Edge Function
        message: newCampaign.message,
        scheduled_for: scheduledForUTC || new Date().toISOString(),
      }));

      const { error: scheduleError } = await supabase
        .from("scheduled_messages")
        .insert(scheduledMessages);

      if (scheduleError) {
        console.warn("Erro ao criar mensagens agendadas:", scheduleError);
      }

      setNewCampaign({ name: "", message: "" });
      setScheduleDate("");
      setScheduleTime("");
      setSelectedGroup("Todos os contatos");
      
      const messageText = scheduledForUTC 
        ? `Campanha ${newCampaign.name} criada e agendada para ${brasilDateTime.toLocaleString('pt-BR')} (horário de Brasília)`
        : `Campanha ${newCampaign.name} criada com ${contactIds.length} contatos`;
        
      toast({
        title: "Campanha criada",
        description: messageText,
      });

      setCampaigns(prev => [
        {
          id: data.id,
          name: data.name,
          message: data.message,
          status: data.status || "draft",
          created_at: data.created_at,
          sent: 0,
          total: contactIds.length,
        },
        ...prev,
      ]);

    } catch (err: any) {
      toast({
        title: "Erro",
        description: `Erro inesperado: ${err.message}`,
        variant: "destructive",
      });
    }
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
      case "scheduled":
        return "bg-orange-100 text-orange-800";
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
      case "scheduled":
        return "Agendada";
      default:
        return "Desconhecido";
    }
  };

  // Função para iniciar campanha
  const startCampaign = async (id: string) => {
    // Busca a campanha para verificar se tem horário agendado
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("scheduled_for")
      .eq("id", id)
      .single();
    
    let scheduledForUTC;
    
    if (campaign?.scheduled_for) {
      // Se já tem horário agendado, usa ele
      scheduledForUTC = campaign.scheduled_for;
    } else {
      // Se não tem horário agendado, agenda para agora
      scheduledForUTC = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from("campaigns")
      .update({ 
        status: "scheduled", 
        scheduled_for: scheduledForUTC
      })
      .eq("id", id);
      
    if (error) {
      toast({
        title: "Erro ao iniciar campanha",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "scheduled" } : c))
    );
    
    // Converte o horário UTC para horário de Brasília para mostrar ao usuário
    const utcDate = new Date(scheduledForUTC);
    const brasilDate = new Date(utcDate.getTime() - (3 * 60 * 60 * 1000));
    
    toast({
      title: "Campanha agendada",
      description: `A campanha foi agendada para ${brasilDate.toLocaleString('pt-BR')} (horário de Brasília)`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Send className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Campanhas</h2>
        </div>
      </div>
      <CampaignForm
        newCampaign={newCampaign}
        setNewCampaign={setNewCampaign}
        contactSource={contactSource}
        setContactSource={setContactSource}
        googleConnected={googleConnected}
        googleSheetName={googleSheetName}
        handleConnectGoogle={() => {}}
        setGoogleConnected={setGoogleConnected}
        setGoogleSheetName={setGoogleSheetName}
        supabaseGroups={contactGroups.length > 0 ? contactGroups : ["Todos os contatos"]}
        googleSheetGroups={["Todos os contatos", "Ativos", "Leads", "Pós-venda"]}
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
        onStartCampaign={startCampaign}
      />
    </div>
  );
};

export default CampaignsManager;
