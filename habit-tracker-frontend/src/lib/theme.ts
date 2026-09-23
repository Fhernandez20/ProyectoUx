'use client';

import { createTheme } from '@mui/material/styles';

// Le agregamos un color "cream" a la paleta de MUI, además de los que ya
// definiste (primary, secondary, etc.), para usarlo como acento cálido sobre
// el azul oscuro (por ejemplo, en el botón de "Cerrar sesión" de la barra).
declare module '@mui/material/styles' {
  interface Palette {
    cream: Palette['primary'];
  }
  interface PaletteOptions {
    cream?: PaletteOptions['primary'];
  }
}

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
    cream: {
      main: '#FBEFD9', // Crema: acento cálido para resaltar sobre el azul oscuro
      contrastText: '#1E293B',
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