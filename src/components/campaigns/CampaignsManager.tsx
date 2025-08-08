...
  const createCampaign = async (sendingMethod: 'batch' | 'queue', intervalConfig?: any[], scheduledFor?: string) => {
    if (!user || !newCampaign.name || !selectedInstanceId || !selectedGroup) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios (Instância, Nome, Grupo)", variant: "destructive" });
      return;
    }

    if (!scheduledFor || new Date(scheduledFor) <= new Date()) {
      toast({ title: "Erro", description: "Data e hora de agendamento devem ser preenchidas e futuras.", variant: "destructive" });
      return;
    }

    try {
      const { data: contacts, error: contactsError } = await supabase.from('contacts').select('id').eq('user_id', user.id).contains('tags', [selectedGroup]);
      if (contactsError) throw new Error("Erro ao buscar contatos do grupo.");
      if (!contacts || contacts.length === 0) {
        toast({ title: "Grupo vazio", description: `Nenhum contato encontrado no grupo "${selectedGroup}".`, variant: "destructive" });
        return;
      }
      const contactIds = contacts.map(c => c.id);

      const { error } = await supabase.from("campaigns").insert({
        user_id: user.id,
        instance_id: selectedInstanceId,
        name: newCampaign.name,
        message: newCampaign.message,
        media_url: mediaUrl,
        contact_ids: contactIds,
        status: "draft",
        sending_method: sendingMethod,
        interval_config: intervalConfig,
        scheduled_for: scheduledFor,  // <-- Ensure this is sent
      });
      if (error) throw error;

      toast({ title: "Sucesso", description: "Campanha criada com sucesso! Clique em 'Iniciar' para começar o envio." });
      handleCampaignCreated();
    } catch (error: any) {
      toast({ title: "Erro ao criar campanha", description: error.message, variant: "destructive" });
    }
  };
...