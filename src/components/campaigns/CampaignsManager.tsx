
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, Pause, RotateCcw, Trash2, Eye, Users, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { CampaignForm } from './CampaignForm';
import { CampaignDetailsModal } from './CampaignDetailsModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Campaign {
  id: string;
  name: string;
  message: string;
  media_url?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'paused' | 'completed' | 'cancelled';
  contact_ids: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
  instance_id: string;
  sending_method?: 'qstash' | 'advanced_queue';
  interval_config?: {
    min_delay: number;
    max_delay: number;
  };
  instances?: {
    instance_name: string;
    status: string;
  };
}

export const CampaignsManager = () => {
  const { campaigns, isLoading, refetch } = useCampaigns();
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'sending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paused':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3" />;
      case 'completed':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'cancelled':
      case 'paused':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const handleStartCampaign = async (campaign: Campaign) => {
    try {
      console.log('Starting campaign:', campaign.id, 'Method:', campaign.sending_method);
      
      if (campaign.sending_method === 'qstash') {
        // Use QStash method
        const { data, error } = await supabase.functions.invoke('qstash-sender', {
          body: { 
            campaignId: campaign.id,
            action: 'start_campaign'
          }
        });

        if (error) {
          console.error('QStash error:', error);
          throw new Error(`QStash error: ${error.message}`);
        }

        console.log('QStash response:', data);
        toast.success('Campanha iniciada com QStash!');
      } else {
        // Use Advanced Queue method with existing RPC function
        const { data, error } = await supabase.rpc('queue_and_activate_campaign', {
          campaign_id_param: campaign.id
        });

        if (error) {
          console.error('Advanced Queue error:', error);
          throw new Error(`Advanced Queue error: ${error.message}`);
        }

        console.log('Advanced Queue response:', data);
        toast.success('Campanha iniciada com Fila Avançada!');
      }

      await refetch();
    } catch (error) {
      console.error('Error starting campaign:', error);
      toast.error(`Erro ao iniciar campanha: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'paused', updated_at: new Date().toISOString() })
        .eq('id', campaignId);

      if (error) throw error;

      toast.success('Campanha pausada!');
      await refetch();
    } catch (error) {
      console.error('Error pausing campaign:', error);
      toast.error('Erro ao pausar campanha');
    }
  };

  const handleResumeCampaign = async (campaign: Campaign) => {
    try {
      await handleStartCampaign(campaign);
    } catch (error) {
      console.error('Error resuming campaign:', error);
      toast.error('Erro ao retomar campanha');
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta campanha?')) return;

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      toast.success('Campanha excluída!');
      await refetch();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Erro ao excluir campanha');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCampaign(null);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Campanhas</h2>
          <p className="text-muted-foreground">
            Crie e gerencie suas campanhas de WhatsApp
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CampaignForm
              campaign={editingCampaign}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowForm(false);
                setEditingCampaign(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {campaigns?.map((campaign: Campaign) => (
          <Card key={campaign.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{campaign.name}</h3>
                    <Badge className={getStatusColor(campaign.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(campaign.status)}
                        {campaign.status}
                      </div>
                    </Badge>
                    {campaign.sending_method && (
                      <Badge variant="outline">
                        {campaign.sending_method === 'qstash' ? 'QStash' : 'Fila Avançada'}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {campaign.contact_ids?.length || 0} contatos
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
                    </div>
                    {campaign.instances?.instance_name && (
                      <div>Instância: {campaign.instances.instance_name}</div>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {campaign.message}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCampaign(campaign)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  {campaign.status === 'draft' || campaign.status === 'scheduled' ? (
                    <Button
                      size="sm"
                      onClick={() => handleStartCampaign(campaign)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  ) : campaign.status === 'sending' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePauseCampaign(campaign.id)}
                    >
                      <Pause className="h-4 w-4" />
                    </Button>
                  ) : campaign.status === 'paused' ? (
                    <Button
                      size="sm"
                      onClick={() => handleResumeCampaign(campaign)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  ) : null}

                  {(campaign.status === 'draft' || campaign.status === 'completed' || campaign.status === 'cancelled') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {campaigns?.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Nenhuma campanha encontrada</p>
                <p className="text-sm">Crie sua primeira campanha para começar a enviar mensagens</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedCampaign && (
        <CampaignDetailsModal
          campaign={selectedCampaign}
          open={!!selectedCampaign}
          onOpenChange={(open) => !open && setSelectedCampaign(null)}
        />
      )}
    </div>
  );
};
