
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Mail, Lock, User, Eye, EyeOff, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./AuthProvider";
import FloatingWhatsAppIcons from "./FloatingWhatsAppIcons";
import BenefitsSection from "@/components/landing/BenefitsSection";
import ContactSection from "@/components/landing/ContactSection";

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    email: '', 
    password: '', 
    fullName: '', 
    confirmPassword: '' 
  });
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await signIn(loginData.email, loginData.password);
      
      if (error) {
        toast({
          title: "Erro no login",
          description: error.message === "Invalid login credentials" 
            ? "Email ou senha incorretos" 
            : "Erro ao fazer login. Tente novamente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao WhatsApp Pro",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signUp(registerData.email, registerData.password, registerData.fullName);
      
      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "Erro",
            description: "Este email já está cadastrado. Tente fazer login.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro no cadastro",
            description: error.message || "Erro ao criar conta. Tente novamente.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu email para confirmar a conta.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToLogin = () => {
    document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-blue-500 to-purple-600 relative overflow-hidden">
      <FloatingWhatsAppIcons />
      
      {/* Hero Section */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="text-center pt-12 pb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <MessageSquare className="h-16 w-16 text-white animate-pulse" />
            <h1 className="text-6xl font-bold text-white">WhatsApp Pro</h1>
          </div>
          <p className="text-green-100 text-2xl mb-6">
            Sistema Multiusuário de Envio de Mensagens
          </p>
          <p className="text-white/90 text-lg max-w-2xl mx-auto px-4">
            A ferramenta mais poderosa para automação de WhatsApp. 
            Aumente suas vendas, engajamento e produtividade com nossa plataforma completa.
          </p>
          <div className="mt-8">
            <Button 
              onClick={scrollToLogin}
              className="bg-white text-green-600 hover:bg-green-50 font-bold text-xl px-8 py-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 animate-pulse"
            >
              Começar Agora Grátis
              <ArrowDown className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Login Section */}
        <div id="login-section" className="flex items-center justify-center flex-1 p-4">
          <div className="w-full max-w-md">
            <Card className="backdrop-blur-sm bg-white/95 shadow-2xl border-0">
              <CardHeader>
                <CardTitle className="text-center text-2xl text-gray-800">
                  Acesse sua conta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Entrar</TabsTrigger>
                    <TabsTrigger value="register">Cadastrar</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            id="email" 
                            type="email" 
                            placeholder="seu@email.com"
                            className="pl-10"
                            value={loginData.email}
                            onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                            required 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            id="password" 
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10"
                            value={loginData.password}
                            onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                            required 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                          </button>
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-green-600 hover:bg-green-700" 
                        disabled={isLoading}
                      >
                        {isLoading ? "Entrando..." : "Entrar"}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Nome completo</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            id="fullName" 
                            type="text" 
                            placeholder="Seu nome completo"
                            className="pl-10"
                            value={registerData.fullName}
                            onChange={(e) => setRegisterData({...registerData, fullName: e.target.value})}
                            required 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email-register">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            id="email-register" 
                            type="email" 
                            placeholder="seu@email.com"
                            className="pl-10"
                            value={registerData.email}
                            onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                            required 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password-register">Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            id="password-register" 
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10"
                            value={registerData.password}
                            onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                            required 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            id="confirm-password" 
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10"
                            value={registerData.confirmPassword}
                            onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                            required 
                          />
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-700" 
                        disabled={isLoading}
                      >
                        {isLoading ? "Criando conta..." : "Criar conta"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="relative z-10 bg-white dark:bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BenefitsSection />
        </div>
      </div>

      {/* Contact Section */}
      <div className="relative z-10 bg-gray-50 dark:bg-gray-800 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ContactSection />
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900 text-white py-8 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-gray-400">
            © {new Date().getFullYear()} WhatsApp Pro - Ramel Tecnologia | ramelseg.com.br | (27) 99908-2624
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Transformando a forma como você se comunica com seus clientes
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LoginForm;
