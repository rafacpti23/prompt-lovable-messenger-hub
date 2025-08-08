import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Power, Trash2, MessageSquare, UserCircle2, Phone, Settings, Copy, Eye, EyeOff } from "lucide-react";
import InstanceQrModal from "./InstanceQrModal";
import { useState } from "react";
import { type Instance } from "@/hooks/useManageInstances";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

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
      {/* Adjusted grid for more columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500 col-span-full">Carregando instâncias...</div>
        ) : instances.length === 0 ? (
          <div className="text-center py-12 text-gray-400 col-span-full">
            Nenhuma instância cadastrada.
          </div>
        ) : (
          instances.map((instance) => (
            {/* Added max-w-xs and mx-auto for centering */}
            <Card key={instance.id} className="p-4 bg-card rounded-2xl shadow-xl max-w-xs mx-auto w-full">
              {/* Reduced gap */}
              <CardContent className="p-0 flex flex-col gap-3">
                {/* Top section: Instance Name and Settings Icon */}
                <div className="flex items-center justify-between w-full">
                  {/* Smaller font */}
                  <span className="font-bold text-lg text-foreground truncate">{instance.instance_name}</span>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground ml-auto">
                    {/* Smaller icon */}
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>

                {/* Profile Info and Status */}
                {/* Reduced space-x */}
                <div className="flex items-center space-x-3 w-full">
                  {/* Smaller avatar */}
                  <Avatar className="h-14 w-14 rounded-full border-2 border-primary">
                    <AvatarImage src={instance.profilePictureUrl || undefined} alt={instance.profileName || instance.instance_name} />
                    {/* Smaller fallback icon */}
                    <AvatarFallback>
                      <MessageSquare className="h-7 w-7 text-green-600" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    {instance.profileName && (
                      {/* Smaller font */}
                      <p className="font-bold text-base text-foreground truncate">{instance.profileName}</p>
                    )}
                    {instance.phone_number && (
                      {/* Smaller font, reduced mt */}
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" /> {instance.phone_number}
                      </p>
                    )}
                    {instance.profileStatus && (
                      {/* Reduced mt */}
                      <p className="text-xs text-gray-400 italic mt-0.5 truncate">"{instance.profileStatus}"</p>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="w-full text-center">
                  <Badge className={getStatusColor(instance.status)}>
                    {getStatusText(instance.status)}
                  </Badge>
                </div>

                {/* Token/Password Field */}
                <div className="relative flex items-center w-full">
                  <Input
                    type={showToken[instance.id] ? "text" : "password"}
                    value="************************" // Placeholder for token
                    readOnly
                    {/* Smaller text, reduced height */}
                    className="pr-20 bg-muted/50 border-border text-foreground text-xs h-8"
                  />
                  {/* Reduced space-x */}
                  <div className="absolute right-1 flex items-center space-x-0.5">
                    {/* Smaller buttons */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyToken("some-secret-token-here")}
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    {/* Smaller buttons */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowToken(prev => ({ ...prev, [instance.id]: !prev[instance.id] }))}
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    >
                      {showToken[instance.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                {/* Centered buttons, reduced mt */}
                <div className="flex flex-wrap justify-center gap-2 mt-2 w-full">
                  {(instance.status === "close" ||
                    instance.status === "disconnected") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onShowQr(instance, setQrModal)}
                      className="flex-1 min-w-[100px]"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      QR Code
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onConnect(instance)}
                    className="flex-1 min-w-[100px]"
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
                    className="flex-1 min-w-[100px]"
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