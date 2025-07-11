import React, { useEffect, useState } from 'react';
import { Brain, Image, Send, Users } from 'lucide-react';

const features = [
  {
    icon: <Brain className="h-7 w-7 text-purple-300" />,
    title: "Geração de Mensagens com IA",
    description: "Crie campanhas persuasivas em segundos com o poder da inteligência artificial."
  },
  {
    icon: <Image className="h-7 w-7 text-blue-300" />,
    title: "Repositório de Mídia",
    description: "Organize e reutilize suas imagens e vídeos em todas as suas campanhas."
  },
  {
    icon: <Send className="h-7 w-7 text-green-300" />,
    title: "Campanhas Automatizadas",
    description: "Agende envios, segmente contatos e acompanhe os resultados em tempo real."
  },
  {
    icon: <Users className="h-7 w-7 text-yellow-300" />,
    title: "Múltiplas Instâncias",
    description: "Gerencie diversos números de WhatsApp em uma única plataforma centralizada."
  }
];

const AnimatedFeatureList = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6 mt-8">
      {features.map((feature, index) => (
        <div
          key={index}
          className={`flex items-start gap-4 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: `${index * 150}ms` }}
        >
          <div className="bg-white/10 p-3 rounded-lg">
            {feature.icon}
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">{feature.title}</h3>
            <p className="text-white/70">{feature.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnimatedFeatureList;