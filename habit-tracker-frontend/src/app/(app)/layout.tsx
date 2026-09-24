'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Toolbar } from '@mui/material';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import BarraInferior, { ALTO_BARRA_INFERIOR } from '@/components/BarraInferior';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { usuario, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!cargando && !usuario) {
      router.replace('/login');
    }
  }, [cargando, usuario, router]);

  if (cargando || !usuario) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          px: { xs: 2, sm: 3, md: 5, lg: 6 },
          pt: { xs: 2, sm: 3, md: 4 },
          pb: {
            xs: `calc(${ALTO_BARRA_INFERIOR}px + env(safe-area-inset-bottom, 0px) + 16px)`,
            sm: 3,
            md: 5,
          },
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Box sx={{ maxWidth: 1400, mx: 'auto', width: '100%' }}>{children}</Box>
      </Box>
      <BarraInferior />
    </Box>
  );
}