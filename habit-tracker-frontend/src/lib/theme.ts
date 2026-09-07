'use client';

import { createTheme } from '@mui/material/styles';

// Paleta definida en tu documento de UI/UX (1er avance)
const theme = createTheme({
  palette: {
    primary: {
      main: '#1E293B', // Primario
    },
    secondary: {
      main: '#4F46E5', // Acento
    },
    success: {
      main: '#16A34A', // Éxito
    },
    warning: {
      main: '#F59E0B', // Advertencia
    },
    error: {
      main: '#DC2626', // Error
    },
    background: {
      default: '#F9FAFB', // Fondo
      paper: '#FFFFFF', // Superficie
    },
    text: {
      primary: '#111827', // Texto primario
      secondary: '#6B7280', // Texto secundario
    },
    divider: '#E5E7EB', // Borde
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});

export default theme;
