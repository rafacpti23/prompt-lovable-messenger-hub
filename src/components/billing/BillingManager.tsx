
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, History, Package } from "lucide-react";
import UserCredits from "./UserCredits";
import PlanSelector from "./PlanSelector";
import TransactionHistory from "./TransactionHistory";

const BillingManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState("plans");

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Créditos do usuário sempre visível */}
        <div className="lg:w-1/3">
          <UserCredits />
        </div>
        
        {/* Área principal com tabs */}
        <div className="lg:w-2/3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="plans" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Planos</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center space-x-2">
                <History className="h-4 w-4" />
                <span>Histórico</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="plans">
              <PlanSelector />
            </TabsContent>
            
            <TabsContent value="history">
              <TransactionHistory />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default BillingManager;
