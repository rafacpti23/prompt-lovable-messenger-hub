
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";

interface PlanSelectorProps {
  selectedPlan?: string;
  onSelectPlan: (planId: string) => void;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({ selectedPlan, onSelectPlan }) => {
  const plans = [
    {
      id: "trial",
      name: "Teste Gratuito",
      price: "R$ 0,00",
      duration: "1 dia",
      messages: 10,
      description: "Para testar o sistema",
      features: [
        "10 mensagens grátis",
        "1 instância WhatsApp",
        "Suporte básico",
        "Válido por 1 dia"
      ],
      popular: false,
      pricePerMessage: "Grátis"
    },
    {
      id: "starter",
      name: "Plano Starter",
      price: "R$ 49,90",
      duration: "/mês",
      messages: 1000,
      description: "Ideal para pequenos negócios",
      features: [
        "1.000 mensagens/mês",
        "Até 3 instâncias WhatsApp",
        "Campanhas automáticas",
        "Suporte prioritário",
        "Relatórios básicos"
      ],
      popular: true,
      pricePerMessage: "R$ 0,05"
    },
    {
      id: "master",
      name: "Plano Master",
      price: "R$ 79,90",
      duration: "/mês",
      messages: 2000,
      description: "Para empresas em crescimento",
      features: [
        "2.000 mensagens/mês",
        "Instâncias ilimitadas",
        "Campanhas automáticas",
        "Suporte 24/7",
        "Relatórios avançados",
        "API personalizada"
      ],
      popular: false,
      pricePerMessage: "R$ 0,04"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Escolha seu Plano</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Selecione o plano ideal para suas necessidades
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative ${
              selectedPlan === plan.id 
                ? "ring-2 ring-green-500" 
                : plan.popular 
                  ? "ring-2 ring-blue-500" 
                  : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600 text-white px-3 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Mais Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
              <div className="mt-4">
                <span className="text-3xl font-bold text-green-600">{plan.price}</span>
                <span className="text-gray-500">{plan.duration}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{plan.description}</p>
              <div className="text-sm text-blue-600 font-medium">
                {plan.pricePerMessage} por mensagem
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button
                className="w-full mt-6"
                variant={selectedPlan === plan.id ? "default" : "outline"}
                onClick={() => onSelectPlan(plan.id)}
              >
                {selectedPlan === plan.id ? "Selecionado" : "Selecionar Plano"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PlanSelector;
