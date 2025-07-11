import React from "react";

interface MessagePreviewProps {
  message: string;
  messageType: "text" | "image" | "video";
  mediaPreview?: string;
}

const MessagePreview: React.FC<MessagePreviewProps> = ({
  message,
  messageType,
  mediaPreview
}) => {
  const sampleContact = {
    nome: "João Silva",
    telefone: "(11) 99999-9999"
  };

  const processedMessage = message
    .replace(/{{nome}}/g, sampleContact.nome)
    .replace(/{{telefone}}/g, sampleContact.telefone);

  return (
    <div className="max-w-sm mx-auto">
      {/* WhatsApp-like background */}
      <div className="min-h-96 p-4 whatsapp-bg rounded-lg">
        {/* Message bubble */}
        <div className="flex justify-end mb-4">
          <div className="bg-[#dcf8c6] dark:bg-[#056162] text-black dark:text-white p-2 rounded-lg max-w-xs shadow-md" style={{ borderTopRightRadius: '0' }}>
            {messageType !== "text" && mediaPreview && (
              <div className="mb-2">
                {messageType === "image" ? (
                  <img 
                    src={mediaPreview} 
                    alt="Preview" 
                    className="w-full rounded-lg max-h-48 object-cover"
                  />
                ) : (
                  <video 
                    src={mediaPreview} 
                    className="w-full rounded-lg max-h-48"
                    controls
                  />
                )}
              </div>
            )}
            {processedMessage && (
              <div className="whitespace-pre-wrap text-sm">
                {processedMessage}
              </div>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-300 mt-1 text-right">
              12:34 ✓✓
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center text-sm text-gray-600 mt-2">
        Preview usando dados de exemplo: {sampleContact.nome}
      </div>
    </div>
  );
};

export default MessagePreview;