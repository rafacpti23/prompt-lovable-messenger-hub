
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, MessageSquare, Calendar, AlertTriangle } from "lucide-react";
import { useUserSubscription } from "@/hooks/useUserSubscription";

const UserCredits: React.FC = () => {
  const { subscription, loading } = useUserSubscription();
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Seus Créditos</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                ❌ Nenhuma assinatura ativa encontrada
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usedCredits = subscription.total_credits - subscription.credits_remaining;
  const progressPercentage = subscription.total_credits > 0 ? (usedCredits / subscription.total_credits) * 100 : 0;
  
  const planNames: { [key: string]: string } = {
    "trial": "Teste Gratuito",
    "starter": "Plano Starter", 
    "master": "Plano Master"
  };

  const planColors: { [key: string]: string } = {
    "trial": "bg-gray-100 text-gray-800",
    "starter": "bg-blue-100 text-blue-800",
    "master": "bg-purple-100 text-purple-800"
  };

  const isExpired = subscription.expires_at && new Date(subscription.expires_at) < new Date();
  const isLowCredits = subscription.credits_remaining <= 10 && subscription.plan.name !== "trial";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Seus Créditos</CardTitle>
        <CreditCard className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">{subscription.credits_remaining}</span>
              <span className="text-sm text-gray-500">de {subscription.total_credits}</span>
            </div>
            <Badge className={planColors[subscription.plan.name] || "bg-gray-100 text-gray-800"}>
              {planNames[subscription.plan.name] || subscription.plan.name}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Mensagens usadas: {usedCredits}</span>
              <span>{progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          
          {subscription.expires_at && (
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-1" />
              Expira em: {new Date(subscription.expires_at).toLocaleDateString('pt-BR')}
            </div>
          )}
          
          {isExpired && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                <p className="text-sm text-red-800">
                  Plano expirado! Renove para continuar enviando mensagens.
                </p>
              </div>
            </div>
          )}
          
          {isLowCredits && !isExpired && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-orange-600 mr-2" />
                <p className="text-sm text-orange-800">
                  Poucos créditos restantes! Considere renovar seu plano.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCredits;
