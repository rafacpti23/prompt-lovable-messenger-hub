import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Mail, Lock, User, Eye, EyeOff, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./AuthProvider";
import FloatingWhatsAppIcons from "./FloatingWhatsAppIcons";
import AnimatedFeatureList from "./AnimatedFeatureList";
import CountdownBanner from "./CountdownBanner";
import ContactWidget from "./ContactWidget";
import PlanSelector from "../billing/PlanSelector";
import AnimatedGradientText from "./AnimatedGradientText";

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    email: '', 
    password: '', 
    fullName: '', 
    whatsapp: '',
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
          description: "Bem-vindo ao WhatsPro",
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
      const { error } = await signUp(registerData.email, registerData.password, registerData.fullName, registerData.whatsapp);
      
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-blue-900 to-green-900 text-white relative overflow-hidden">
      <CountdownBanner />
      <FloatingWhatsAppIcons />
      <ContactWidget />
      
      <div className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center min-h-screen p-8 lg:p-12">
          
          {/* Left Side: Hero & Features */}
          <div className="flex flex-col justify-center h-full pr-0 lg:pr-12">
            <div className="flex items-center space-x-4 mb-6">
              <MessageSquare className="h-16 w-16 text-green-400" />
              <AnimatedGradientText className="text-6xl font-bold tracking-tighter">
                WhatsPro
              </AnimatedGradientText>
            </div>
            <p className="text-2xl text-white/80 max-w-lg">
              A plataforma de automação para WhatsApp que impulsiona seu negócio para o futuro.
            </p>
            <AnimatedFeatureList />
          </div>

          {/* Right Side: Login Form */}
          <div id="register-card" className="flex items-center justify-center w-full max-w-md mx-auto mt-12 lg:mt-0">
            <Card className="w-full bg-white/10 backdrop-blur-md shadow-2xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-center text-2xl text-white">
                  Acesse sua conta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-black/20">
                    <TabsTrigger value="login" className="text-white/70 data-[state=active]:bg-green-500/30 data-[state=active]:text-white">Entrar</TabsTrigger>
                    <TabsTrigger value="register" className="text-white/70 data-[state=active]:bg-blue-500/30 data-[state=active]:text-white">Cadastrar</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login" className="mt-4">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-white/80">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            id="email" 
                            type="email" 
                            placeholder="seu@email.com"
                            className="pl-10 bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:ring-green-400"
                            value={loginData.email}
                            onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                            required 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-white/80">Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            id="password" 
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10 bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:ring-green-400"
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
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold" 
                        disabled={isLoading}
                      >
                        {isLoading ? "Entrando..." : "Entrar"}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="register" className="mt-4">
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-white/80">Nome completo</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            id="fullName" 
                            type="text" 
                            placeholder="Seu nome completo"
                            className="pl-10 bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:ring-blue-400"
                            value={registerData.fullName}
                            onChange={(e) => setRegisterData({...registerData, fullName: e.target.value})}
                            required 
                          />
                        </div>
                      </div>
                       <div className="space-y-2">
                        <Label htmlFor="whatsapp" className="text-white/80">WhatsApp</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            id="whatsapp" 
                            type="tel" 
                            placeholder="(99) 99999-9999"
                            className="pl-10 bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:ring-blue-400"
                            value={registerData.whatsapp}
                            onChange={(e) => setRegisterData({...registerData, whatsapp: e.target.value})}
                            required 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email-register" className="text-white/80">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            id="email-register" 
                            type="email" 
                            placeholder="seu@email.com"
                            className="pl-10 bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:ring-blue-400"
                            value={registerData.email}
                            onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                            required 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password-register" className="text-white/80">Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            id="password-register" 
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10 bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:ring-blue-400"
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
                        <Label htmlFor="confirm-password" className="text-white/80">Confirmar senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            id="confirm-password" 
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 bg-black/20 border-white/20 text-white placeholder:text-gray-400 focus:ring-blue-400"
                            value={registerData.confirmPassword}
                            onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                            required 
                          />
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold" 
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
        
        <div className="py-16 px-8">
          <PlanSelector showTrial={true} />
        </div>
      </div>
    </div>
  );
};

export default LoginForm;