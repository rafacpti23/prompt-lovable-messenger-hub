import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Moon, Sun, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "./Sidebar"; // Reutilizando a sidebar para o menu mobile

interface HeaderProps {
  user: any;
  profile: any;
  signOut: () => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  onSettingsClick: () => void;
  activePage: string;
  onNavigate: (page: string) => void;
}

const Header = ({ user, profile, signOut, theme, setTheme, onSettingsClick, activePage, onNavigate }: HeaderProps) => {
  return (
    <header className="bg-card border-b border-border shadow-sm h-16 flex items-center px-6 shrink-0">
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar activePage={activePage} onNavigate={onNavigate} />
          </SheetContent>
        </Sheet>
      </div>
      <div className="flex items-center space-x-4 ml-auto">
        <Badge variant="outline" className="text-green-600 border-green-600">
          Online
        </Badge>
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {profile?.full_name || user.email}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSettingsClick}
        >
          <Settings className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={signOut}
        >
          Sair
        </Button>
      </div>
    </header>
  );
};

export default Header;