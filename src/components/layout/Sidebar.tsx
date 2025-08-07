import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BarChart3, MessageSquare, Users, Send, Image as ImageIcon, CreditCard, Settings, ChevronLeft, ChevronRight
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const navItems = [
  { id: 'dashboard', label: 'Painel', icon: BarChart3 },
  { id: 'instances', label: 'Instâncias', icon: MessageSquare },
  { id: 'contacts', label: 'Contatos', icon: Users },
  { id: 'campaigns', label: 'Campanhas', icon: Send },
  { id: 'media', label: 'Mídia', icon: ImageIcon },
  { id: 'billing', label: 'Cobrança', icon: CreditCard },
];

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const Sidebar = ({ activePage, onNavigate }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "relative hidden md:flex flex-col h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <div className="flex items-center h-16 px-6 border-b border-sidebar-border shrink-0">
          <img 
            src="/lovable-uploads/c9bbdaa6-c367-4489-8438-ef65ccaf62f2.png" 
            alt="WhatsPro Logo" 
            className="h-8 w-8"
          />
          {!isCollapsed && <h1 className="text-xl font-bold ml-3 whitespace-nowrap">WhatsPro</h1>}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={activePage === item.id ? "secondary" : "ghost"}
                  className="w-full justify-start h-10"
                  onClick={() => onNavigate(item.id)}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span className="ml-4">{item.label}</span>}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-sidebar-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start h-10"
                onClick={() => onNavigate('settings')}
              >
                <Settings className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span className="ml-4">Configurações</span>}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                <p>Configurações</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute -right-4 top-14 bg-card border rounded-full h-8 w-8"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </aside>
    </TooltipProvider>
  );
};

export default Sidebar;