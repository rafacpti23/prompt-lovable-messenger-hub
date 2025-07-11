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

    setSaving(true);
    try {
      // Salvar configurações gerais
      localStorage.setItem('message_interval', messageInterval);
      
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
          {isAdmin && (
            <>
              <Button
                variant={activeTab === "ai" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("ai")}
              >
                <Brain className="h-4 w-4 mr-2" />
                IA
              </Button>
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

          {/* Gerenciamento de Usuários - Só Admin */}
          {activeTab === "users" && isAdmin && (
            <UserManagement />
          )}

          {/* Gerenciamento de Planos - Só Admin */}
          {activeTab === "plans" && isAdmin && (
            <PlanManagement />
          )}

          {/* Configurações de IA */}
          {activeTab === "ai" && isAdmin && (
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
                    Para usar os recursos de IA, você precisa configurar suas chaves de API como segredos no seu projeto Supabase.
                  </p>
                </div>
                
                <div className="space-y-2 border p-3 rounded-lg">
                  <Label className="flex items-center gap-2 font-semibold">
                    <Key className="h-4 w-4" />
                    API Key Groq (Obrigatório)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Para gerar mensagens de campanha, adicione um segredo chamado <code className="font-mono bg-muted px-1 py-0.5 rounded">groq_api_key</code> no seu projeto Supabase.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vá para: Project Settings &gt; Edge Functions &gt; Add new secret.
                  </p>
                </div>
                
                <div className="space-y-2 border p-3 rounded-lg">
                  <Label className="flex items-center gap-2 font-semibold">
                    <Key className="h-4 w-4" />
                    API Key Google Gemini (Opcional)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Funcionalidades futuras de IA podem usar a API do Gemini. Você pode configurar um segredo chamado <code className="font-mono bg-muted px-1 py-0.5 rounded">gemini_api_key</code>.
                  </p>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Fechar
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