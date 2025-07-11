import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Trash2, ListChecks, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Campaign {
  id: string;
  name: string;
  message: string;
  status: string;
  sent: number;
  total: number;
  created_at?: string;
}

interface CampaignListProps {
  campaigns: Campaign[];
  deleteCampaign: (id: string) => void;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  onStartCampaign?: (id: string) => void;
  onPauseCampaign?: (id: string) => void;
  onShowDetails: (id: string) => void;
}

const CampaignList: React.FC<CampaignListProps> = ({
  campaigns,
  deleteCampaign,
  getStatusColor,
  getStatusText,
  onStartCampaign,
  onPauseCampaign,
  onShowDetails,
}) => {
  return (
    <div className="grid gap-4">
      {campaigns.map((campaign) => (
        <Card key={campaign.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{campaign.name}</h3>
                  <Badge className={getStatusColor(campaign.status)}>
                    {getStatusText(campaign.status)}
                  </Badge>
                </div>
                <p className="text-gray-600 mb-3">{campaign.message}</p>
                {campaign.total > 0 && (
                  <div className="text-sm text-gray-500">
                    Progresso: {campaign.sent} de {campaign.total} mensagens enviadas
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onShowDetails(campaign.id)}
                >
                  <ListChecks className="h-4 w-4 mr-2" />
                  Detalhes
                </Button>
                {campaign.status === "draft" && onStartCampaign && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStartCampaign(campaign.id)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar
                  </Button>
                )}
                {campaign.status === "sending" && onPauseCampaign && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPauseCampaign(campaign.id)}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar
                  </Button>
                )}
                {campaign.status === "paused" && onStartCampaign && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStartCampaign(campaign.id)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Retomar
                  </Button>
                )}
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => deleteCampaign(campaign.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CampaignList;