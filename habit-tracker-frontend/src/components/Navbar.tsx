'use client';

import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <AppBar
      position="fixed"
      color="default"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
    >
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 500 }}>
          Habit Tracker
        </Typography>
        {usuario && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Hola, {usuario.nombre}
            </Typography>
            <Button size="small" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
