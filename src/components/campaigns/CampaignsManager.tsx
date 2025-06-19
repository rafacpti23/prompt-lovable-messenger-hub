
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CampaignForm from "./CampaignForm";
import CampaignList from "./CampaignList";
import { useBilling } from "@/hooks/useBilling";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CampaignsManagerProps {
  contactGroups: string[];
}

const CampaignsManager: React.FC<CampaignsManagerProps> = ({ contactGroups }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { canSendMessage, subscription } = useBilling();

  const handleCampaignCreated = () => {
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Campanhas</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Crie e gerencie suas campanhas de mensagens
          </p>
        </div>
        
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button disabled={!canSendMessage()}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Campanha</DialogTitle>
            </DialogHeader>
            <CampaignForm 
              contactGroups={contactGroups}
              onSuccess={handleCampaignCreated}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Alertas sobre créditos */}
      {!canSendMessage() && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            {!subscription ? (
              "Você não possui uma assinatura ativa. Adquira um plano para criar campanhas."
            ) : subscription.credits_remaining <= 0 ? (
              "Você não possui créditos suficientes para criar campanhas. Renove seu plano."
            ) : subscription.expires_at && new Date(subscription.expires_at) < new Date() ? (
              "Sua assinatura expirou. Renove para continuar criando campanhas."
            ) : (
              "Não é possível criar campanhas no momento."
            )}
          </AlertDescription>
        </Alert>
      )}

      {subscription && subscription.credits_remaining <= 10 && subscription.credits_remaining > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Atenção: Você possui apenas {subscription.credits_remaining} crédito(s) restante(s). 
            Considere renovar seu plano.
          </AlertDescription>
        </Alert>
      )}

      <CampaignList />
    </div>
  );
};

export default CampaignsManager;
