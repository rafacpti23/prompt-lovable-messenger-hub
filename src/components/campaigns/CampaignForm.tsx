import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Upload, X, Image, Brain } from "lucide-react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import MessagePreview from "./MessagePreview";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import MediaRepository from "@/components/media/MediaRepository";
import AiMessageGenerator from "./AiMessageGenerator";

interface Instance {
  id: string;
  instance_name: string;
  status: string | null;
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
  scheduleType: "once" | "recurring";
  setScheduleType: (v: "once" | "recurring") => void;
  scheduleDate: string;
  setScheduleDate: (v: string) => void;
  scheduleTime: string;
  setScheduleTime: (v: string) => void;
  recurringInterval: number;
  setRecurringInterval: (v: number) => void;
  createCampaign: () => void;
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
  scheduleType,
  setScheduleType,
  scheduleDate,
  setScheduleDate,
  scheduleTime,
  setScheduleTime,
  recurringInterval,
  setRecurringInterval,
  createCampaign,
  instances,
  selectedInstanceId,
  setSelectedInstanceId,
}) => {
  const [messageType, setMessageType] = useState<"text" | "image" | "video">("text");
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [showMediaRepository, setShowMediaRepository] = useState(false);

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
    const textarea = document.querySelector('textarea[placeholder="Mensagem da campanha"]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const newText = text.substring(0, start) + variable + text.substring(end);
      setNewCampaign({...newCampaign, message: newText});
      
      // Reposicionar cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const isFormValid = () => {
    return (
      selectedInstanceId &&
      newCampaign.name.trim() &&
      selectedGroup &&
      (messageType === "text" ? newCampaign.message.trim() : mediaUrl)
    );
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
          {/* Instância WhatsApp */}
          <div>
            <label className="block font-medium mb-2">Instância WhatsApp: *</label>
            <Select value={selectedInstanceId} onValueChange={setSelectedInstanceId}>
              <SelectTrigger className="w-80">
                <SelectValue placeholder="Selecione uma instância" />
              </SelectTrigger>
              <SelectContent>
                {instances.length === 0 && (
                  <SelectItem value="" disabled>Nenhuma instância cadastrada</SelectItem>
                )}
                {instances.map((inst) => (
                  <SelectItem value={inst.id} key={inst.id}>
                    {inst.instance_name} {inst.status === "connected" || inst.status === "open" ? "(Conectada)" : "(Desconectada)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fonte de contatos */}
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

          {/* Grupo de contatos */}
          <div>
            <label className="block font-medium mb-2">Grupo de contatos: *</label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-60">
                <SelectValue placeholder="Selecione grupo" />
              </SelectTrigger>
              <SelectContent>
                {(contactSource === "supabase" ? supabaseGroups : googleSheetGroups).map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nome da campanha */}
          <div>
            <label className="block font-medium mb-2">Nome da campanha: *</label>
            <Input
              placeholder="Nome da campanha"
              value={newCampaign.name}
              onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
            />
          </div>

          {/* Tipo de mensagem */}
          <div>
            <label className="block font-medium mb-2">Tipo de mensagem:</label>
            <div className="flex gap-2">
              <Button
                variant={messageType === "text" ? "default" : "outline"}
                size="sm"
                onClick={() => { setMessageType("text"); removeMedia(); }}
                type="button"
              >
                Texto
              </Button>
              <Button
                variant={messageType === "image" ? "default" : "outline"}
                size="sm"
                onClick={() => setMessageType("image")}
                type="button"
              >
                Imagem
              </Button>
              <Button
                variant={messageType === "video" ? "default" : "outline"}
                size="sm"
                onClick={() => setMessageType("video")}
                type="button"
              >
                Vídeo
              </Button>
            </div>
          </div>

          {/* Upload de mídia */}
          {messageType !== "text" && (
            <div>
              <label className="block font-medium mb-2">
                Mídia: *
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowMediaRepository(true)}
                    type="button"
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Selecionar do Repositório
                  </Button>
                </div>
                {mediaUrl && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <span className="text-sm truncate">
                      {mediaUrl}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={removeMedia}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mensagem/Caption */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block font-medium">
                {messageType === "text" ? "Mensagem da campanha: *" : "Legenda (opcional):"}
              </label>
              <AiMessageGenerator 
                onMessageGenerated={(message) => setNewCampaign({ ...newCampaign, message })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable("{{nome}}")}
                  type="button"
                >
                  Inserir Nome
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable("{{telefone}}")}
                  type="button"
                >
                  Inserir Telefone
                </Button>
              </div>
              <Textarea
                placeholder={messageType === "text" ? "Mensagem da campanha" : "Legenda para a mídia"}
                value={newCampaign.message}
                onChange={(e) => setNewCampaign({...newCampaign, message: e.target.value})}
                rows={4}
              />
              <p className="text-sm text-gray-500">
                Use {`{{nome}}`} e {`{{telefone}}`} para inserir dados do contato
              </p>
            </div>
          </div>

          {/* Preview da mensagem */}
          <div>
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button variant="outline" type="button">
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar Mensagem
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Preview da Mensagem</DialogTitle>
                </DialogHeader>
                <MessagePreview 
                  message={newCampaign.message}
                  messageType={messageType}
                  mediaPreview={mediaPreview}
                />
              </DialogContent>
            </Dialog>
          </div>

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
          <Button 
            onClick={createCampaign}
            disabled={!isFormValid()}
            className={!isFormValid() ? "opacity-50 cursor-not-allowed" : ""}
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Campanha
          </Button>
          
          {!isFormValid() && (
            <p className="text-sm text-red-500">
              * Campos obrigatórios: Instância, Nome, Grupo, {messageType === "text" ? "Mensagem" : "Arquivo de mídia"}
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