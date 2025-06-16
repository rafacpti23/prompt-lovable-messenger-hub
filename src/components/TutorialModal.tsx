
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { HelpCircle, Clock, Zap, Settings } from "lucide-react";

const TutorialModal = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HelpCircle className="h-4 w-4 mr-2" />
          Tutorial Agendamento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tutorial: Sistema de Agendamento de Campanhas
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            
            {/* Como Funciona */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                Como Funciona o Sistema
              </h3>
              <div className="space-y-3 text-sm">
                <p>O sistema de agendamento funciona da seguinte forma:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Criação:</strong> Campanhas são criadas como "Rascunho"</li>
                  <li><strong>Agendamento:</strong> Ao clicar "Iniciar", a campanha fica "Agendada" para execução imediata</li>
                  <li><strong>Execução:</strong> O sistema verifica campanhas agendadas e envia mensagens uma por vez</li>
                  <li><strong>Intervalo:</strong> Respeita o intervalo configurado entre mensagens (padrão: 5 segundos)</li>
                </ul>
              </div>
            </section>

            <Separator />

            {/* Timezone */}
            <section>
              <h3 className="text-lg font-semibold mb-3">⏰ Fuso Horário</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Sistema:</strong> Usa UTC (Coordinated Universal Time) internamente</p>
                <p><strong>Brasil:</strong> UTC-3 (Horário de Brasília)</p>
                <p><strong>Conversão:</strong> O sistema converte automaticamente os horários</p>
                <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                  <p className="font-medium">Exemplo:</p>
                  <p>20:18 (Brasil) = 23:18 (UTC no banco de dados)</p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Opções de Automação */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-500" />
                Opções de Automação
              </h3>
              
              <div className="space-y-4">
                {/* Opção 1 - Supabase pg_cron */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-green-600 mb-2">1. Supabase pg_cron (Recomendado)</h4>
                  <p className="text-sm mb-3">Execução automática pelo próprio Supabase, sem dependências externas.</p>
                  
                  <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                    <p className="font-bold mb-2">SQL para configurar (executar no SQL Editor):</p>
                    <pre className="whitespace-pre-wrap">{`-- Ativar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar job que executa a cada minuto
SELECT cron.schedule(
    'dispatch-campaign-messages',
    '* * * * *',
    $$
    SELECT net.http_post(
        url := 'https://qjqhepntrlgfgpfhpvom.supabase.co/functions/v1/campaign-dispatcher',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcWhlcG50cmxnZmdwZmhwdm9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MjY2MDUsImV4cCI6MjA2MTIwMjYwNX0.S5MdoJyi-xh3aE7hQkciC4haIT_8ObZqAER9RK2iU_w"}'::jsonb,
        body := '{}'::jsonb
    );
    $$
);`}</pre>
                  </div>
                  
                  <div className="mt-3 text-sm">
                    <p className="font-medium">Vantagens:</p>
                    <ul className="list-disc list-inside ml-4">
                      <li>Totalmente automático</li>
                      <li>Não depende de serviços externos</li>
                      <li>Execução confiável</li>
                    </ul>
                  </div>
                </div>

                {/* Opção 2 - n8n */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-blue-600 mb-2">2. n8n (Alternativa Externa)</h4>
                  <p className="text-sm mb-3">Usando n8n para automação externa.</p>
                  
                  <div className="space-y-2 text-sm">
                    <p><strong>Configuração:</strong></p>
                    <ul className="list-disc list-inside ml-4">
                      <li>Trigger: Schedule Trigger (a cada 1 minuto)</li>
                      <li>Node: HTTP Request</li>
                      <li>Method: POST</li>
                      <li>URL: https://qjqhepntrlgfgpfhpvom.supabase.co/functions/v1/campaign-dispatcher</li>
                      <li>Headers: Content-Type: application/json</li>
                      <li>Body: {"{}"}</li>
                    </ul>
                  </div>
                </div>

                {/* Opção 3 - Manual */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-orange-600 mb-2">3. Teste Manual</h4>
                  <p className="text-sm mb-3">Para testes ou uso esporádico.</p>
                  
                  <div className="space-y-2 text-sm">
                    <p><strong>Botão "Testar Disparo":</strong> No Dashboard para execução manual</p>
                    <p><strong>Postman/cURL:</strong> Para testes de API</p>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Status das Campanhas */}
            <section>
              <h3 className="text-lg font-semibold mb-3">📊 Status das Campanhas</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-gray-400 rounded"></span>
                    <span><strong>Rascunho:</strong> Criada, não agendada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-orange-400 rounded"></span>
                    <span><strong>Agendada:</strong> Pronta para envio</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-400 rounded"></span>
                    <span><strong>Ativa:</strong> Enviando mensagens</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-400 rounded"></span>
                    <span><strong>Concluída:</strong> Todas enviadas</span>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Troubleshooting */}
            <section>
              <h3 className="text-lg font-semibold mb-3">🔧 Solução de Problemas</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Mensagens não enviadas:</p>
                  <ul className="list-disc list-inside ml-4">
                    <li>Verifique se a instância WhatsApp está conectada</li>
                    <li>Confirme se há contatos na campanha</li>
                    <li>Check os logs da Edge Function</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium">Horários incorretos:</p>
                  <ul className="list-disc list-inside ml-4">
                    <li>Sistema usa UTC internamente</li>
                    <li>Interface mostra horário brasileiro</li>
                    <li>Conversão é automática</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TutorialModal;
