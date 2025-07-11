
// Configuração da Evolution API
export const getApiConfig = () => {
  const apiUrl = localStorage.getItem('evolution_api_url');
  const apiKey = localStorage.getItem('evolution_api_key');
  
  if (!apiUrl || !apiKey) {
    throw new Error('API não configurada. Configure a URL e API Key nas configurações.');
  }
  
  return { apiUrl, apiKey };
};

// Headers padrão para requests
export const getApiHeaders = () => {
  const { apiKey } = getApiConfig();
  return {
    'Content-Type': 'application/json',
    'apikey': apiKey,
  };
};

// Função para criar instância
export const createInstance = async (instanceName: string) => {
  const { apiUrl } = getApiConfig();
  const headers = getApiHeaders();

  const response = await fetch(`${apiUrl}/instance/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      instanceName,
      integration: 'WHATSAPP-BAILEYS'
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro ao criar instância: ${response.statusText}`);
  }

  return response.json();
};

// Função para conectar instância
export const connectInstance = async (instanceName: string) => {
  const { apiUrl } = getApiConfig();
  const headers = getApiHeaders();

  const response = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erro ao conectar instância: ${response.statusText}`);
  }

  return response.json();
};

// Função para buscar QR Code
export const getQrCode = async (instanceName: string) => {
  const { apiUrl } = getApiConfig();
  const headers = getApiHeaders();

  const response = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar QR Code: ${response.statusText}`);
  }

  const data = await response.json();
  return data.base64; // Retorna o QR code em base64
};

// Função para verificar status da instância
export const getInstanceStatus = async (instanceName: string) => {
  const { apiUrl } = getApiConfig();
  const headers = getApiHeaders();

  const response = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erro ao verificar status: ${response.statusText}`);
  }

  return response.json();
};

// Função para deletar instância
export const deleteInstance = async (instanceName: string) => {
  const { apiUrl } = getApiConfig();
  const headers = getApiHeaders();

  const response = await fetch(`${apiUrl}/instance/delete/${instanceName}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erro ao deletar instância: ${response.statusText}`);
  }

  return response.json();
};

// Verificar se API está configurada
export const isApiConfigured = () => {
  const apiUrl = localStorage.getItem('evolution_api_url');
  const apiKey = localStorage.getItem('evolution_api_key');
  return !!(apiUrl && apiKey);
};
