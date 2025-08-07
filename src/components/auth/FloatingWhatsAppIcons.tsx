
import React from 'react';
import { MessageSquare } from 'lucide-react';

const FloatingWhatsAppIcons = () => {
  // Criar múltiplos ícones flutuantes com animações diferentes
  const icons = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: i * 2,
    duration: 8 + (i % 3) * 2,
    size: 24 + (i % 3) * 8,
    opacity: 0.1 + (i % 3) * 0.1,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {icons.map((icon) => (
        <div
          key={icon.id}
          className="absolute animate-float"
          style={{
            left: `${10 + (icon.id * 12) % 80}%`,
            animationDelay: `${icon.delay}s`,
            animationDuration: `${icon.duration}s`,
            opacity: icon.opacity,
          }}
        >
          <MessageSquare 
            size={icon.size} 
            className="text-green-500"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.3))',
            }}
          />
        </div>
      ))}
      
      {/* Adicionar alguns ícones extras com movimento diagonal */}
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={`diagonal-${i}`}
          className="absolute animate-float-diagonal"
          style={{
            right: `${15 + (i * 20) % 60}%`,
            animationDelay: `${i * 3}s`,
            animationDuration: `${10 + i * 2}s`,
            opacity: 0.08,
          }}
        >
          <MessageSquare 
            size={32 + i * 4} 
            className="text-blue-500"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.2))',
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default FloatingWhatsAppIcons;
