import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Users, Send, BarChart3, Settings, Moon, Sun, CreditCard, Image } from "lucide-react";
import { useAuth, AuthProvider } from "@/components/auth/AuthProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import LoginForm from "@/components/auth/LoginForm";
import Dashboard from "@/components/dashboard/Dashboard";
import InstancesManager from "@/components/instances/InstancesManager";
import ContactsManager from "@/components/contacts/ContactsManager";
import CampaignsManager from "@/components/campaigns/CampaignsManager";
import BillingManager from "@/components/billing/BillingManager";
import MediaRepository from "@/components/media/MediaRepository";
import SettingsModal from "@/components/settings/SettingsModal";
import { supabase } from "@/integrations/supabase/client";
import WhatsAppLogosBG from "@/components/WhatsAppLogosBG";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { usePaymentVerification } from "@/hooks/usePaymentVerification";

const MainApp = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showSettings, setShowSettings] = useState(false);
  const getDefaultTheme = (): "light" | "dark" =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const [theme, setTheme] = useState<"light" | "dark">(getDefaultTheme());

  // Hooks must be called at the top level
  const { user, signOut, isLoading } = useAuth();
  const { profile } = useUserProfile();

  // Use payment verification hook
  usePaymentVerification();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  // ======================== CONTATOS ========================
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);

  const groups = Array.from(
    new Set(contacts.map(c => c.group).filter(Boolean))
  );

  useEffect(() => {
    async function fetchContacts() {
      setLoadingContacts(true);
      if (!user) {
        setContacts([]);
        setLoadingContacts(false);
        return;
      }
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error) {
        setContacts(
          (data || []).map((c: any) => ({
            ...c,
            group: c.tags?.[0] || "",
          }))
        );
      }
      setLoadingContacts(false);
    }
    if (user) {
      fetchContacts();
    }
  }, [user]);

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
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <img 
                    src="/lovable-uploads/c9bbdaa6-c367-4489-8438-ef65ccaf62f2.png" 
                    alt="WhatsPro Logo" 
                    className="h-10 w-10"
                  />
                  <h1 className="text-2xl font-bold text-foreground">WhatsPro</h1>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-green-600">
                  Online
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {profile?.full_name || user.email}
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
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 lg:w-fit lg:grid-cols-6 bg-card shadow-sm">
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
              <TabsTrigger value="media" className="flex items-center space-x-2">
                <Image className="h-4 w-4" />
                <span className="hidden sm:inline">Mídia</span>
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Cobrança</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="min-h-[600px]">
              <Dashboard />
            </TabsContent>
            <TabsContent value="instances" className="min-h-[600px]">
              <InstancesManager />
            </TabsContent>
            <TabsContent value="contacts" className="min-h-[600px]">
              <ContactsManager
                contacts={contacts}
                setContacts={setContacts}
                groups={groups}
                loading={loadingContacts}
                user={user}
              />
            </TabsContent>
            <TabsContent value="campaigns" className="min-h-[600px]">
              <CampaignsManager
                contactGroups={groups}
              />
            </TabsContent>
            <TabsContent value="media" className="min-h-[600px]">
              <MediaRepository />
            </TabsContent>
            <TabsContent value="billing" className="min-h-[600px]">
              <BillingManager />
            </TabsContent>
          </Tabs>
        </main>
        <SettingsModal
          open={showSettings}
          onOpenChange={setShowSettings}
          theme={theme}
          setTheme={setTheme}
        />
        <footer className="text-center py-2 text-xs bg-card/70 text-muted-foreground w-full border-t border-border z-20 fixed bottom-0 left-0 right-0">
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