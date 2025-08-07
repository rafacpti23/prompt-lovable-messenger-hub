
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface InstanceQrModalProps {
  open: boolean;
  instanceName?: string;
  qrBase64?: string | null;
  onOpenChange: (open: boolean) => void;
}

export default function InstanceQrModal({ open, instanceName, qrBase64, onOpenChange }: InstanceQrModalProps) {
  // Garante que só adiciona o prefixo se necessário.
  const getQrSrc = () => {
    if (!qrBase64) return "";
    return qrBase64.startsWith("data:image") ? qrBase64 : `data:image/png;base64,${qrBase64}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs flex flex-col items-center">
        <DialogHeader>
          <DialogTitle>QR Code - {instanceName}</DialogTitle>
        </DialogHeader>
        {qrBase64 ? (
          <img
            src={getQrSrc()}
            alt="QR Code"
            className="w-56 h-56 object-contain border rounded mx-auto"
            style={{ background: "#fff" }}
          />
        ) : (
          <div className="w-56 h-56 flex items-center justify-center text-gray-400">
            Nenhum QR code gerado.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
