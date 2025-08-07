import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import GroupSelector from "./GroupSelector";

interface Contact {
  id: string;
  name: string;
  phone: string;
  group?: string;
  tags?: string[];
}

interface EditContactModalProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactUpdated: (contact: Contact) => void;
  groups: string[];
}

const EditContactModal: React.FC<EditContactModalProps> = ({
  contact,
  open,
  onOpenChange,
  onContactUpdated,
  groups
}) => {
  const [editContact, setEditContact] = useState({ name: "", phone: "", group: "" });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (contact) {
      setEditContact({
        name: contact.name,
        phone: contact.phone,
        group: contact.group || contact.tags?.[0] || ""
      });
    }
  }, [contact]);

  const handleCreateGroup = (group: string) => {
    if (groups.includes(group)) {
      setEditContact(c => ({ ...c, group }));
      toast({ title: "Grupo já existe", description: `Grupo '${group}' já está disponível.` });
      return;
    }
    setEditContact(c => ({ ...c, group }));
    toast({ title: "Grupo criado", description: `Grupo '${group}' foi adicionado.` });
  };

  const updateContact = async () => {
    if (!contact || !editContact.name || !editContact.phone) {
      toast({
        title: "Erro",
        description: "Nome e telefone são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contacts")
        .update({
          name: editContact.name,
          phone: editContact.phone,
          tags: editContact.group ? [editContact.group] : []
        })
        .eq("id", contact.id)
        .select()
        .single();

      if (error) throw error;

      const updatedContact = {
        ...data,
        group: data.tags?.[0] || ""
      };

      onContactUpdated(updatedContact);
      onOpenChange(false);
      
      toast({
        title: "Sucesso",
        description: "Contato atualizado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar contato",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Contato</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Nome</Label>
            <Input
              id="edit-name"
              value={editContact.name}
              onChange={(e) => setEditContact({...editContact, name: e.target.value})}
              placeholder="Nome do contato"
            />
          </div>
          <div>
            <Label htmlFor="edit-phone">Telefone</Label>
            <Input
              id="edit-phone"
              value={editContact.phone}
              onChange={(e) => setEditContact({...editContact, phone: e.target.value})}
              placeholder="+55 11 99999-9999"
            />
          </div>
          <div>
            <Label htmlFor="edit-group">Grupo</Label>
            <GroupSelector
              groups={groups}
              value={editContact.group}
              onChange={(group) => setEditContact({...editContact, group})}
              onCreateGroup={handleCreateGroup}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={updateContact} disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditContactModal;