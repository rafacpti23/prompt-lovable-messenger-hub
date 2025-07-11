import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

interface CampaignDetailsModalProps {
  campaignId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CampaignDetailsModal: React.FC<CampaignDetailsModalProps> = ({ campaignId, open, onOpenChange }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!campaignId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('scheduled_messages')
          .select('*, contact:contacts(name)')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error("Error fetching campaign messages:", error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchMessages();
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
            Acompanhe o status de envio para cada contato.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
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
          )}
          {messages.length === 0 && !loading && (
            <div className="text-center py-10 text-muted-foreground">
              Nenhuma mensagem encontrada para esta campanha.
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignDetailsModal;