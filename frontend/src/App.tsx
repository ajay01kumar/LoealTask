import React from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { ClaimAssessmentWorkbench } from './components/ClaimAssessmentWorkbench';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#000000',
    },
    secondary: {
      main: '#c5a880', // L'Oréal gold accent
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});

export const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
        <ClaimAssessmentWorkbench />
      </Box>
    </ThemeProvider>
  );
};

export default App;
