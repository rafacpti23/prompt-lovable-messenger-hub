import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import LoginForm from "@/components/auth/LoginForm";
import MainLayout from "@/components/layout/MainLayout";
import WhatsAppLogosBG from "@/components/WhatsAppLogosBG";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { usePaymentVerification } from "@/hooks/usePaymentVerification";
import { useUserProfile } from "@/hooks/useUserProfile";

const MainApp = () => {
  const getDefaultTheme = (): "light" | "dark" =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const [theme, setTheme] = useState<"light" | "dark">(getDefaultTheme());

  const { user, signOut, isLoading } = useAuth();
  const { profile } = useUserProfile();
  usePaymentVerification();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-4 text-lg text-green-800">Carregando autenticação...</span>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <ThemeProvider defaultTheme={theme} forcedTheme={undefined} attribute="class">
      <WhatsAppLogosBG />
      <MainLayout 
        user={user}
        profile={profile}
        signOut={signOut}
        theme={theme}
        setTheme={setTheme}
      />
    </ThemeProvider>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default Index;