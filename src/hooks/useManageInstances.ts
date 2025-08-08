import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import {
  createInstance as createInstanceApi,
  getQrCode,
  connectInstance,
  deleteInstance as deleteInstanceApi,
  fetchAllEvolutionInstances, // Import the new function
} from "@/services/evolutionApi";
import { useUserSubscription } from "./useUserSubscription";

export interface Instance {
  id: string;
  instance_name: string;
  status: string | null;
  user_id: string;
  phone_number?: string | null;
  qr_code?: string | null;
  // New fields from Evolution API
  profileName?: string | null;
  profilePictureUrl?: string | null;
  profileStatus?: string | null;
  owner?: string | null; // WhatsApp JID (e.g., 553198296801@s.whatsapp.net)
}

export function useManageInstances() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { subscription, loading: subscriptionLoading } = useUserSubscription();

  // Fetch instances from Supabase and Evolution API
  const fetchInstances = useCallback(async () => {
    setLoading(true);
    if (!user) {
      setInstances([]);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch instances from Supabase (user's registered instances)
      const { data: supabaseInstances, error: supabaseError } = await supabase
        .from("instances")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (supabaseError) throw supabaseError;

      // 2. Fetch all instances from Evolution API
      const evolutionInstancesRaw = await fetchAllEvolutionInstances();
      const evolutionInstancesMap = new Map<string, any>();
      if (Array.isArray(evolutionInstancesRaw)) {
        evolutionInstancesRaw.forEach((item: any) => {
          if (item.instance && item.instance.instanceName) {
            evolutionInstancesMap.set(item.instance.instanceName, item.instance);
          }
        });
      }

      // 3. Merge data
      const mergedInstances: Instance[] = supabaseInstances.map((sInstance: any) => {
        const eInstance = evolutionInstancesMap.get(sInstance.instance_name);
        return {
          ...sInstance,
          // Prioritize Evolution API status if available, otherwise use Supabase status
          status: eInstance?.status || sInstance.status,
          phone_number: eInstance?.owner?.split('@')[0] || sInstance.phone_number, // Use owner as phone number
          profileName: eInstance?.profileName || null,
          profilePictureUrl: eInstance?.profilePictureUrl || null,
          profileStatus: eInstance?.profileStatus || null,
          owner: eInstance?.owner || null,
        };
      });
      
      setInstances(mergedInstances);

    } catch (error: any) {
      console.error("Error fetching instances:", error);
      toast({
        title: "Erro ao carregar instâncias",
        description: error.message,
        variant: "destructive",
      });
      setInstances([]); // Clear instances on error
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

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

  // Helper para atualizar instância (Supabase only, Evolution API status is real-time)
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
      
      // Update Supabase status immediately for UI feedback
      await updateInstance(instance.id, { status: newStatus });
      
      // Re-fetch all instances to get the real-time status from Evolution API
      // This is important because the webhook might take a few seconds to update Supabase
      // and fetchInstances will get the latest from Evolution API directly.
      setTimeout(fetchInstances, 3000); // Re-fetch after a short delay

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
      // Update Supabase with QR code, status will be updated by webhook or next fetch
      await updateInstance(instance.id, {
        qr_code: qrBase64 || null,
        status: "pending", // Set to pending in Supabase
      });
      setQrModal({ open: true, instanceName: instance.instance_name, qrBase64 });
      setTimeout(fetchInstances, 3000); // Re-fetch to get actual status
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
      fetchInstances(); // Re-fetch to ensure UI is up-to-date
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