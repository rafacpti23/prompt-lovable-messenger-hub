
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Power, Trash2, MessageSquare } from "lucide-react";
import InstanceQrModal from "./InstanceQrModal";
import { useState } from "react";
import { type Instance } from "@/hooks/useManageInstances";

interface Props {
  instances: Instance[];
  loading: boolean;
  onShowQr: (instance: Instance, setQrModal: (o: any) => void) => void;
  onConnect: (instance: Instance) => void;
  onDelete: (instance: Instance) => void;
}
export default function InstanceList({ instances, loading, onShowQr, onConnect, onDelete }: Props) {
  const [qrModal, setQrModal] = useState<{ open: boolean; instanceName?: string; qrBase64?: string }>({ open: false });

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case "open":
      case "connected":
        return "bg-green-100 text-green-800";
      case "close":
      case "disconnected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const getStatusText = (status: string | null | undefined) => {
    switch (status) {
      case "open":
      case "connected":
        return "Conectado";
      case "close":
      case "disconnected":
        return "Desconectado";
      case "pending":
        return "Aguardando conexão";
      default:
        return "Desconhecido";
    }
  };

  return (
    <>
      <InstanceQrModal
        open={qrModal.open}
        instanceName={qrModal.instanceName}
        qrBase64={qrModal.qrBase64}
        onOpenChange={(open) => setQrModal((qrm) => ({ ...qrm, open }))}
      />
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Carregando instâncias...</div>
        ) : instances.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Nenhuma instância cadastrada.
          </div>
        ) : (
          instances.map((instance) => (
            <Card key={instance.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5 text-green-600" />
                      <span className="font-medium">{instance.instance_name}</span>
                    </div>
                    <Badge className={getStatusColor(instance.status)}>
                      {getStatusText(instance.status)}
                    </Badge>
                    {instance.phone_number && (
                      <span className="text-sm text-gray-500">{instance.phone_number}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {(instance.status === "close" ||
                      instance.status === "disconnected") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onShowQr(instance, setQrModal)}
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        QR Code
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onConnect(instance)}
                    >
                      <Power className="h-4 w-4 mr-2" />
                      {["connected", "open"].includes(instance.status ?? "")
                        ? "Desconectar"
                        : "Conectar"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(instance)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
