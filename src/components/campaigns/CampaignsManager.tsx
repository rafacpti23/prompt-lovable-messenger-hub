
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Send, Calendar, Clock, Users, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

interface Campaign {
  id: string;
  name: string;
  message: string;
  instance_id: string;
  contact_ids: string[];
  scheduled_for?: string;
  status: string;
  pause_between_messages: number;
  created_at: string;
  instance?: {
    instance_name: string;
    status: string;
  };
}

interface Instance {
  id: string;
  instance_name: string;
  status: string;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
}

const CampaignsManager = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    message: "",
    instance_id: "",
    scheduled_for: "",
    pause_between_messages: 5
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchCampaigns();
      fetchInstances();
      fetchContacts();
    }
  }, [user]);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          instance:instances(instance_name, status)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar campanhas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInstances = async () => {
    try {
      const { data, error } = await supabase
        .from('instances')
        .select('id, instance_name, status')
        .eq('user_id', user?.id)
        .eq('status', 'connected');

      if (error) throw error;
      setInstances(data || []);
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, phone')
        .eq('user_id', user?.id);

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.message || !newCampaign.instance_id || selectedContacts.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const campaignData = {
        user_id: user?.id,
        name: newCampaign.name,
        message: newCampaign.message,
        instance_id: newCampaign.instance_id,
        contact_ids: selectedContacts,
        scheduled_for: newCampaign.scheduled_for || null,
        pause_between_messages: newCampaign.pause_between_messages,
        status: newCampaign.scheduled_for ? 'scheduled' : 'draft'
      };

      const { data, error } = await supabase
        .from('campaigns')
        .insert([campaignData])
        .select()
        .single();

      if (error) throw error;

      // Se agendado, criar mensagens programadas
      if (newCampaign.scheduled_for) {
        const scheduledMessages = selectedContacts.map((contactId, index) => {
          const contact = contacts.find(c => c.id === contactId);
          const messageTime = new Date(newCampaign.scheduled_for);
          messageTime.setSeconds(messageTime.getSeconds() + (index * newCampaign.pause_between_messages));

          return {
            campaign_id: data.id,
            contact_id: contactId,
            phone: contact?.phone || '',
            message: newCampaign.message.replace(/\{\{nome\}\}/g, contact?.name || ''),
            scheduled_for: messageTime.toISOString()
          };
        });

        const { error: scheduleError } = await supabase
          .from('scheduled_messages')
          .insert(scheduledMessages);

        if (scheduleError) throw scheduleError;
      }

      setNewCampaign({
        name: "",
        message: "",
        instance_id: "",
        scheduled_for: "",
        pause_between_messages: 5
      });
      setSelectedContacts([]);
      setShowCreateDialog(false);
      fetchCampaigns();

      toast({
        title: "Campanha criada!",
        description: newCampaign.scheduled_for 
          ? "Campanha agendada com sucesso" 
          : "Campanha salva como rascunho"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar campanha",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCampaigns(campaigns.filter(campaign => campaign.id !== id));
      toast({
        title: "Campanha excluída",
        description: "A campanha foi removida com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir campanha",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent": return "bg-green-100 text-green-800";
      case "sending": return "bg-blue-100 text-blue-800";
      case "scheduled": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "sent": return "Enviada";
      case "sending": return "Enviando";
      case "scheduled": return "Agendada";
      case "failed": return "Falha";
      default: return "Rascunho";
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('pt-BR');
  };

  const handleContactSelection = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts([...selectedContacts, contactId]);
    } else {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Campanhas</h2>
          <p className="text-gray-600">Crie e gerencie suas campanhas de mensagens</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Campanha</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="campaignName">Nome da Campanha</Label>
                <Input
                  id="campaignName"
                  placeholder="ex: Promoção Black Friday"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  placeholder="Olá {{nome}}, temos uma oferta especial para você!"
                  value={newCampaign.message}
                  onChange={(e) => setNewCampaign({...newCampaign, message: e.target.value})}
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {`{{nome}}`} para personalizar com o nome do contato
                </p>
              </div>
              
              <div>
                <Label htmlFor="instance">Instância</Label>
                <Select 
                  value={newCampaign.instance_id} 
                  onValueChange={(value) => setNewCampaign({...newCampaign, instance_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma instância conectada" />
                  </SelectTrigger>
                  <SelectContent>
                    {instances.map((instance) => (
                      <SelectItem key={instance.id} value={instance.id}>
                        {instance.instance_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Selecionar Contatos ({selectedContacts.length} selecionados)</Label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={contact.id}
                        checked={selectedContacts.includes(contact.id)}
                        onCheckedChange={(checked) => 
                          handleContactSelection(contact.id, checked as boolean)
                        }
                      />
                      <label htmlFor={contact.id} className="text-sm flex-1 cursor-pointer">
                        {contact.name} - {contact.phone}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduledFor">Agendar para (opcional)</Label>
                  <Input
                    id="scheduledFor"
                    type="datetime-local"
                    value={newCampaign.scheduled_for}
                    onChange={(e) => setNewCampaign({...newCampaign, scheduled_for: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="pauseBetween">Pausa entre mensagens (segundos)</Label>
                  <Input
                    id="pauseBetween"
                    type="number"
                    min="1"
                    value={newCampaign.pause_between_messages}
                    onChange={(e) => setNewCampaign({...newCampaign, pause_between_messages: parseInt(e.target.value) || 5})}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateCampaign}>
                  Criar Campanha
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {instances.length === 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <p className="text-yellow-800">
              ⚠️ Você precisa ter pelo menos uma instância conectada para criar campanhas.
            </p>
          </CardContent>
        </Card>
      )}

      {contacts.length === 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-blue-800">
              ℹ️ Você precisa ter contatos cadastrados para criar campanhas.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{campaign.name}</CardTitle>
                <Badge className={getStatusColor(campaign.status)}>
                  {getStatusText(campaign.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <p><strong>Instância:</strong> {campaign.instance?.instance_name}</p>
                <p><strong>Contatos:</strong> {campaign.contact_ids.length}</p>
                <p><strong>Pausa:</strong> {campaign.pause_between_messages}s</p>
                {campaign.scheduled_for && (
                  <p><strong>Agendado para:</strong> {formatDateTime(campaign.scheduled_for)}</p>
                )}
                <p><strong>Criado em:</strong> {formatDateTime(campaign.created_at)}</p>
              </div>

              <div className="bg-gray-50 p-3 rounded text-sm">
                <strong>Mensagem:</strong>
                <p className="mt-1">{campaign.message.substring(0, 100)}...</p>
              </div>

              <div className="flex space-x-2">
                {campaign.status === 'draft' && (
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
                {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                  <Button size="sm" variant="outline" className="flex-1">
                    <Send className="h-4 w-4 mr-2" />
                    Enviar
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleDeleteCampaign(campaign.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {campaigns.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma campanha criada
            </h3>
            <p className="text-gray-600 mb-4">
              Crie sua primeira campanha para começar a enviar mensagens
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Campanha
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CampaignsManager;
