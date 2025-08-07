import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import {
  createInstance as createInstanceApi,
  getQrCode,
  connectInstance,
  deleteInstance as deleteInstanceApi,
} from "@/services/evolutionApi";
import { useUserSubscription } from "./useUserSubscription";

export interface Instance {
  id: string;
  instance_name: string;
  status: string | null;
  user_id: string;
  phone_number?: string | null;
  qr_code?: string | null;
}

export function useManageInstances() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { subscription, loading: subscriptionLoading } = useUserSubscription();

  // Fetch instances from Supabase
  const fetchInstances = useCallback(async () => {
    setLoading(true);
    if (!user) {
      setInstances([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("instances")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setInstances(data);
    }
    setLoading(false);
  }, [user]);

  // Setup realtime listener for 'instances'
  useEffect(() => {
    fetchInstances();
    if (!user) return;
    const channel = supabase
      .channel("public:instances")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "instances", filter: `user_id=eq.${user.id}` },
        (payload) => {
          fetchInstances();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchInstances]);

  // Helper para atualizar instância
  const updateInstance = useCallback(async (instanceId: string, data: any) => {
    await supabase
      .from("instances")
      .update(data)
      .eq("id", instanceId);
  }, []);

  // Criar instância
  const createInstance = async (newInstanceName: string) => {
    if (!newInstanceName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da instância é obrigatório",
        variant: "destructive",
      });
      return;
    }
    if (!user) {
      toast({
        title: "Precisa estar logado",
        description: "Faça login para criar uma instância.",
        variant: "destructive",
      });
      return;
    }

    // ** Validação de Plano e Limite **
    if (subscriptionLoading) {
      toast({ title: "Aguarde", description: "Verificando sua assinatura..." });
      return;
    }

    if (!subscription || subscription.status !== 'active') {
      toast({
        title: "Plano necessário",
        description: "Você precisa de uma assinatura ativa para criar instâncias.",
        variant: "destructive",
      });
      return;
    }

    const currentInstanceCount = instances.length;
    const planName = subscription.plan.name;
    let limit = 0;
    let canCreate = false;

    if (planName === 'trial') {
      limit = 1;
      if (currentInstanceCount < limit) canCreate = true;
    } else if (planName === 'starter') {
      limit = 3;
      if (currentInstanceCount < limit) canCreate = true;
    } else if (planName === 'master') {
      canCreate = true; // Ilimitado
    }

    if (!canCreate) {
      toast({
        title: "Limite de instâncias atingido",
        description: `Seu plano (${planName}) permite apenas ${limit} instância(s). Faça um upgrade para criar mais.`,
        variant: "destructive",
      });
      return;
    }

    // Registra na Evolution API
    await createInstanceApi(newInstanceName);

    // Insere no Supabase
    const { error: insertError } = await supabase.from("instances").insert([
      {
        instance_name: newInstanceName,
        user_id: user.id,
        integration: "WHATSAPP-BAILEYS",
        status: "disconnected"
      },
    ]);
    if (insertError) {
      toast({
        title: "Erro ao criar instância no Supabase",
        description: insertError.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Instância criada com sucesso!",
      description: `Instância ${newInstanceName} criada.`,
    });
    fetchInstances();
  };

  // Conectar instância (API + atualizar no Supabase)
  const connect = async (instance: Instance) => {
    try {
      const response = await connectInstance(instance.instance_name);
      console.log("Response from connect:", response);
      
      // Determinar novo status baseado no status atual
      let newStatus = "connecting";
      if (instance.status === "connected" || instance.status === "open") {
        newStatus = "disconnecting";
      }
      
      await updateInstance(instance.id, { status: newStatus });
      
      // Verificar status real após alguns segundos
      setTimeout(async () => {
        try {
          // Aqui você pode implementar uma função para verificar o status real da API
          // Por enquanto, vamos simular uma atualização baseada na resposta
          if (response?.status) {
            await updateInstance(instance.id, { status: response.status });
          }
        } catch (error) {
          console.error("Erro ao verificar status:", error);
        }
      }, 3000);
      
      toast({
        title: "Solicitação de conexão enviada!",
        description: "Aguarde o status atualizar.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao conectar",
        description: error?.message || "Falha ao conectar instância.",
        variant: "destructive",
      });
    }
  };

  // Mostrar QR Code (API + atualizar no Supabase)
  const showQr = async (instance: Instance, setQrModal: (v: any) => void) => {
    try {
      const qrBase64 = await getQrCode(instance.instance_name);
      await updateInstance(instance.id, {
        qr_code: qrBase64 || null,
        status: "pending",
      });
      setQrModal({ open: true, instanceName: instance.instance_name, qrBase64 });
    } catch (error: any) {
      toast({
        title: "Erro ao buscar QR Code",
        description: error?.message || "Falha ao buscar QR Code.",
        variant: "destructive",
      });
      setQrModal({ open: true, instanceName: instance.instance_name, qrBase64: undefined });
    }
  };

  // Deletar instância
  const remove = async (instance: Instance) => {
    try {
      await deleteInstanceApi(instance.instance_name);
      await supabase.from("instances").delete().eq("id", instance.id);
      toast({
        title: "Instância removida",
        description: "Instância deletada com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao deletar instância",
        description: error?.message || "Falha ao deletar instância.",
        variant: "destructive",
      });
    }
  };

  return {
    instances,
    loading,
    createInstance,
    connect,
    showQr,
    remove,
  };
}