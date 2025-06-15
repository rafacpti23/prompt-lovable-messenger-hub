
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Key, Server, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('evolution_api_url') || '');
  const [apiKey, setApiKey] = useState(localStorage.getItem('evolution_api_key') || '');
  const [messageInterval, setMessageInterval] = useState(localStorage.getItem('message_interval') || '5');
  const [loading, setSaving] = useState(false);

  // Verifica se é o usuário administrador
  const isAdmin = user?.email === 'rafacpti@gmail.com';

  const handleSave = async () => {
    if (!messageInterval) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o intervalo entre mensagens.",
        variant: "destructive",
      });
      return;
    }

    if (isAdmin && (!apiUrl || !apiKey)) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos da API.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Salvar configurações gerais
      localStorage.setItem('message_interval', messageInterval);
      
      // Salvar configurações da API (apenas para admin)
      if (isAdmin) {
        localStorage.setItem('evolution_api_url', apiUrl);
        localStorage.setItem('evolution_api_key', apiKey);
      }
      
      toast({
        title: "Configurações salvas",
        description: "As configurações foram salvas com sucesso.",
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Configurações do Sistema
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Configurações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message-interval">Intervalo entre mensagens (segundos) *</Label>
                <Input
                  id="message-interval"
                  type="number"
                  min="1"
                  placeholder="5"
                  value={messageInterval}
                  onChange={(e) => setMessageInterval(e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  Tempo de espera entre o envio de cada mensagem (padrão: 5 segundos)
                </p>
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Server className="h-5 w-5" />
                  Evolution API (Apenas Administrador)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-url">URL da API *</Label>
                  <Input
                    id="api-url"
                    placeholder="https://api.ramelseg.com.br"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    URL base da Evolution API
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api-key" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API Key *
                  </Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Sua chave da API"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Chave de autenticação para acessar a Evolution API
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
