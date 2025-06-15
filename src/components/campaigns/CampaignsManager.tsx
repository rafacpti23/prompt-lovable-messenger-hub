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

const GOOGLE_STORAGE_KEY = "googleContactsSheetId";

const CampaignsManager = () => {
  const [campaigns, setCampaigns] = useState([
    {
      id: 1,
      name: "Promoção Black Friday",
      message: "Não perca nossa super promoção! Descontos de até 50%",
      status: "active",
      sent: 150,
      total: 200,
      group: "Todos os contatos"
    },
    {
      id: 2,
      name: "Lembrete Consulta",
      message: "Lembrete: Sua consulta está agendada para amanhã",
      status: "paused",
      sent: 45,
      total: 100,
      group: "Clientes"
    }
  ]);
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

  const supabaseGroups = ["Todos os contatos", "Clientes", "Prospects", "VIP"];
  const googleSheetGroups = ["Todos os contatos", "Ativos", "Leads", "Pós-venda"];

  useEffect(() => {
    const sheetId = localStorage.getItem(GOOGLE_STORAGE_KEY);
    if (sheetId) {
      setGoogleConnected(true);
      setGoogleSheetName(sheetId);
    }
  }, []);

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

  const createCampaign = () => {
    if (!newCampaign.name || !newCampaign.message) {
      toast({
        title: "Erro",
        description: "Nome e mensagem são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const campaign = {
      id: Date.now(),
      ...newCampaign,
      status: "draft" as const,
      sent: 0,
      total: 0,
      contactSource,
      group: selectedGroup,
      schedule: {
        type: scheduleType,
        date: scheduleDate,
        time: scheduleTime,
        intervalDays: scheduleType === "recurring" ? recurringInterval : undefined,
      },
      googleSheetName: contactSource === "google" ? googleSheetName : undefined,
    };

    setCampaigns([...campaigns, campaign]);
    setNewCampaign({ name: "", message: "" });
    setSelectedGroup("Todos os contatos");

    toast({
      title: "Campanha criada",
      description: `Campanha ${newCampaign.name} criada com sucesso`,
    });
  };

  const deleteCampaign = (id: number) => {
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
