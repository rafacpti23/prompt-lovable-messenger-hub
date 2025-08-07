import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Dashboard from '@/components/mui-dashboard/Dashboard';
import { usePaymentVerification } from "@/hooks/usePaymentVerification";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#121212', // Fundo escuro
      paper: '#1E1E1E',   // Cards
    },
    primary: {
      main: '#00ACC1',    // Cor de destaque (ciano)
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    }
  },
});

const MainApp = () => {
  const { isLoading } = useAuth();
  usePaymentVerification();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#121212', color: 'white' }}>
        Carregando...
      </div>
    );
  }

  // For now, we assume the user is logged in to show the new UI
  // A proper login/routing flow would be needed for a full implementation
  return <Dashboard />;
};

const Index = () => {
  return (
    <AuthProvider>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <MainApp />
      </ThemeProvider>
    </AuthProvider>
  );
};

export default Index;