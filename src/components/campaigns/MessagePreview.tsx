
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
      <div 
        className="min-h-96 p-4"
        style={{
          background: "linear-gradient(to bottom, #dddbd1, #d2dbdc)",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      >
        {/* Message bubble */}
        <div className="flex justify-end mb-4">
          <div className="bg-green-500 text-white p-3 rounded-lg max-w-xs shadow-md">
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
            <div className="text-xs text-green-100 mt-1 text-right">
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
