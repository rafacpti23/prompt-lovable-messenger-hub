import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Plus, Search, Trash2, Upload, Edit, Move } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GroupSelector from "./GroupSelector";
import EditContactModal from "./EditContactModal";
import { supabase } from "@/integrations/supabase/client";

interface Contact {
  id: string;
  name: string;
  phone: string;
  group?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  tags?: string[];
  [key: string]: any;
}

interface ContactsManagerProps {
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  groups: string[];
  loading?: boolean;
  user?: any;
}

const ContactsManager: React.FC<ContactsManagerProps> = ({ contacts, setContacts, groups, loading, user }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [newContact, setNewContact] = useState({ name: "", phone: "", group: "" });
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [targetGroup, setTargetGroup] = useState("");
  const { toast } = useToast();

  const filteredContacts = contacts.filter(contact =>
    (contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone?.includes(searchTerm) ||
    (contact.group?.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleSelectContact = (contactId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedContacts(prev => [...prev, contactId]);
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedContacts(filteredContacts.map(c => c.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleMoveContacts = async () => {
    if (selectedContacts.length === 0 || !targetGroup) {
      toast({
        title: "Ação necessária",
        description: "Selecione contatos e um grupo de destino.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("contacts")
        .update({ tags: [targetGroup] })
        .in("id", selectedContacts);

      if (error) throw error;

      setContacts(prevContacts =>
        prevContacts.map(contact =>
          selectedContacts.includes(contact.id)
            ? { ...contact, group: targetGroup, tags: [targetGroup] }
            : contact
        )
      );

      toast({
        title: "Sucesso!",
        description: `${selectedContacts.length} contato(s) movido(s) para o grupo "${targetGroup}".`
      });

      setSelectedContacts([]);
      setTargetGroup("");
    } catch (error: any) {
      toast({
        title: "Erro ao mover contatos",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleCreateGroup = (group: string) => {
    if (groups.includes(group)) {
      setNewContact(c => ({ ...c, group }));
      toast({ title: "Grupo já existe", description: `Grupo '${group}' já está disponível.` });
      return;
    }
    setNewContact(c => ({ ...c, group }));
    toast({ title: "Grupo criado", description: `Grupo '${group}' foi adicionado.` });
  };

  const addContact = async () => {
    if (!newContact.name || !newContact.phone) {
      toast({
        title: "Erro",
        description: "Nome e telefone são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    if (!newContact.group) {
      toast({
        title: "Erro",
        description: "Selecione ou crie um grupo",
        variant: "destructive",
      });
      return;
    }
    if (!user?.id) {
      toast({ title: "Erro", description: "Não autenticado", variant: "destructive" });
      return;
    }

    const insertObj = {
      user_id: user.id,
      name: newContact.name,
      phone: newContact.phone,
      tags: [newContact.group],
    };

    const { data, error } = await supabase.from("contacts").insert([insertObj]).select().single();
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    setContacts([{ ...data, group: data.tags?.[0] || "" }, ...contacts]);
    setNewContact({ name: "", phone: "", group: "" });
    toast({
      title: "Contato adicionado",
      description: `${newContact.name} foi adicionado à lista`,
    });
  };

  const deleteContact = async (id: string) => {
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover contato", description: error.message, variant: "destructive" });
      return;
    }
    setContacts(contacts.filter(contact => contact.id !== id));
    toast({
      title: "Contato removido",
      description: "Contato deletado com sucesso",
    });
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setShowEditModal(true);
  };

  const handleContactUpdated = (updatedContact: Contact) => {
    setContacts(contacts.map(contact => 
      contact.id === updatedContact.id ? updatedContact : contact
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-foreground">Gerenciar Contatos</h2>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Novo Contato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Nome"
              value={newContact.name}
              onChange={(e) => setNewContact({...newContact, name: e.target.value})}
            />
            <Input
              placeholder="Telefone (+55 11 99999-9999)"
              value={newContact.phone}
              onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
            />
            <GroupSelector
              groups={groups}
              value={newContact.group}
              onChange={(group) => setNewContact({...newContact, group})}
              onCreateGroup={handleCreateGroup}
            />
            <Button onClick={addContact}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Buscar e Gerenciar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar contatos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importar CSV
            </Button>
          </div>
          {selectedContacts.length > 0 && (
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <h4 className="font-semibold">{selectedContacts.length} contato(s) selecionado(s)</h4>
              <div className="flex items-end gap-3">
                <div className="flex-grow">
                  <label className="text-sm font-medium">Mover para o grupo:</label>
                  <GroupSelector
                    groups={groups}
                    value={targetGroup}
                    onChange={setTargetGroup}
                    onCreateGroup={() => {}}
                  />
                </div>
                <Button onClick={handleMoveContacts} disabled={!targetGroup}>
                  <Move className="h-4 w-4 mr-2" />
                  Mover
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contatos ({filteredContacts.length})</CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
              />
              <label htmlFor="select-all" className="text-sm font-medium">Selecionar todos</label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500 animate-pulse">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Carregando contatos...</p>
            </div>
          ) : (
          <div className="space-y-3">
            {filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum contato encontrado</p>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-2 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <Checkbox
                      checked={selectedContacts.includes(contact.id)}
                      onCheckedChange={(checked) => handleSelectContact(contact.id, Boolean(checked))}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">{contact.phone}</p>
                      </div>
                      {contact.group && contact.group !== "" && (
                        <Badge variant="outline" className="text-xs px-1 py-0 mt-1">{contact.group}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(contact)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteContact(contact.id)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          )}
        </CardContent>
      </Card>

      <EditContactModal
        contact={editingContact}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onContactUpdated={handleContactUpdated}
        groups={groups}
      />
    </div>
  );
};

export default ContactsManager;