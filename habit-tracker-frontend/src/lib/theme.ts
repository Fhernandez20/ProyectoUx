'use client';

import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    cream: Palette['primary'];
  }
  interface PaletteOptions {
    cream?: PaletteOptions['primary'];
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#1E293B',
    },
    secondary: {
      main: '#4F46E5',
    },
    success: {
      main: '#16A34A',
    },
    warning: {
      main: '#F59E0B',
    },
    error: {
      main: '#DC2626',
    },
    cream: {
      main: '#FBEFD9',
      contrastText: '#1E293B',
    },
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
    },
    divider: '#E5E7EB',
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiSnackbar: {
      styleOverrides: {
        root: ({ theme }) => ({
          [theme.breakpoints.down('sm')]: {
            bottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 8px)',
          },
        }),
      },
    },
  },
});

export default theme;