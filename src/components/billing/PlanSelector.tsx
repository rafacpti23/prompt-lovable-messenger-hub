import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Loader2, ExternalLink, ArrowUpCircle } from "lucide-react";
import { usePlans } from "@/hooks/usePlans";
import { useBilling } from "@/hooks/useBilling";
import { toast } from "sonner";

interface PlanSelectorProps {
  showTrial?: boolean;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({ showTrial = false }) => {
  const { plans, loading: plansLoading } = usePlans();
  const { purchasePlan, verifyPayment } = useBilling();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast.success("Pagamento realizado com sucesso!");
      verifyPayment();
    } else if (urlParams.get('canceled') === 'true') {
      toast.error("Pagamento cancelado");
    }
  }, [verifyPayment]);

  const handleSelectPlan = async (planId: string, planName: string) => {
    setPurchasing(planId);
    try {
      const result = await purchasePlan(planId);
      if (result.error) {
        toast.error(`Erro: ${result.error}`);
      } else {
        toast.success("Redirecionando para pagamento...");
      }
    } catch (error) {
      toast.error("Erro ao processar compra");
    } finally {
      setPurchasing(null);
    }
  };

  const handleScrollToRegister = () => {
    document.getElementById('register-card')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (plansLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6"><div className="h-32 bg-gray-200 rounded"></div></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const filteredPlans = plans.filter(plan => showTrial || plan.name !== 'trial');

  const planDetails = filteredPlans.map(plan => {
    let description = "", features: string[] = [], popular = false, benefits: string[] = [];

    switch (plan.name) {
      case "trial":
        description = "Experimente a plataforma sem compromisso";
        features = [
          "10 créditos para envio",
          "1 instância WhatsApp",
          "Válido por 1 dia",
          "Acesso a todos os recursos"
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
    return { ...plan, description, features, benefits, popular, pricePerMessage: `R$ ${plan.price_per_message.toFixed(4).replace('.', ',')}` };
  });

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Escolha seu Plano</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Comece com um teste gratuito ou selecione o plano ideal para suas necessidades.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {planDetails.map((plan) => (
          <Card key={plan.id} className={`relative flex flex-col ${plan.popular ? "ring-2 ring-primary" : ""}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1"><Star className="h-3 w-3 mr-1" /> Mais Popular</Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold capitalize">
                {plan.name === "trial" ? "Teste Gratuito" : plan.name === "starter" ? "Plano Starter" : "Plano Master"}
              </CardTitle>
              <div className="mt-4">
                <span className="text-3xl font-bold text-primary">
                  R$ {plan.price.toFixed(2).replace('.', ',')}
                </span>
                {plan.name !== 'trial' && <span className="text-gray-500">/mês</span>}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{plan.description}</p>
              {plan.name !== 'trial' && <div className="text-sm text-primary font-medium">{`${plan.pricePerMessage} por mensagem`}</div>}
            </CardHeader>
            
            <CardContent className="flex-grow flex flex-col">
              <div className="space-y-4 flex-grow">
                <div>
                  <h4 className="font-semibold mb-2">Recursos inclusos:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {plan.name === 'trial' ? (
                <Button className="w-full mt-6 bg-green-600 hover:bg-green-700" onClick={handleScrollToRegister}>
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                  Cadastre-se e Teste Grátis
                </Button>
              ) : (
                <Button className="w-full mt-6" onClick={() => handleSelectPlan(plan.id, plan.name)} disabled={purchasing === plan.id}>
                  {purchasing === plan.id ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</>
                  ) : (
                    <><ExternalLink className="h-4 w-4 mr-2" /> Assinar Plano</>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PlanSelector;