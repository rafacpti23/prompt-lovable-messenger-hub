
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, MessageSquare, Calendar } from "lucide-react";

interface UserCreditsProps {
  credits: number;
  totalCredits: number;
  plan: string;
  expiresAt?: string;
}

const UserCredits: React.FC<UserCreditsProps> = ({ 
  credits, 
  totalCredits, 
  plan, 
  expiresAt 
}) => {
  const usedCredits = totalCredits - credits;
  const progressPercentage = totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0;
  
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
              <span className="text-2xl font-bold">{credits}</span>
              <span className="text-sm text-gray-500">de {totalCredits}</span>
            </div>
            <Badge className={planColors[plan] || "bg-gray-100 text-gray-800"}>
              {planNames[plan] || plan}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Mensagens usadas: {usedCredits}</span>
              <span>{progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          
          {expiresAt && (
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-1" />
              Expira em: {new Date(expiresAt).toLocaleDateString('pt-BR')}
            </div>
          )}
          
          {credits <= 10 && plan !== "trial" && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                ⚠️ Poucos créditos restantes! Considere renovar seu plano.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCredits;
