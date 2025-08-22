import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  duration_days: number;
  is_active: boolean;
  enable_queue_sending: boolean;
  created_at: string;
}

const PlanManagement: React.FC = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [newPlan, setNewPlan] = useState({
    name: "",
    price: 0,
    credits: 0,
    duration_days: 30,
    enable_queue_sending: false,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Fix missing enable_queue_sending by mapping data
      const fixedData = (data || []).map((plan: any) => ({
        ...plan,
        enable_queue_sending: plan.enable_queue_sending ?? false,
      }));
      setPlans(fixedData);
    } catch (error: any) {
      toast({
        title: "Erro ao buscar planos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async () => {
    if (!newPlan.name || newPlan.price <= 0 || newPlan.credits <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos corretamente",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('plans')
        .insert({
          name: newPlan.name,
          price: newPlan.price,
          credits: newPlan.credits,
          duration_days: newPlan.duration_days,
          price_per_message: newPlan.price / newPlan.credits,
          enable_queue_sending: newPlan.enable_queue_sending,
        })
        .select()
        .single();

      if (error) throw error;

      // Fix missing enable_queue_sending in new plan data
      const fixedPlan = { ...data, enable_queue_sending: (data as any).enable_queue_sending ?? false };

      setPlans([fixedPlan, ...plans]);
      setNewPlan({ name: "", price: 0, credits: 0, duration_days: 30, enable_queue_sending: false });
      
      toast({
        title: "Sucesso",
        description: "Plano criado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar plano",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const togglePlanStatus = async (planId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('plans')
        .update({ is_active: !isActive })
        .eq('id', planId);

      if (error) throw error;

      setPlans(plans.map(plan => 
        plan.id === planId ? { ...plan, is_active: !isActive } : plan
      ));

      toast({
        title: "Sucesso",
        description: `Plano ${!isActive ? 'ativado' : 'desativado'} com sucesso!`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar plano",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleQueueSending = async (planId: string, enabled: boolean) => {
    try {
      // Use .update without generic to avoid type error
      const { error } = await supabase
        .from('plans')
        .update({ enable_queue_sending: enabled })
        .eq('id', planId);

      if (error) throw error;

      setPlans(plans.map(plan => 
        plan.id === planId ? { ...plan, enable_queue_sending: enabled } : plan
      ));

      toast({
        title: "Sucesso",
        description: `Envio por fila ${enabled ? 'habilitado' : 'desabilitado'} para o plano.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar plano",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando planos...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Gerenciamento de Planos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Criar novo plano */}
        <div className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Criar Novo Plano
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="plan-name">Nome do Plano</Label>
              <Input
                id="plan-name"
                value={newPlan.name}
                onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                placeholder="Ex: Plano Starter"
              />
            </div>
            
            <div>
              <Label htmlFor="plan-price">Preço (R$)</Label>
              <Input
                id="plan-price"
                type="number"
                min="0"
                step="0.01"
                value={newPlan.price}
                onChange={(e) => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            
            <div>
              <Label htmlFor="plan-credits">Créditos</Label>
              <Input
                id="plan-credits"
                type="number"
                min="1"
                value={newPlan.credits}
                onChange={(e) => setNewPlan({ ...newPlan, credits: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div>
              <Label htmlFor="plan-duration">Duração (dias)</Label>
              <Input
                id="plan-duration"
                type="number"
                min="1"
                value={newPlan.duration_days}
                onChange={(e) => setNewPlan({ ...newPlan, duration_days: parseInt(e.target.value) || 30 })}
              />
            </div>

            <div className="col-span-2 flex items-center space-x-2">
              <input
                type="checkbox"
                id="enable-queue-sending"
                checked={newPlan.enable_queue_sending}
                onChange={(e) => setNewPlan({ ...newPlan, enable_queue_sending: e.target.checked })}
              />
              <Label htmlFor="enable-queue-sending" className="mb-0 cursor-pointer">
                Habilitar envio por fila avançada (intervalos aleatórios)
              </Label>
            </div>
          </div>
          
          <Button onClick={createPlan}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Plano
          </Button>
        </div>

        {/* Lista de planos */}
        <div className="space-y-2">
          <h3 className="font-medium">Planos Existentes</h3>
          
          {plans.map((plan) => (
            <div key={plan.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{plan.name}</span>
                  <Badge variant={plan.is_active ? "default" : "secondary"}>
                    {plan.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  R$ {plan.price.toFixed(2)} • {plan.credits} créditos • {plan.duration_days} dias
                </div>
                <div className="text-xs text-gray-400">
                  R$ {(plan.price / plan.credits).toFixed(4)} por mensagem
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Envio por fila avançada: {plan.enable_queue_sending ? "Sim" : "Não"}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                >
                  {plan.is_active ? "Desativar" : "Ativar"}
                </Button>
                <Button
                  variant={plan.enable_queue_sending ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleQueueSending(plan.id, !plan.enable_queue_sending)}
                >
                  {plan.enable_queue_sending ? <Check className="mr-1" /> : null}
                  {plan.enable_queue_sending ? "Fila Ativa" : "Fila Inativa"}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {plans.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            Nenhum plano encontrado
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlanManagement;