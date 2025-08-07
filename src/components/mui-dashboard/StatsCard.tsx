import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color }) => (
  <Card sx={{ bgcolor: '#1E1E1E', color: '#fff', height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center">
        <Box sx={{ color, mr: 2, display: 'flex', alignItems: 'center' }}>
          {React.cloneElement(icon, { sx: { fontSize: 40 } })}
        </Box>
        <div>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>{title}</Typography>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
            {value}
          </Typography>
        </div>
      </Box>
    </CardContent>
  </Card>
);

export default StatsCard;