
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Key, Server, Clock, Users, CreditCard, Brain, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import UserManagement from "./UserManagement";
import PlanManagement from "./PlanManagement";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme?: "light" | "dark";
  setTheme?: React.Dispatch<React.SetStateAction<"light" | "dark">>;
}

const SettingsModal = ({ open, onOpenChange, theme, setTheme }: SettingsModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('evolution_api_url') || '');
  const [apiKey, setApiKey] = useState(localStorage.getItem('evolution_api_key') || '');
  const [messageInterval, setMessageInterval] = useState(localStorage.getItem('message_interval') || '5');
  const [groqApiKey, setGroqApiKey] = useState(localStorage.getItem('groq_api_key') || '');
  const [geminiApiKey, setGeminiApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
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

    setSaving(true);
    try {
      // Salvar configurações gerais
      localStorage.setItem('message_interval', messageInterval);
      
      // Salvar configurações da API Evolution para todos os usuários
      if (apiUrl && apiKey) {
        localStorage.setItem('evolution_api_url', apiUrl);
        localStorage.setItem('evolution_api_key', apiKey);
      }
      
      // Salvar configurações da IA
      if (groqApiKey) {
        localStorage.setItem('groq_api_key', groqApiKey);
      }
      if (geminiApiKey) {
        localStorage.setItem('gemini_api_key', geminiApiKey);
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
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Configurações do Sistema
          </DialogTitle>
        </DialogHeader>
        
        {/* Tabs de navegação */}
        <div className="flex gap-2 border-b mb-4">
          <Button
            variant={activeTab === "general" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("general")}
          >
            <Clock className="h-4 w-4 mr-2" />
            Geral
          </Button>
          <Button
            variant={activeTab === "evolution" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("evolution")}
          >
            <Server className="h-4 w-4 mr-2" />
            Evolution API
          </Button>
          {isAdmin && (
            <>
              <Button
                variant={activeTab === "users" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("users")}
              >
                <Users className="h-4 w-4 mr-2" />
                Usuários
              </Button>
              <Button
                variant={activeTab === "plans" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("plans")}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Planos
              </Button>
              <Button
                variant={activeTab === "ai" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("ai")}
              >
                <Brain className="h-4 w-4 mr-2" />
                IA
              </Button>
            </>
          )}
        </div>

        <div className="space-y-6">
          {/* Configurações Gerais */}
          {activeTab === "general" && (
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

                {setTheme && (
                  <div className="space-y-2">
                    <Label htmlFor="theme-select" className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Tema do Sistema
                    </Label>
                    <Select value={theme} onValueChange={(value) => setTheme?.(value as "light" | "dark")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tema" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Escuro</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Escolha entre o tema claro ou escuro do sistema
                    </p>
                  </div>
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
              </CardContent>
            </Card>
          )}

          {/* Configurações Evolution API */}
          {activeTab === "evolution" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Server className="h-5 w-5" />
                  Evolution API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-blue-800">
                    Configure sua própria Evolution API ou use a nossa. Para usar sua própria API, 
                    preencha os campos abaixo com suas credenciais.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api-url">URL da API</Label>
                  <Input
                    id="api-url"
                    placeholder="https://api.ramelseg.com.br"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    URL base da Evolution API (deixe vazio para usar nossa API padrão)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api-key" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API Key
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
                
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gerenciamento de Usuários - Só Admin */}
          {activeTab === "users" && isAdmin && (
            <UserManagement />
          )}

          {/* Gerenciamento de Planos - Só Admin */}
          {activeTab === "plans" && isAdmin && (
            <PlanManagement />
          )}

          {/* Configurações de IA */}
          {activeTab === "ai" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5" />
                  Inteligência Artificial
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Configure as APIs de IA para geração automática de mensagens personalizadas, 
                    análise de sentimento e otimização de campanhas.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="groq-api-key" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API Key Groq
                  </Label>
                  <Input
                    id="groq-api-key"
                    type="password"
                    placeholder="Sua chave da API Groq"
                    value={groqApiKey}
                    onChange={(e) => setGroqApiKey(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    API rápida e eficiente para geração de mensagens personalizadas
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gemini-api-key" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API Key Google Gemini
                  </Label>
                  <Input
                    id="gemini-api-key"
                    type="password"
                    placeholder="Sua chave da API Gemini"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    API avançada do Google para análise de sentimento e conteúdo
                  </p>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
