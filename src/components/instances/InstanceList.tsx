import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Power, Trash2, MessageSquare, UserCircle2, Phone, Settings, Copy, Eye, EyeOff, Users as UsersIcon, MessageSquare as MessageSquareIcon } from "lucide-react"; // Import necessary icons
import InstanceQrModal from "./InstanceQrModal";
import { useState } from "react";
import { type Instance } from "@/hooks/useManageInstances";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input"; // Import Input for the masked field

interface Props {
  instances: Instance[];
  loading: boolean;
  onShowQr: (instance: Instance, setQrModal: (o: any) => void) => void;
  onConnect: (instance: Instance) => void;
  onDelete: (instance: Instance) => void;
}
export default function InstanceList({ instances, loading, onShowQr, onConnect, onDelete }: Props) {
  const [qrModal, setQrModal] = useState<{ open: boolean; instanceName?: string; qrBase64?: string }>({ open: false });
  const [showToken, setShowToken] = useState<{ [key: string]: boolean }>({}); // State to toggle token visibility

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case "open":
      case "connected":
        return "bg-green-100 text-green-800";
      case "close":
      case "disconnected":
        return "bg-red-100 text-red-800";
      case "connecting":
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
      case "connecting":
        return "Conectando...";
      case "pending":
        return "Aguardando conexão";
      default:
        return "Desconhecido";
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    // Add a toast notification here if useToast is available
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
            <Card key={instance.id} className="p-4 bg-card rounded-2xl shadow-xl"> {/* Adjusted card styling */}
              <CardContent className="p-0 flex flex-col gap-4"> {/* Removed md:flex-row for better vertical stacking */}
                {/* Top section: Instance Name and Settings Icon */}
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xl text-foreground">{instance.instance_name}</span>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Settings className="h-5 w-5" />
                  </Button>
                </div>

                {/* Token/Password Field (Placeholder) */}
                <div className="relative flex items-center w-full">
                  <Input
                    type={showToken[instance.id] ? "text" : "password"}
                    value="************************" // Placeholder for token
                    readOnly
                    className="pr-20 bg-muted/50 border-border text-foreground"
                  />
                  <div className="absolute right-2 flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyToken("some-secret-token-here")} // Replace with actual token if available and safe
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowToken(prev => ({ ...prev, [instance.id]: !prev[instance.id] }))}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      {showToken[instance.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Profile Info and Stats */}
                <div className="flex items-start space-x-4 w-full">
                  <Avatar className="h-20 w-20 rounded-full border-2 border-primary"> {/* Larger avatar */}
                    <AvatarImage src={instance.profilePictureUrl || undefined} alt={instance.profileName || instance.instance_name} />
                    <AvatarFallback>
                      <MessageSquare className="h-10 w-10 text-green-600" /> {/* Larger fallback icon */}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    {instance.profileName && (
                      <p className="font-bold text-xl text-foreground truncate">{instance.profileName}</p>
                    )}
                    {instance.phone_number && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Phone className="h-4 w-4" /> {instance.phone_number}
                      </p>
                    )}
                    {instance.profileStatus && (
                      <p className="text-xs text-gray-400 italic mt-1 truncate">"{instance.profileStatus}"</p>
                    )}
                  </div>
                  {/* Placeholder for stats like in the screenshot */}
                  <div className="flex flex-col items-end space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <UsersIcon className="h-4 w-4" />
                      <span>{Math.floor(Math.random() * 5000) + 1000}</span> {/* Random placeholder */}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquareIcon className="h-4 w-4" />
                      <span>{Math.floor(Math.random() * 200000) + 10000}</span> {/* Random placeholder */}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-end gap-2 mt-4 w-full">
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
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}