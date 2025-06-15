
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Users, Send, BarChart3, Settings, Moon, Sun } from "lucide-react";
import { useAuth, AuthProvider } from "@/components/auth/AuthProvider";
import LoginForm from "@/components/auth/LoginForm";
import Dashboard from "@/components/dashboard/Dashboard";
import InstancesManager from "@/components/instances/InstancesManager";
import ContactsManager from "@/components/contacts/ContactsManager";
import CampaignsManager from "@/components/campaigns/CampaignsManager";
import SettingsModal from "@/components/settings/SettingsModal";
import { supabase } from "@/integrations/supabase/client";
import WhatsAppLogosBG from "@/components/WhatsAppLogosBG";
import { ThemeProvider } from "@/components/ui/theme-provider";

const MainApp = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showSettings, setShowSettings] = useState(false);
  // Correção para o tipo do tema aceitar apenas 'light' | 'dark'
  const getDefaultTheme = (): "light" | "dark" =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const [theme, setTheme] = useState<"light" | "dark">(getDefaultTheme());

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  // ======================== CONTATOS ========================
  // Estado centralizado para contatos e grupos
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);

  // Derivar os grupos únicos dos contatos (considerar grupo == tags[0] ou similar)
  const groups = Array.from(
    new Set(contacts.map(c => c.group).filter(Boolean))
  );

  let user, signOut, isLoading, error;
  let contextError = null;
  try {
    const auth = useAuth();
    user = auth.user;
    signOut = auth.signOut;
    isLoading = auth.isLoading;
    console.log("Auth info", { user, isLoading });
  } catch (e) {
    console.error("Erro no useAuth:", e);
    contextError = e;
  }

  useEffect(() => {
    async function fetchContacts() {
      setLoadingContacts(true);
      if (!user) return;
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error) {
        // Assegura que cada contato terá o campo .group, extraído de tags[0] se presente
        setContacts(
          (data || []).map((c: any) => ({
            ...c,
            group: c.tags?.[0] || "", // group calculated from tags[0]
          }))
        );
      }
      setLoadingContacts(false);
    }
    if (user) fetchContacts();
  }, [user]);

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
    console.log("Nenhum usuário autenticado. Exibindo tela de login.");
    return <LoginForm />;
  }

  console.log("Usuário autenticado:", user);

  return (
    <ThemeProvider defaultTheme={theme} forcedTheme={undefined} attribute="class">
      <WhatsAppLogosBG />
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-black flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-8 w-8 text-green-600" />
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WhatsApp Pro</h1>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-green-600">
                  Online
                </Badge>
                <span className="text-sm text-gray-600 dark:text-gray-200">
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
                <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  {theme === "dark" ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-zinc-900" />}
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:grid-cols-4 bg-white dark:bg-gray-800 shadow-sm">
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
              <ContactsManager
                contacts={contacts}
                setContacts={setContacts}
                groups={groups}
                loading={loadingContacts}
                user={user}
              />
            </TabsContent>
            <TabsContent value="campaigns">
              <CampaignsManager
                contactGroups={groups}
              />
            </TabsContent>
          </Tabs>
        </main>
        <SettingsModal
          open={showSettings}
          onOpenChange={setShowSettings}
        />
        <footer className="text-center py-2 text-xs bg-white/70 dark:bg-gray-900/80 text-gray-500 dark:text-gray-300 w-full border-t z-20 fixed bottom-0 left-0 right-0">
          © {new Date().getFullYear()} Ramel tecnologia ramelseg.com.br — (27) 99908-2624
        </footer>
      </div>
    </ThemeProvider>
  );
};

const Index = () => {
  console.log("Renderizando Index.tsx");
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default Index;
