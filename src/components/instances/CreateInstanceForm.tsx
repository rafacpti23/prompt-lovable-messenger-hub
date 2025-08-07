
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onCreate: (instanceName: string) => void;
  creating: boolean;
}
export default function CreateInstanceForm({ onCreate, creating }: Props) {
  const [name, setName] = useState("");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Criar Nova Instância
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Nome da instância (ex: whatsapp-vendas)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={creating}
            />
          </div>
          <Button
            onClick={() => {
              if (name.trim() !== "") {
                onCreate(name.trim());
                setName("");
              }
            }}
            disabled={creating || name.trim() === ""}
          >
            {creating ? "Criando..." : "Criar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
