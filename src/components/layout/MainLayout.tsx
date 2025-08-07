import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from "@/components/dashboard/Dashboard";
import InstancesManager from "@/components/instances/InstancesManager";
import ContactsManager from "@/components/contacts/ContactsManager";
import CampaignsManager from "@/components/campaigns/CampaignsManager";
import BillingManager from "@/components/billing/BillingManager";
import MediaRepository from "@/components/media/MediaRepository";
import SettingsModal from "@/components/settings/SettingsModal";
import { supabase } from "@/integrations/supabase/client";

interface MainLayoutProps {
  user: any;
  profile: any;
  signOut: () => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}

const MainLayout = ({ user, profile, signOut, theme, setTheme }: MainLayoutProps) => {
  const [activePage, setActivePage] = useState('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const groups = Array.from(new Set(contacts.map(c => c.group).filter(Boolean)));

  useEffect(() => {
    async function fetchContacts() {
      setLoadingContacts(true);
      if (!user) {
        setContacts([]);
        setLoadingContacts(false);
        return;
      }
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error) {
        setContacts(
          (data || []).map((c: any) => ({
            ...c,
            group: c.tags?.[0] || "",
          }))
        );
      }
      setLoadingContacts(false);
    }
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const handleNavigate = (page: string) => {
    if (page === 'settings') {
      setShowSettings(true);
    } else {
      setActivePage(page);
    }
  };

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'instances': return <InstancesManager />;
      case 'contacts': return <ContactsManager contacts={contacts} setContacts={setContacts} groups={groups} loading={loadingContacts} user={user} />;
      case 'campaigns': return <CampaignsManager contactGroups={groups} />;
      case 'media': return <MediaRepository />;
      case 'billing': return <BillingManager />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-muted/40">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          user={user} 
          profile={profile} 
          signOut={signOut} 
          theme={theme} 
          setTheme={setTheme} 
          onSettingsClick={() => setShowSettings(true)}
          activePage={activePage}
          onNavigate={handleNavigate}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
      <SettingsModal open={showSettings} onOpenChange={setShowSettings} theme={theme} setTheme={setTheme} />
    </div>
  );
};

export default MainLayout;