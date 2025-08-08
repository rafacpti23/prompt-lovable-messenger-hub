import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Upload, X, Image, Brain, Zap, Clock, Trash2 } from "lucide-react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import MessagePreview from "./MessagePreview";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import MediaRepository from "@/components/media/MediaRepository";
import AiMessageGenerator from "./AiMessageGenerator";
import { useUserSubscription } from "@/hooks/useUserSubscription";

interface Instance {
  id: string;
  instance_name: string;
  status: string | null;
}

interface Interval {
  min: number;
  max: number;
}

interface CampaignFormProps {
  newCampaign: { name: string; message: string };
  setNewCampaign: (c: { name: string; message: string }) => void;
  mediaUrl: string | null;
  setMediaUrl: (url: string | null) => void;
  contactSource: "supabase" | "google";
  setContactSource: (source: "supabase" | "google") => void;
  googleConnected: boolean;
  googleSheetName: string | null;
  handleConnectGoogle: () => void;
  setGoogleConnected: (connected: boolean) => void;
  setGoogleSheetName: (name: string | null) => void;
  supabaseGroups: string[];
  googleSheetGroups: string[];
  selectedGroup: string;
  setSelectedGroup: (g: string) => void;
  createCampaign: (sendingMethod: 'batch' | 'queue', intervalConfig?: Interval[], scheduledFor?: string) => void;
  instances: Instance[];
  selectedInstanceId: string;
  setSelectedInstanceId: (id: string) => void;
}

const GOOGLE_STORAGE_KEY = "googleContactsSheetId";

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
  const [messageType, setMessageType] = useState<"text" | "image" | "video">("text");
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [showMediaRepository, setShowMediaRepository] = useState(false);
  const { subscription } = useUserSubscription();
  const [sendingMethod, setSendingMethod] = useState<'batch' | 'queue'>('batch');
  const [intervals, setIntervals] = useState<Interval[]>([{ min: 3, max: 8 }]);
  const [scheduledForLocal, setScheduledForLocal] = useState<string>(""); // Renamed to scheduledForLocal

  const canUseQueueSending = subscription?.plan?.enable_queue_sending ?? false;

  const handleIntervalChange = (index: number, field: 'min' | 'max', value: string) => {
    const newIntervals = [...intervals];
    newIntervals[index][field] = parseInt(value, 10) || 0;
    setIntervals(newIntervals);
  };

  const addInterval = () => {
    if (intervals.length < 4) {
      setIntervals([...intervals, { min: 10, max: 20 }]);
    }
  };

  const removeInterval = (index: number) => {
    if (intervals.length > 1) {
      const newIntervals = intervals.filter((_, i) => i !== index);
      setIntervals(newIntervals);
    }
  };

  const removeMedia = () => {
    setMediaUrl(null);
    setMediaPreview("");
  };

  const handleSelectFromRepository = (media: any) => {
    setMediaUrl(media.file_url);
    setMediaPreview(media.file_url);
    setMessageType(media.file_type.startsWith('image') ? 'image' : 'video');
    setShowMediaRepository(false);
  };

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea[placeholder^="Digite sua mensagem"]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const newText = text.substring(0, start) + variable + text.substring(end);
      setNewCampaign({...newCampaign, message: newText});
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const isFormValid = () => {
    const hasScheduledFor = scheduledForLocal && new Date(scheduledForLocal) > new Date();
    return (
      selectedInstanceId &&
      newCampaign.name.trim() &&
      selectedGroup &&
      hasScheduledFor &&
      (messageType === "text" ? newCampaign.message.trim() : mediaUrl)
    );
  };

  const handleCreateCampaign = () => {
    const scheduledForUTC = scheduledForLocal ? new Date(scheduledForLocal).toISOString() : undefined;
    createCampaign(sendingMethod, sendingMethod === 'queue' ? intervals : undefined, scheduledForUTC);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Criar Nova Campanha
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Instância */}
          <div>
            <label className="block font-medium mb-2">Instância WhatsApp *</label>
            <Select value={selectedInstanceId} onValueChange={setSelectedInstanceId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma instância" />
              </SelectTrigger>
              <SelectContent>
                {instances.map((instance) => (
                  <SelectItem key={instance.id} value={instance.id}>
                    {instance.instance_name} ({instance.status || 'Desconectado'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fonte de Contatos */}
          <div>
            <label className="block font-medium mb-2">Fonte de Contatos *</label>
            <div className="flex gap-2">
              <Button
                variant={contactSource === "supabase" ? "default" : "outline"}
                onClick={() => setContactSource("supabase")}
                type="button"
              >
                Contatos do Sistema
              </Button>
              <Button
                variant={contactSource === "google" ? "default" : "outline"}
                onClick={() => setContactSource("google")}
                type="button"
                disabled={!canUseQueueSending}
              >
                Planilha Google
              </Button>
            </div>
          </div>

          {/* Grupo */}
          <div>
            <label className="block font-medium mb-2">Grupo de Contatos *</label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                {(contactSource === "supabase" ? supabaseGroups : googleSheetGroups)
                  .filter(group => group && group.trim() !== "")
                  .map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data e Hora de Agendamento */}
          <div>
            <label className="block font-medium mb-2">Data e Hora de Agendamento *</label>
            <Input
              type="datetime-local"
              value={scheduledForLocal}
              onChange={(e) => setScheduledForLocal(e.target.value)}
              min={new Date().toISOString().slice(0,16)}
            />
          </div>

          {/* Nome da Campanha */}
          <div>
            <label className="block font-medium mb-2">Nome da Campanha *</label>
            <Input
              placeholder="Ex: Promoção de Verão"
              value={newCampaign.name}
              onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
            />
          </div>

          {/* Tipo de Mensagem */}
          <div>
            <label className="block font-medium mb-2">Tipo de Mensagem *</label>
            <div className="flex gap-2">
              <Button
                variant={messageType === "text" ? "default" : "outline"}
                onClick={() => setMessageType("text")}
                type="button"
              >
                <Brain className="h-4 w-4 mr-2" />
                Texto
              </Button>
              <Button
                variant={messageType === "image" ? "default" : "outline"}
                onClick={() => setMessageType("image")}
                type="button"
                disabled={!mediaUrl}
              >
                <Image className="h-4 w-4 mr-2" />
                Imagem
              </Button>
              <Button
                variant={messageType === "video" ? "default" : "outline"}
                onClick={() => setMessageType("video")}
                type="button"
                disabled={!mediaUrl}
              >
                <Image className="h-4 w-4 mr-2" />
                Vídeo
              </Button>
            </div>
          </div>

          {/* Mídia */}
          {messageType !== "text" && (
            <div>
              <label className="block font-medium mb-2">Arquivo de Mídia *</label>
              {mediaUrl ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2 border rounded bg-muted">
                    <p className="text-sm truncate">{mediaUrl.split('/').pop()}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={removeMedia}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowMediaRepository(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Escolher do Repositório
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Mensagem */}
          <div>
            <label className="block font-medium mb-2">Mensagem da Campanha *</label>
            <Textarea
              placeholder={`Digite sua mensagem aqui. Use {{nome}} para personalizar com o nome do contato.${messageType === "text" ? "\n\nEx: Olá {{nome}}, temos uma oferta especial para você!" : ""}`}
              value={newCampaign.message}
              onChange={(e) => setNewCampaign({...newCampaign, message: e.target.value})}
              rows={4}
            />
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => insertVariable("{{nome}}")}>
                {"Inserir {{nome}}"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => insertVariable("{{telefone}}")}>
                {"Inserir {{telefone}}"}
              </Button>
            </div>
          </div>

          {/* Método de Envio */}
          {canUseQueueSending && (
            <div>
              <label className="block font-medium mb-2">Método de Envio:</label>
              <div className="flex gap-2">
                <Button
                  variant={sendingMethod === 'batch' ? 'default' : 'outline'}
                  onClick={() => setSendingMethod('batch')}
                  type="button"
                  className="flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" /> Padrão (Agendado)
                </Button>
                <Button
                  variant={sendingMethod === 'queue' ? 'default' : 'outline'}
                  onClick={() => setSendingMethod('queue')}
                  type="button"
                  className="flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" /> Avançado (Fila Aleatória)
                </Button>
              </div>
              {sendingMethod === 'queue' && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/50 space-y-3">
                  <h4 className="font-semibold text-sm">Configurar Intervalos Aleatórios (segundos)</h4>
                  {intervals.map((interval, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={interval.min}
                        onChange={(e) => handleIntervalChange(index, 'min', e.target.value)}
                        className="w-20"
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={interval.max}
                        onChange={(e) => handleIntervalChange(index, 'max', e.target.value)}
                        className="w-20"
                      />
                      {intervals.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeInterval(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {intervals.length < 4 && (
                    <Button variant="outline" size="sm" onClick={addInterval}>
                      <Plus className="h-4 w-4 mr-2" /> Adicionar Faixa de Tempo
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">O sistema escolherá aleatoriamente uma das faixas e um tempo dentro dela para cada mensagem.</p>
                </div>
              )}
            </div>
          )}

          {/* Botão criar campanha */}
          <Button 
            onClick={handleCreateCampaign} // Call the new handler
            disabled={!isFormValid()}
            className={!isFormValid() ? "opacity-50 cursor-not-allowed" : ""}
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar e Agendar Campanha
          </Button>
          
          {!isFormValid() && (
            <p className="text-sm text-red-500">
              * Campos obrigatórios: Instância, Nome, Grupo, Data e Hora de Agendamento, {messageType === "text" ? "Mensagem" : "Arquivo de mídia"}
            </p>
          )}
        </div>

        {/* Modal do Repositório de Mídia */}
        <Dialog open={showMediaRepository} onOpenChange={setShowMediaRepository}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Repositório de Mídia</DialogTitle>
            </DialogHeader>
            <MediaRepository
              onSelectMedia={handleSelectFromRepository}
              selectionMode={true}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CampaignForm;