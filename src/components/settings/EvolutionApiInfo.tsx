
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Shield, Zap } from "lucide-react";

const EvolutionApiInfo: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-blue-600" />
          <span>Evolution API</span>
          <Badge variant="secondary">Integrada</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">API Segura e Confiável</h4>
          <p className="text-sm text-gray-600">
            Utilizamos a Evolution API para conectar com o WhatsApp de forma segura. 
            Todas as credenciais são armazenadas com segurança no Supabase.
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Shield className="h-4 w-4 text-green-600 mr-2" />
            <span>Credenciais protegidas no Supabase</span>
          </div>
          <div className="flex items-center text-sm">
            <Shield className="h-4 w-4 text-green-600 mr-2" />
            <span>Conexão criptografada</span>
          </div>
          <div className="flex items-center text-sm">
            <Shield className="h-4 w-4 text-green-600 mr-2" />
            <span>API não exposta no frontend</span>
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <h5 className="font-medium text-blue-800">Quer usar sua própria API?</h5>
          <p className="text-xs text-blue-700 mt-1">
            Você pode configurar sua própria instância da Evolution API nas configurações do sistema.
          </p>
        </div>

        <a
          href="https://github.com/EvolutionAPI/evolution-api"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          Saiba mais sobre a Evolution API
        </a>
      </CardContent>
    </Card>
  );
};

export default EvolutionApiInfo;
