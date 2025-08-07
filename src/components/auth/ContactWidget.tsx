import React from 'react';
import { MessageSquare } from 'lucide-react';

const ContactWidget = () => {
  const handleContact = () => {
    window.open('https://wa.me/5527999082624', '_blank');
  };

  return (
    <button
      onClick={handleContact}
      className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-transform transform hover:scale-110 z-50 animate-pulse"
      aria-label="Fale conosco no WhatsApp"
    >
      <MessageSquare className="h-8 w-8" />
    </button>
  );
};

export default ContactWidget;