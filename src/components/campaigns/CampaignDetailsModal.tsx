import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

interface CampaignDetailsModalProps {
  campaignId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CampaignDetailsModal: React.FC<CampaignDetailsModalProps> = ({ campaignId, open, onOpenChange }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!campaignId) return;
      setLoading(true);
      
      try {
        // Buscar informações da campanha
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('*, instance:instances(instance_name)')
          .eq('id', campaignId)
          .single();
        
        if (campaignError) throw campaignError;
        setCampaign(campaignData);
        
        // Buscar mensagens agendadas
        const { data: messagesData, error: messagesError } = await supabase
          .from('scheduled_messages')
          .select('*, contact:contacts(name)')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: true });
        
        if (messagesError) throw messagesError;
        setMessages(messagesData || []);
      } catch (error) {
        console.error("Error fetching campaign data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open, campaignId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Enviado</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Falhou</Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Detalhes da Campanha</DialogTitle>
          <DialogDescription>
            {campaign ? (
              <div className="mt-2 space-y-1">
                <p><strong>Nome:</strong> {campaign.name}</p>
                <p><strong>Instância:</strong> {campaign.instance?.instance_name}</p>
                <p><strong>Status:</strong> {campaign.status}</p>
                {campaign.scheduled_for && (
                  <p><strong>Agendada para:</strong> {new Date(campaign.scheduled_for).toLocaleString('pt-BR')}</p>
                )}
              </div>
            ) : (
              "Carregando informações da campanha..."
            )}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <h3 className="font-semibold mb-4">Mensagens ({messages.length})</h3>
              {messages.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contato</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Detalhes/Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.map((msg) => (
                      <TableRow key={msg.id}>
                        <TableCell>{msg.contact?.name || 'N/A'}</TableCell>
                        <TableCell>{msg.phone}</TableCell>
                        <TableCell>{getStatusBadge(msg.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {msg.status === 'failed' && msg.response?.error ? (
                            <span className="text-red-600">{msg.response.error}</span>
                          ) : msg.status === 'sent' ? (
                            'Enviado com sucesso'
                          ) : (
                            'Aguardando na fila'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-lg border">
                  <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Nenhuma mensagem encontrada para esta campanha.</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {campaign?.status === 'draft' 
                      ? "A campanha ainda está em rascunho. Clique em 'Iniciar' para criar a fila de mensagens." 
                      : "Verifique se a campanha foi iniciada corretamente."}
                  </p>
                </div>
              )}
            </>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignDetailsModal;