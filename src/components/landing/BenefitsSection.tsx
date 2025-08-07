
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Users, Zap, BarChart3, Shield, Clock, Target, TrendingUp, Smartphone } from "lucide-react";

const BenefitsSection = () => {
  const benefits = [
    {
      icon: <MessageSquare className="h-8 w-8 text-green-600" />,
      title: "Envio em Massa",
      description: "Envie milhares de mensagens personalizadas simultaneamente com nossa tecnologia avançada"
    },
    {
      icon: <Users className="h-8 w-8 text-blue-600" />,
      title: "Gestão de Contatos",
      description: "Organize seus contatos em grupos e segmente suas campanhas para melhor conversão"
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-600" />,
      title: "Automação Inteligente",
      description: "Automatize suas campanhas com agendamento e pausas personalizáveis entre mensagens"
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-purple-600" />,
      title: "Analytics Avançado",
      description: "Acompanhe métricas detalhadas de entrega, abertura e conversão em tempo real"
    },
    {
      icon: <Shield className="h-8 w-8 text-red-600" />,
      title: "Segurança Total",
      description: "Evolution API integrada com máxima segurança e proteção de dados"
    },
    {
      icon: <Clock className="h-8 w-8 text-indigo-600" />,
      title: "24/7 Disponível",
      description: "Sistema sempre online com suporte técnico especializado quando precisar"
    }
  ];

  const features = [
    "✅ Múltiplas instâncias WhatsApp",
    "✅ Envio personalizado em massa",
    "✅ Agendamento de campanhas",
    "✅ Gestão completa de contatos",
    "✅ Relatórios detalhados",
    "✅ API própria ou nossa Evolution API",
    "✅ Interface intuitiva e responsiva",
    "✅ Suporte técnico especializado"
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
          Transforme seu WhatsApp em uma
          <span className="text-green-600 block">Máquina de Vendas</span>
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          O sistema mais completo para automação de WhatsApp do mercado. 
          Usado por milhares de empresas para aumentar vendas e engagement.
        </p>
      </div>

      {/* Benefits Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefits.map((benefit, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-300 border-2 hover:border-green-200">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {benefit.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {benefit.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features List */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border-green-200">
        <CardContent className="p-8">
          <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
            Tudo que você precisa em um só lugar
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="text-green-600 font-semibold">{feature.split(' ')[0]}</span>
                <span className="text-gray-700 dark:text-gray-300">{feature.substring(2)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Social Proof */}
      <div className="text-center space-y-4">
        <div className="flex justify-center items-center space-x-8 text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-green-600" />
            <span className="font-semibold">+10.000</span>
            <span>Mensagens/dia</span>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span className="font-semibold">98%</span>
            <span>Taxa de entrega</span>
          </div>
          <div className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-purple-600" />
            <span className="font-semibold">24/7</span>
            <span>Disponibilidade</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenefitsSection;
