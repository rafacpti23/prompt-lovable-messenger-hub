import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Upload, X, Image as ImageIcon, Brain, Zap, Clock, Trash2 } from "lucide-react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MediaRepository from "@/components/media/MediaRepository";
import AiMessageGenerator from "./AiMessageGenerator";
import { useUserSubscription } from "@/hooks/useUserSubscription";

interface Instance {
  id: string;
  instance_name: string;
  status: string | null;
}

interface Interval {
  quantity: number;
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

const CampaignForm: React.FC<CampaignFormProps> = ({
  newCampaign,
  setNewCampaign,
  mediaUrl,
  setMediaUrl,
  contactSource,
  setContactSource,
  supabaseGroups,
  selectedGroup,
  setSelectedGroup,
  createCampaign,
  instances,
  selectedInstanceId,
  setSelectedInstanceId,
}) => {
  const [messageType, setMessageType] = useState<"text" | "image" | "video">("text");
  const [showMediaRepository, setShowMediaRepository] = useState(false);
  const { subscription } = useUserSubscription();
  const [sendingMethod, setSendingMethod] = useState<'batch' | 'queue'>('batch');
  const [intervals, setIntervals] = useState<Interval[]>([{ quantity: 10, min: 3, max: 8 }]);
  const [scheduledForLocal, setScheduledForLocal] = useState<string>("");

  const canUseQueueSending = subscription?.plan?.enable_queue_sending ?? false;

  const handleIntervalChange = (index: number, field: keyof Interval, value: string) => {
    const newIntervals = [...intervals];
    newIntervals[index][field] = parseInt(value, 10) || 0;
    setIntervals(newIntervals);
  };

  const addInterval = () => {
    if (intervals.length < 5) {
      setIntervals([...intervals, { quantity: 10, min: 10, max: 20 }]);
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
    setMessageType("text");
  };

  const handleSelectFromRepository = (media: any) => {
    setMediaUrl(media.file_url);
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
      setNewCampaign({ ...newCampaign, message: newText });
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
      (newCampaign.message.trim() || mediaUrl)
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
      <CardContent className="space-y-4">
        {/* ... (código existente para Instância, Fonte de Contatos, Grupo) ... */}
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

          <div>
            <label className="block font-medium mb-2">Fonte de Contatos *</label>
            <Select value={contactSource} onValueChange={(value) => setContactSource(value as "supabase" | "google")}>
                <SelectTrigger>
                    <SelectValue placeholder="Selecione a fonte" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="supabase">Contatos do Sistema</SelectItem>
                    <SelectItem value="google" disabled>Planilha Google (em breve)</SelectItem>
                </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block font-medium mb-2">Grupo de Contatos *</label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                {supabaseGroups
                  .filter(group => group && group.trim() !== "")
                  .map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

        <div>
          <label className="block font-medium mb-2">Data e Hora de Agendamento *</label>
          <Input
            type="datetime-local"
            value={scheduledForLocal}
            onChange={(e) => setScheduledForLocal(e.target.value)}
            min={new Date(new Date().getTime() + 60000).toISOString().slice(0, 16)}
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Nome da Campanha *</label>
          <Input
            placeholder="Ex: Promoção de Verão"
            value={newCampaign.name}
            onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Mensagem da Campanha</label>
          <div className="relative">
            <Textarea
              placeholder="Digite sua mensagem aqui. Use {{nome}} para personalizar."
              value={newCampaign.message}
              onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })}
              rows={4}
            />
            <div className="absolute top-2 right-2">
              <AiMessageGenerator onMessageGenerated={(msg) => setNewCampaign({ ...newCampaign, message: msg })} />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => insertVariable("{{nome}}")}>
              {"Inserir {{nome}}"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => insertVariable("{{telefone}}")}>
              {"Inserir {{telefone}}"}
            </Button>
          </div>
        </div>

        <div>
          <label className="block font-medium mb-2">Arquivo de Mídia (Opcional)</label>
          {mediaUrl ? (
            <div className="flex items-center gap-2 p-2 border rounded bg-muted">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm truncate flex-1">{mediaUrl.split('/').pop()}</p>
              <Button variant="ghost" size="icon" onClick={removeMedia}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setShowMediaRepository(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Escolher do Repositório
            </Button>
          )}
        </div>

        {canUseQueueSending && (
          <div>
            <label className="block font-medium mb-2">Método de Envio *</label>
            <Select value={sendingMethod} onValueChange={(value) => setSendingMethod(value as 'batch' | 'queue')}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o método de envio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="batch">Padrão (Intervalo Fixo)</SelectItem>
                <SelectItem value="queue">Avançado (Intervalos Aleatórios)</SelectItem>
              </SelectContent>
            </Select>
            
            {sendingMethod === 'queue' && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/50 space-y-3">
                <h4 className="font-semibold text-sm">Configurar Blocos de Envio</h4>
                {intervals.map((interval, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Qtd"
                      value={interval.quantity}
                      onChange={(e) => handleIntervalChange(index, 'quantity', e.target.value)}
                      className="w-20"
                    />
                    <span className="text-sm">msgs a cada</span>
                    <Input
                      type="number"
                      placeholder="Min"
                      value={interval.min}
                      onChange={(e) => handleIntervalChange(index, 'min', e.target.value)}
                      className="w-20"
                    />
                    <span className="text-sm">a</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={interval.max}
                      onChange={(e) => handleIntervalChange(index, 'max', e.target.value)}
                      className="w-20"
                    />
                    <span className="text-sm">seg</span>
                    {intervals.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeInterval(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                {intervals.length < 5 && (
                  <Button variant="outline" size="sm" onClick={addInterval}>
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Bloco
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        <Button onClick={handleCreateCampaign} disabled={!isFormValid()}>
          <Plus className="h-4 w-4 mr-2" />
          Criar e Agendar Campanha
        </Button>
        {!isFormValid() && (
          <p className="text-xs text-red-500 mt-2">
            * Preencha todos os campos obrigatórios para criar a campanha.
          </p>
        )}
      </CardContent>

      <Dialog open={showMediaRepository} onOpenChange={setShowMediaRepository}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Repositório de Mídia</DialogTitle>
          </DialogHeader>
          <MediaRepository onSelectMedia={handleSelectFromRepository} selectionMode={true} />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CampaignForm;