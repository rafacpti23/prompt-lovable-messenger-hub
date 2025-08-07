import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import Sidebar from './Sidebar';
import StatsCard from './StatsCard';
import CampaignStatus from './CampaignStatus';
import QuickMetrics from './QuickMetrics';

// Icons
import SmsIcon from '@mui/icons-material/Sms';
import CampaignIcon from '@mui/icons-material/Campaign';
import ContactsIcon from '@mui/icons-material/Contacts';
import SmartphoneIcon from '@mui/icons-material/Smartphone';

import { useDashboardStats } from '@/hooks/useDashboardStats';

const Dashboard = () => {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#121212', minHeight: '100vh' }}>
        <Typography variant="h4" sx={{ color: '#fff', mb: 4 }}>
          Painel
        </Typography>
        
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard 
              title="Mensagens Enviadas" 
              value={isLoading ? '...' : stats?.sentMessages ?? 0}
              icon={<SmsIcon />} 
              color="#4CAF50" 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard 
              title="Campanhas Ativas" 
              value={isLoading ? '...' : stats?.activeCampaigns ?? 0}
              icon={<CampaignIcon />} 
              color="#2196F3" 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard 
              title="Total de Contatos" 
              value={isLoading ? '...' : stats?.totalContacts ?? 0}
              icon={<ContactsIcon />} 
              color="#9C27B0" 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard 
              title="Instâncias Ativas" 
              value={isLoading ? '...' : stats?.totalInstances ?? 0}
              icon={<SmartphoneIcon />} 
              color="#FF9800" 
            />
          </Grid>
        </Grid>

        {/* Main Content */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <CampaignStatus />
          </Grid>
          <Grid item xs={12} lg={4}>
            <QuickMetrics />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;