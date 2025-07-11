
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone, Mail, Clock } from "lucide-react";

const ContactSection = () => {
  const handleWhatsAppContact = () => {
    const message = encodeURIComponent("Olá! Gostaria de saber mais sobre o WhatsApp Pro e seus planos de assinatura.");
    window.open(`https://wa.me/5527999082624?text=${message}`, '_blank');
  };

  return (
    <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white border-0 shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">
          Precisa de Ajuda? Fale Conosco!
        </CardTitle>
        <p className="text-green-100 text-lg">
          Nossa equipe está pronta para te ajudar a crescer
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <div className="flex justify-center">
              <MessageSquare className="h-8 w-8 text-green-200" />
            </div>
            <h4 className="font-semibold text-lg">WhatsApp</h4>
            <p className="text-green-100">(27) 99908-2624</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-center">
              <Clock className="h-8 w-8 text-blue-200" />
            </div>
            <h4 className="font-semibold text-lg">Horário</h4>
            <p className="text-blue-100">24/7 Disponível</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-center">
              <Mail className="h-8 w-8 text-purple-200" />
            </div>
            <h4 className="font-semibold text-lg">Suporte</h4>
            <p className="text-purple-100">Resposta Rápida</p>
          </div>
        </div>
        
        <div className="text-center">
          <Button 
            onClick={handleWhatsAppContact}
            className="bg-white text-green-600 hover:bg-green-50 font-bold text-lg px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            Falar no WhatsApp Agora
          </Button>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <p className="text-sm text-white/90">
            <strong>Dica:</strong> Mencione que veio do sistema e ganhe desconto especial no primeiro mês!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactSection;
