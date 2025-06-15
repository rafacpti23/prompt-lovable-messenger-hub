
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Users, Send, BarChart3, Settings } from "lucide-react";
import { useAuth, AuthProvider } from "@/components/auth/AuthProvider";
import LoginForm from "@/components/auth/LoginForm";
import Dashboard from "@/components/dashboard/Dashboard";
import InstancesManager from "@/components/instances/InstancesManager";
import ContactsManager from "@/components/contacts/ContactsManager";
import CampaignsManager from "@/components/campaigns/CampaignsManager";
import SettingsModal from "@/components/settings/SettingsModal";

const MainApp = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showSettings, setShowSettings] = useState(false);

  let user, signOut, isLoading, error;
  let contextError = null;
  try {
    // console log para debugar o hook
    const auth = useAuth();
    user = auth.user;
    signOut = auth.signOut;
    isLoading = auth.isLoading;
    // Forçar log sempre que o estado do auth mudar
    console.log("Auth info", { user, isLoading });
  } catch (e) {
    console.error("Erro no useAuth:", e);
    contextError = e;
  }

  if (contextError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 flex-col">
        <div className="text-2xl font-bold text-red-700 mb-4">Erro crítico no carregamento</div>
        <div className="bg-white px-6 py-4 rounded">{String(contextError.message || contextError)}</div>
        <div className="text-gray-500 text-sm mt-2">
          Verifique se todos os arquivos existem e se não há erros nos imports.
        </div>
      </div>
    );
  }

  if (typeof isLoading === "undefined") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-lg text-blue-700 bg-white px-10 py-6 rounded shadow">
          <div className="font-bold text-2xl">Carregando...</div>
          <div className="text-sm mt-2">Inicializando componentes.</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-4 text-lg text-green-800">Carregando autenticação...</span>
      </div>
    );
  }

  if (!user) {
    // Debug do auth para login
    console.log("Nenhum usuário autenticado. Exibindo tela de login.");
    return <LoginForm />;
  }

  // Debug de usuário autenticado
  console.log("Usuário autenticado:", user);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-8 w-8 text-green-600" />
                <h1 className="text-2xl font-bold text-gray-900">WhatsApp Pro</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-600">
                Online
              </Badge>
              <span className="text-sm text-gray-600">
                {user.email}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={signOut}
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="instances" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Instâncias</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Contatos</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center space-x-2">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Campanhas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>

          <TabsContent value="instances">
            <InstancesManager />
          </TabsContent>

          <TabsContent value="contacts">
            <ContactsManager />
          </TabsContent>

          <TabsContent value="campaigns">
            <CampaignsManager />
          </TabsContent>
        </Tabs>
      </main>

      <SettingsModal 
        open={showSettings} 
        onOpenChange={setShowSettings} 
      />
    </div>
  );
};

const Index = () => {
  // Console log assim que entrar na página inicial
  console.log("Renderizando Index.tsx");
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default Index;
