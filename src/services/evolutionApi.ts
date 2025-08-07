import { supabase } from "@/integrations/supabase/client";

// Helper to invoke the backend function
const invokeManageInstance = async (action: string, instanceName:string) => {
  const { data, error } = await supabase.functions.invoke('manage-instance', {
    body: { action, payload: { instanceName } },
  });

  if (error) {
    // This is a network or function invocation error
    throw new Error(`Erro ao comunicar com o servidor: ${error.message}`);
  }
  
  if (data.error) {
    // This is an error returned from within the function logic
    throw new Error(data.error);
  }

  return data;
};

// Função para criar instância
export const createInstance = async (instanceName: string) => {
  return invokeManageInstance('create', instanceName);
};

// Função para conectar instância
export const connectInstance = async (instanceName: string) => {
  return invokeManageInstance('connect', instanceName);
};

// Função para buscar QR Code
export const getQrCode = async (instanceName: string) => {
  const data = await invokeManageInstance('qrcode', instanceName);
  return data.base64; // Retorna o QR code em base64
};

// Função para deletar instância
export const deleteInstance = async (instanceName: string) => {
  return invokeManageInstance('delete', instanceName);
};

// Esta função não é mais necessária, pois a configuração está no servidor.
export const isApiConfigured = () => {
  return true;
};