import React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GroupSelector from "./GroupSelector";

interface Contact {
  id: number;
  name: string;
  phone: string;
  group: string;
}
interface ContactsManagerProps {
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  groups: string[];
}
const ContactsManager: React.FC<ContactsManagerProps> = ({ contacts, setContacts, groups }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [newContact, setNewContact] = useState({ name: "", phone: "", group: "" });
  const { toast } = useToast();

  // Não precisamos mais do estado local groups, pois agora vem via props do pai

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm) ||
    contact.group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateGroup = (group: string) => {
    // Se já existe, só seleciona.
    if (groups.includes(group)) {
      setNewContact(c => ({ ...c, group }));
      toast({ title: "Grupo já existe", description: `Grupo '${group}' já está disponível.` });
      return;
    }
    // cria um contato temporário só com o grupo, para forçar derivação
    setNewContact(c => ({ ...c, group }));
    toast({ title: "Grupo criado", description: `Grupo '${group}' foi adicionado.` });
    // Opcionalmente criaremos (como melhoria futura) um comando para apenas adicionar grupos sem contato.
  };

  const addContact = () => {
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

    const contact = {
      id: Date.now(),
      ...newContact
    };

    setContacts([...contacts, contact]);
    setNewContact({ name: "", phone: "", group: "" });
    
    toast({
      title: "Contato adicionado",
      description: `${newContact.name} foi adicionado à lista`,
    });
  };

  const deleteContact = (id: number) => {
    setContacts(contacts.filter(contact => contact.id !== id));
    toast({
      title: "Contato removido",
      description: "Contato deletado com sucesso",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Contatos</h2>
        </div>
      </div>

      {/* Adicionar Contato */}
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

      {/* Busca e Importação */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar e Importar</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Lista de Contatos */}
      <Card>
        <CardHeader>
          <CardTitle>Contatos ({filteredContacts.length})</CardTitle>
        </CardHeader>
        <CardContent>
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
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-gray-500">{contact.phone}</p>
                    </div>
                    {contact.group && (
                      <Badge variant="outline">{contact.group}</Badge>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteContact(contact.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactsManager;
