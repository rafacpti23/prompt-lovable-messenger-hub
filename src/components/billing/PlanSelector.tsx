
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Loader2 } from "lucide-react";
import { usePlans } from "@/hooks/usePlans";
import { useBilling } from "@/hooks/useBilling";
import { toast } from "sonner";

const PlanSelector: React.FC = () => {
  const { plans, loading: plansLoading } = usePlans();
  const { purchasePlan } = useBilling();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    setPurchasing(planId);
    
    try {
      const result = await purchasePlan(planId);
      
      if (result.error) {
        toast.error(`Erro: ${result.error}`);
      } else {
        toast.success("Plano ativado com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao processar compra");
    } finally {
      setPurchasing(null);
    }
  };

  if (plansLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const planDetails = plans.map(plan => {
    let description = "";
    let features: string[] = [];
    let popular = false;

    switch (plan.name) {
      case "trial":
        description = "Para testar o sistema";
        features = [
          `${plan.credits} mensagens grátis`,
          "1 instância WhatsApp",
          "Suporte básico",
          `Válido por ${plan.duration_days} dia${plan.duration_days > 1 ? 's' : ''}`
        ];
        break;
      case "starter":
        description = "Ideal para pequenos negócios";
        popular = true;
        features = [
          `${plan.credits.toLocaleString()} mensagens/mês`,
          "Até 3 instâncias WhatsApp",
          "Campanhas automáticas",
          "Suporte prioritário",
          "Relatórios básicos"
        ];
        break;
      case "master":
        description = "Para empresas em crescimento";
        features = [
          `${plan.credits.toLocaleString()} mensagens/mês`,
          "Instâncias ilimitadas",
          "Campanhas automáticas",
          "Suporte 24/7",
          "Relatórios avançados",
          "API personalizada"
        ];
        break;
      default:
        description = "Plano personalizado";
        features = [`${plan.credits} mensagens`];
    }

    return {
      ...plan,
      description,
      features,
      popular,
      pricePerMessage: `R$ ${plan.price_per_message.toFixed(4).replace('.', ',')}`
    };
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Escolha seu Plano</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Selecione o plano ideal para suas necessidades
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {planDetails.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative ${plan.popular ? "ring-2 ring-blue-500" : ""}`}
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
              <CardTitle className="text-xl font-bold capitalize">
                {plan.name === "trial" ? "Teste Gratuito" : 
                 plan.name === "starter" ? "Plano Starter" :
                 plan.name === "master" ? "Plano Master" : plan.name}
              </CardTitle>
              <div className="mt-4">
                <span className="text-3xl font-bold text-green-600">
                  R$ {plan.price.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-gray-500">
                  {plan.name === "trial" ? "" : "/mês"}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{plan.description}</p>
              <div className="text-sm text-blue-600 font-medium">
                {plan.name === "trial" ? "Grátis" : `${plan.pricePerMessage} por mensagem`}
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
                onClick={() => handleSelectPlan(plan.id)}
                disabled={purchasing === plan.id}
              >
                {purchasing === plan.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Selecionar Plano"
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PlanSelector;
