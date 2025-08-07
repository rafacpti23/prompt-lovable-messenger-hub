import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, CircularProgress } from '@mui/material';
import { useCampaigns } from '@/hooks/useCampaigns';

const CampaignStatus = () => {
  const { data: campaigns, isLoading } = useCampaigns();

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return { color: '#4CAF50', fontWeight: 'bold' };
      case 'sending':
        return { color: '#2196F3', fontWeight: 'bold' };
      case 'scheduled':
        return { color: '#FF9800', fontWeight: 'bold' };
      case 'draft':
        return { color: '#9E9E9E', fontWeight: 'bold' };
      default:
        return { color: '#FFFFFF' };
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      completed: 'Concluída',
      sending: 'Enviando',
      scheduled: 'Agendada',
      draft: 'Rascunho',
    };
    return statusMap[status] || status;
  };

  return (
    <TableContainer component={Paper} sx={{ bgcolor: '#1E1E1E', color: '#fff' }}>
      <Box p={2}>
        <Typography variant="h6" component="div">
          Status das Campanhas
        </Typography>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Campanha</TableCell>
            <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Status</TableCell>
            <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Progresso</TableCell>
            <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Data</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} align="center">
                <CircularProgress color="primary" />
              </TableCell>
            </TableRow>
          ) : (
            (campaigns || []).slice(0, 5).map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell sx={{ color: '#fff' }}>{campaign.name}</TableCell>
                <TableCell>
                  <span style={getStatusStyle(campaign.status)}>
                    {getStatusText(campaign.status)}
                  </span>
                </TableCell>
                <TableCell sx={{ color: '#fff' }}>{`${campaign.sent}/${campaign.total}`}</TableCell>
                <TableCell sx={{ color: '#fff' }}>
                  {new Date(campaign.created_at!).toLocaleDateString('pt-BR')}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CampaignStatus;