import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Brain, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AiMessageGeneratorProps {
  onMessageGenerated: (message: string) => void;
}

const AiMessageGenerator: React.FC<AiMessageGeneratorProps> = ({ onMessageGenerated }) => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Por favor, insira uma instrução para a IA.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-message', {
        body: { prompt },
      });

      if (error) {
        throw new Error(error.message);
      }
      
      if (data.error) {
        throw new Error(data.error);
      }

      onMessageGenerated(data.message);
      toast.success("Mensagem gerada com sucesso!");
      setOpen(false);
      setPrompt("");
    } catch (error: any) {
      console.error("Erro ao gerar mensagem com IA:", error);
      toast.error("Falha ao gerar mensagem", {
        description: error.message.includes("key") 
          ? "Verifique se a API Key da Groq está configurada corretamente nas Configurações."
          : error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" type="button" size="sm">
          <Brain className="h-4 w-4 mr-2" />
          Gerar com IA
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar Mensagem com IA</DialogTitle>
          <DialogDescription>
            Descreva o que você quer na mensagem. Ex: "Promoção de 50% em sapatos para o dia das mães".
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="ai-prompt">Sua instrução:</Label>
          <Textarea
            id="ai-prompt"
            placeholder="Ex: Crie uma mensagem para uma queima de estoque de eletrônicos com 30% de desconto."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              "Gerar Mensagem"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AiMessageGenerator;