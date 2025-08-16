
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Send, Bot, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import AiMessageGenerator from "./AiMessageGenerator";
import MessagePreview from "./MessagePreview";

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

interface CampaignFormProps {
  newCampaign: { name: string; message: string };
  setNewCampaign: (campaign: { name: string; message: string }) => void;
  mediaUrl: string | null;
  setMediaUrl: (url: string | null) => void;
  contactSource: string;
  setContactSource: (source: string) => void;
  googleConnected: boolean;
  googleSheetName: string | null;
  handleConnectGoogle: () => void;
  setGoogleConnected: (connected: boolean) => void;
  setGoogleSheetName: (name: string | null) => void;
  supabaseGroups: string[];
  googleSheetGroups: string[];
  selectedGroup: string;
  setSelectedGroup: (group: string) => void;
  createCampaign: (
    sendingMethod: "batch" | "queue" | "qstash",
    intervalConfig?: any[],
    scheduledFor?: string,
    qstashWebhookUrl?: string
  ) => void;
  instances: any[];
  selectedInstanceId: string;
  setSelectedInstanceId: (id: string) => void;
}

const CampaignForm: React.FC<CampaignFormProps> = ({
  newCampaign,
  setNewCampaign,
  mediaUrl,
  setMediaUrl,
  contactSource,
  setContactSource,
  googleConnected,
  googleSheetName,
  handleConnectGoogle,
  setGoogleConnected,
  setGoogleSheetName,
  supabaseGroups,
  googleSheetGroups,
  selectedGroup,
  setSelectedGroup,
  createCampaign,
  instances,
  selectedInstanceId,
  setSelectedInstanceId,
}) => {
  const [sendingMethod, setSendingMethod] = useState<"batch" | "queue" | "qstash">("batch");
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [qstashWebhookUrl, setQstashWebhookUrl] = useState("");
  const [intervalConfig, setIntervalConfig] = useState([
    { quantity: 10, min: 5, max: 10 }
  ]);
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const { subscription } = useUserSubscription();

  useEffect(() => {
    if (contactSource === "google" && !googleConnected) {
      toast("Conecte-se ao Google para selecionar um grupo.", {
        description: "Atenção"
      });
    }
  }, [contactSource, googleConnected]);

  const handleSubmit = () => {
    if (!scheduledDateTime) {
      toast.error("Data e hora de agendamento são obrigatórias.");
      return;
    }

    if (sendingMethod === 'qstash' && (!qstashWebhookUrl || !qstashWebhookUrl.trim())) {
      toast.error("URL do webhook é obrigatória para envio via QStash.");
      return;
    }

    const scheduledForISO = new Date(scheduledDateTime).toISOString();
    createCampaign(sendingMethod, intervalConfig, scheduledForISO, qstashWebhookUrl);
  };

  // Verificar se o usuário tem acesso aos métodos avançados
  const hasQueueAccess = subscription?.plan?.enable_queue_sending || false;
  const hasQStashAccess = subscription?.plan?.enable_qstash_sending || false;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Criar Nova Campanha</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instância */}
        <div>
          <Label htmlFor="instance" className="text-card-foreground">Instância do WhatsApp</Label>
          <Select value={selectedInstanceId} onValueChange={setSelectedInstanceId}>
            <SelectTrigger className="bg-input border-border text-foreground">
              <SelectValue placeholder="Selecione uma instância" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {instances.map((instance) => (
                <SelectItem key={instance.id} value={instance.id} className="text-popover-foreground">
                  {instance.instance_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Nome da Campanha */}
        <div>
          <Label htmlFor="campaign-name" className="text-card-foreground">Nome da Campanha</Label>
          <Input
            id="campaign-name"
            value={newCampaign.name}
            onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
            placeholder="Digite o nome da campanha"
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Método de Envio */}
        <div>
          <Label className="text-card-foreground">Método de Envio</Label>
          <Tabs value={sendingMethod} onValueChange={(value) => setSendingMethod(value as any)} className="mt-2">
            <TabsList className="grid w-full grid-cols-3 bg-muted">
              <TabsTrigger value="batch" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                <Send className="h-4 w-4 mr-2" />
                Padrão
              </TabsTrigger>
              <TabsTrigger 
                value="queue" 
                disabled={!hasQueueAccess}
                className="data-[state=active]:bg-background data-[state=active]:text-foreground disabled:opacity-50"
              >
                <Clock className="h-4 w-4 mr-2" />
                Fila Avançada
                {!hasQueueAccess && <Badge variant="secondary" className="ml-2">Pro</Badge>}
              </TabsTrigger>
              <TabsTrigger 
                value="qstash" 
                disabled={!hasQStashAccess}
                className="data-[state=active]:bg-background data-[state=active]:text-foreground disabled:opacity-50"
              >
                <Zap className="h-4 w-4 mr-2" />
                QStash
                {!hasQStashAccess && <Badge variant="secondary" className="ml-2">Premium</Badge>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="batch" className="space-y-4 mt-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-card-foreground mb-2">Envio Padrão</h4>
                <p className="text-sm text-muted-foreground">
                  Envio sequencial simples com intervalo fixo entre mensagens.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="queue" className="space-y-4 mt-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-card-foreground mb-2">Fila Avançada</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Envio com intervalos aleatórios para simular comportamento humano.
                </p>
                
                {/* Configuração de Intervalos */}
                {intervalConfig.map((config, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4 p-4 bg-background rounded border border-border">
                    <div>
                      <Label className="text-xs text-muted-foreground">Quantidade</Label>
                      <Input
                        type="number"
                        min="1"
                        value={config.quantity}
                        onChange={(e) => {
                          const newConfig = [...intervalConfig];
                          newConfig[index].quantity = parseInt(e.target.value) || 1;
                          setIntervalConfig(newConfig);
                        }}
                        className="bg-input border-border text-foreground"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Min (segundos)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={config.min}
                        onChange={(e) => {
                          const newConfig = [...intervalConfig];
                          newConfig[index].min = parseInt(e.target.value) || 1;
                          setIntervalConfig(newConfig);
                        }}
                        className="bg-input border-border text-foreground"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Max (segundos)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={config.max}
                        onChange={(e) => {
                          const newConfig = [...intervalConfig];
                          newConfig[index].max = parseInt(e.target.value) || 1;
                          setIntervalConfig(newConfig);
                        }}
                        className="bg-input border-border text-foreground"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="qstash" className="space-y-4 mt-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-card-foreground mb-2">QStash Premium</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Envio via QStash com intervalos aleatórios e alta confiabilidade.
                </p>
                
                {/* URL do Webhook */}
                <div>
                  <Label htmlFor="qstash-webhook" className="text-card-foreground">URL do Webhook (Callback)</Label>
                  <Input
                    id="qstash-webhook"
                    value={qstashWebhookUrl}
                    onChange={(e) => setQstashWebhookUrl(e.target.value)}
                    placeholder="https://webhook.site/your-unique-url"
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL para receber callbacks do QStash (pode ser n8n, webhook.site, etc.)
                  </p>
                </div>

                {/* Configuração de Intervalos para QStash */}
                {intervalConfig.map((config, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4 p-4 bg-background rounded border border-border">
                    <div>
                      <Label className="text-xs text-muted-foreground">Quantidade</Label>
                      <Input
                        type="number"
                        min="1"
                        value={config.quantity}
                        onChange={(e) => {
                          const newConfig = [...intervalConfig];
                          newConfig[index].quantity = parseInt(e.target.value) || 1;
                          setIntervalConfig(newConfig);
                        }}
                        className="bg-input border-border text-foreground"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Min (segundos)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={config.min}
                        onChange={(e) => {
                          const newConfig = [...intervalConfig];
                          newConfig[index].min = parseInt(e.target.value) || 1;
                          setIntervalConfig(newConfig);
                        }}
                        className="bg-input border-border text-foreground"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Max (segundos)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={config.max}
                        onChange={(e) => {
                          const newConfig = [...intervalConfig];
                          newConfig[index].max = parseInt(e.target.value) || 1;
                          setIntervalConfig(newConfig);
                        }}
                        className="bg-input border-border text-foreground"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Data e Hora de Agendamento */}
        <div>
          <Label htmlFor="scheduled-datetime" className="text-card-foreground">
            <Calendar className="h-4 w-4 inline mr-2" />
            Data e Hora de Agendamento (obrigatório)
          </Label>
          <Input
            id="scheduled-datetime"
            type="datetime-local"
            value={scheduledDateTime}
            onChange={(e) => setScheduledDateTime(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="bg-input border-border text-foreground"
          />
        </div>

        {/* Seleção de Grupo */}
        <div>
          <Label className="text-card-foreground">Grupo de Contatos</Label>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="bg-input border-border text-foreground">
              <SelectValue placeholder="Selecione um grupo" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {supabaseGroups.map((group) => (
                <SelectItem key={group} value={group} className="text-popover-foreground">
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mensagem */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="campaign-message" className="text-card-foreground">Mensagem</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAiGenerator(!showAiGenerator)}
              className="border-border text-foreground hover:bg-accent"
            >
              <Bot className="h-4 w-4 mr-2" />
              IA
            </Button>
          </div>
          
          {showAiGenerator && (
            <div className="mb-4">
              <AiMessageGenerator
                onMessageGenerated={(message) => {
                  setNewCampaign({ ...newCampaign, message });
                  setShowAiGenerator(false);
                }}
              />
            </div>
          )}
          
          <Textarea
            id="campaign-message"
            value={newCampaign.message}
            onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })}
            placeholder="Digite sua mensagem aqui... Use {{nome}} para personalizar com o nome do contato."
            className="min-h-32 bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Preview da Mensagem */}
        <MessagePreview 
          message={newCampaign.message}
          messageType="text"
          mediaPreview={mediaUrl}
        />

        {/* Mídia */}
        <div>
          <Label htmlFor="media-url" className="text-card-foreground">URL da Mídia (opcional)</Label>
          <Input
            id="media-url"
            value={mediaUrl || ""}
            onChange={(e) => setMediaUrl(e.target.value || null)}
            placeholder="https://exemplo.com/imagem.jpg"
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <Button 
            onClick={handleSubmit}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="h-4 w-4 mr-2" />
            Criar Campanha
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignForm;
