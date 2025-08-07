import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { useUserSubscription } from '@/hooks/useUserSubscription';

const COLORS = ['#00ACC1', '#FF6F00']; // Ciano para restantes, Laranja para usados

const QuickMetrics = () => {
  const { subscription, loading } = useUserSubscription();

  if (loading) {
    return (
      <Paper sx={{ bgcolor: '#1E1E1E', color: '#fff', p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250 }}>
        <CircularProgress color="primary" />
      </Paper>
    );
  }

  if (!subscription) {
    return (
      <Paper sx={{ bgcolor: '#1E1E1E', color: '#fff', p: 2, height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Nenhuma assinatura ativa.</Typography>
      </Paper>
    );
  }

  const usedCredits = subscription.total_credits - subscription.credits_remaining;
  const data = [
    { name: 'Créditos Restantes', value: subscription.credits_remaining },
    { name: 'Créditos Usados', value: usedCredits },
  ];

  return (
    <Paper sx={{ bgcolor: '#1E1E1E', color: '#fff', p: 2 }}>
      <Typography variant="h6" component="div" sx={{ mb: 2 }}>
        Uso de Créditos
      </Typography>
      <Box sx={{ width: '100%', height: 200, position: 'relative' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            {subscription.credits_remaining}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Restantes
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default QuickMetrics;