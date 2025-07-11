import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Loader2, ExternalLink } from "lucide-react";
import { usePlans } from "@/hooks/usePlans";
import { useBilling } from "@/hooks/useBilling";
import { toast } from "sonner";

const PlanSelector: React.FC = () => {
  const { plans, loading: plansLoading } = usePlans();
  const { purchasePlan, verifyPayment } = useBilling();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  // Verificar pagamentos ao carregar a página
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

  // Filtrar para não mostrar o plano trial
  const paidPlans = plans.filter(plan => plan.name !== 'trial');

  const planDetails = paidPlans.map(plan => {
    let description = "";
    let features: string[] = [];
    let popular = false;
    let benefits: string[] = [];

    switch (plan.name) {
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
        benefits = [
          "Aumente suas vendas com automação",
          "Gerencie múltiplos WhatsApp",
          "Relatórios detalhados de campanhas",
          "Suporte especializado"
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
        benefits = [
          "Escale seu negócio sem limites",
          "Integração completa via API",
          "Suporte dedicado 24/7",
          "Relatórios avançados e insights"
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
      benefits,
      popular,
      pricePerMessage: `R$ ${plan.price_per_message.toFixed(4).replace('.', ',')}`
    };
  });

  return (
    <div className="space-y-8">
      {/* Seção de benefícios do sistema */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          🚀 Transforme seu WhatsApp em uma máquina de vendas!
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-2">📈</div>
            <p className="font-semibold">Aumente suas vendas</p>
            <p className="text-sm text-gray-600">Campanhas automatizadas</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">⚡</div>
            <p className="font-semibold">Economize tempo</p>
            <p className="text-sm text-gray-600">Mensagens em massa</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">📊</div>
            <p className="font-semibold">Relatórios completos</p>
            <p className="text-sm text-gray-600">Acompanhe resultados</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🎯</div>
            <p className="font-semibold">Segmentação avançada</p>
            <p className="text-sm text-gray-600">Mensagens personalizadas</p>
          </div>
        </div>
      </div>

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
            className={`relative ${plan.popular ? "ring-2 ring-primary" : ""}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Mais Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold capitalize">
                {plan.name === "starter" ? "Plano Starter" :
                 plan.name === "master" ? "Plano Master" : plan.name}
              </CardTitle>
              <div className="mt-4">
                <span className="text-3xl font-bold text-primary">
                  R$ {plan.price.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-gray-500">
                  /mês
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{plan.description}</p>
              <div className="text-sm text-primary font-medium">
                {`${plan.pricePerMessage} por mensagem`}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
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

                {plan.benefits.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Benefícios:</h4>
                    <ul className="space-y-1">
                      {plan.benefits.map((benefit, index) => (
                        <li key={index} className="text-xs text-gray-600 flex items-center">
                          <div className="w-1 h-1 bg-primary rounded-full mr-2"></div>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <Button
                className="w-full mt-6"
                onClick={() => handleSelectPlan(plan.id, plan.name)}
                disabled={purchasing === plan.id}
              >
                {purchasing === plan.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Assinar Plano
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Informações sobre Evolution API */}
      <div className="bg-accent border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-accent-foreground mb-2">
          💡 Sobre a Evolution API
        </h3>
        <p className="text-muted-foreground text-sm">
          Utilizamos a Evolution API para conectar com o WhatsApp. Você pode usar nossa API integrada 
          ou configurar sua própria instância da Evolution API nas configurações do sistema.
        </p>
      </div>
    </div>
  );
};

export default PlanSelector;