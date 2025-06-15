import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Plus, Play, Pause, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const GOOGLE_STORAGE_KEY = "googleContactsSheetId";

const CampaignsManager = () => {
  const [campaigns, setCampaigns] = useState([
    {
      id: 1,
      name: "Promoção Black Friday",
      message: "Não perca nossa super promoção! Descontos de até 50%",
      status: "active",
      sent: 150,
      total: 200
    },
    {
      id: 2,
      name: "Lembrete Consulta",
      message: "Lembrete: Sua consulta está agendada para amanhã",
      status: "paused",
      sent: 45,
      total: 100
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
  const { toast } = useToast();

  // simulação: efeito para recuperar do localStorage a planilha do usuário
  useEffect(() => {
    const sheetId = localStorage.getItem(GOOGLE_STORAGE_KEY);
    if (sheetId) {
      setGoogleConnected(true);
      setGoogleSheetName(sheetId);
    }
  }, []);

  // simulação: conectar Google (aqui só define sheet id/nome, integração virá depois)
  const handleConnectGoogle = () => {
    // abrir OAuth aqui de verdade (futuro)
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Criar Nova Campanha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">

            {/* Seleção da base de contatos */}
            <div>
              <label className="block font-medium mb-2">Fonte de contatos:</label>
              <div className="flex space-x-3">
                <Button
                  variant={contactSource === "supabase" ? "default" : "outline"}
                  onClick={() => setContactSource("supabase")}
                  type="button"
                >
                  Supabase
                  {contactSource === "supabase" && <Badge variant="secondary" className="ml-2">Selecionado</Badge>}
                </Button>
                <Button
                  variant={contactSource === "google" ? "default" : "outline"}
                  onClick={() => setContactSource("google")}
                  type="button"
                >
                  Google Sheets
                  {contactSource === "google" && <Badge variant="secondary" className="ml-2">Selecionado</Badge>}
                </Button>
              </div>
              {contactSource === "google" && (
                <div className="mt-3 space-y-1">
                  {googleConnected && googleSheetName ? (
                    <div className="flex items-center space-x-2 text-green-700">
                      <span className="font-semibold">Planilha conectada:</span>
                      <span>{googleSheetName}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setGoogleConnected(false);
                          setGoogleSheetName(null);
                          localStorage.removeItem(GOOGLE_STORAGE_KEY);
                        }}
                        className="ml-2"
                      >
                        Trocar Planilha
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={handleConnectGoogle}
                      type="button"
                    >
                      Conectar Google Sheets
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Nome e mensagem da campanha */}
            <Input
              placeholder="Nome da campanha"
              value={newCampaign.name}
              onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
            />
            <Textarea
              placeholder="Mensagem da campanha"
              value={newCampaign.message}
              onChange={(e) => setNewCampaign({...newCampaign, message: e.target.value})}
              rows={4}
            />

            {/* Agendamento */}
            <div>
              <label className="block font-medium mb-2">Agendamento:</label>
              <div className="flex items-center space-x-4 mb-2">
                <Button
                  variant={scheduleType === "once" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setScheduleType("once")}
                  type="button"
                >
                  Único (escolher data/hora)
                </Button>
                <Button
                  variant={scheduleType === "recurring" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setScheduleType("recurring")}
                  type="button"
                >
                  Recorrente (a cada X dias)
                </Button>
              </div>
              {scheduleType === "once" ? (
                <div className="flex gap-3">
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    className="w-40"
                  />
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    className="w-32"
                  />
                </div>
              ) : (
                <div className="flex gap-3 items-center">
                  <Input
                    type="number"
                    min={1}
                    value={recurringInterval}
                    onChange={e => setRecurringInterval(Number(e.target.value))}
                    className="w-24"
                  />
                  <span>dias</span>
                  <span className="text-muted-foreground text-xs">(ex: a cada 7 dias)</span>
                </div>
              )}
            </div>

            {/* Botão criar campanha */}
            <Button onClick={createCampaign}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Campanha
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Campanhas */}
      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{campaign.name}</h3>
                    <Badge className={getStatusColor(campaign.status)}>
                      {getStatusText(campaign.status)}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-3">{campaign.message}</p>
                  {campaign.total > 0 && (
                    <div className="text-sm text-gray-500">
                      Progresso: {campaign.sent} de {campaign.total} mensagens enviadas
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {campaign.status === "draft" && (
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Iniciar
                    </Button>
                  )}
                  {campaign.status === "active" && (
                    <Button variant="outline" size="sm">
                      <Pause className="h-4 w-4 mr-2" />
                      Pausar
                    </Button>
                  )}
                  {campaign.status === "paused" && (
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Retomar
                    </Button>
                  )}
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => deleteCampaign(campaign.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CampaignsManager;
