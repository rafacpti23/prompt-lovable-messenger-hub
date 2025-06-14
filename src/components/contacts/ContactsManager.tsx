
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Upload, Search, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  name: string;
  phone: string;
  tags: string[];
  createdAt: string;
}

const ContactsManager = () => {
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: "1",
      name: "João Silva",
      phone: "+55 11 99999-0001",
      tags: ["cliente", "vip"],
      createdAt: "2024-01-15"
    },
    {
      id: "2",
      name: "Maria Santos",
      phone: "+55 11 99999-0002", 
      tags: ["prospect"],
      createdAt: "2024-01-14"
    },
    {
      id: "3",
      name: "Pedro Oliveira",
      phone: "+55 11 99999-0003",
      tags: ["cliente"],
      createdAt: "2024-01-13"
    }
  ]);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    tags: ""
  });
  const { toast } = useToast();

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm) ||
    contact.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone) {
      toast({
        title: "Erro",
        description: "Nome e telefone são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const contact: Contact = {
      id: Date.now().toString(),
      name: newContact.name,
      phone: newContact.phone,
      tags: newContact.tags.split(",").map(tag => tag.trim()).filter(tag => tag),
      createdAt: new Date().toISOString().split('T')[0]
    };

    setContacts([...contacts, contact]);
    setNewContact({ name: "", phone: "", tags: "" });
    setShowAddDialog(false);

    toast({
      title: "Contato adicionado!",
      description: "O contato foi salvo com sucesso"
    });
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Simulate CSV import
    const mockImportedContacts: Contact[] = [
      {
        id: Date.now().toString(),
        name: "Contato Importado 1",
        phone: "+55 11 99999-1001",
        tags: ["importado"],
        createdAt: new Date().toISOString().split('T')[0]
      },
      {
        id: (Date.now() + 1).toString(),
        name: "Contato Importado 2", 
        phone: "+55 11 99999-1002",
        tags: ["importado"],
        createdAt: new Date().toISOString().split('T')[0]
      }
    ];

    setContacts([...contacts, ...mockImportedContacts]);
    setShowImportDialog(false);

    toast({
      title: "Importação concluída!",
      description: `${mockImportedContacts.length} contatos foram importados`
    });
  };

  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter(contact => contact.id !== id));
    toast({
      title: "Contato removido",
      description: "O contato foi excluído com sucesso"
    });
  };

  const downloadCSVTemplate = () => {
    const csvContent = "nome,telefone,tags\nJoão Silva,+5511999990001,cliente vip\nMaria Santos,+5511999990002,prospect";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_contatos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Contatos</h2>
          <p className="text-gray-600">Organize sua lista de contatos para campanhas</p>
        </div>
        
        <div className="flex space-x-2">
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Importar CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar Contatos via CSV</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Arquivo CSV</Label>
                  <Input type="file" accept=".csv" onChange={handleImportCSV} />
                  <p className="text-xs text-gray-500 mt-1">
                    Formato: nome, telefone, tags (separadas por espaço)
                  </p>
                </div>
                <Button variant="outline" onClick={downloadCSVTemplate} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Modelo CSV
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Contato
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Contato</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    placeholder="João Silva"
                    value={newContact.name}
                    onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="+55 11 99999-9999"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                  <Input
                    id="tags"
                    placeholder="cliente, vip, interessado"
                    value={newContact.tags}
                    onChange={(e) => setNewContact({...newContact, tags: e.target.value})}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddContact}>
                    Adicionar Contato
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar contatos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{contacts.length}</div>
            <div className="text-sm text-gray-500">Total de Contatos</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{filteredContacts.length}</div>
            <div className="text-sm text-gray-500">Filtrados</div>
          </div>
        </Card>
      </div>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Lista de Contatos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.phone}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(contact.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteContact(contact.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredContacts.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "Nenhum contato encontrado" : "Nenhum contato cadastrado"}
              </h3>
              <p className="text-gray-600">
                {searchTerm ? "Tente ajustar os termos da busca" : "Adicione seu primeiro contato para começar"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactsManager;
