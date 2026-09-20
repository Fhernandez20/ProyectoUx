'use client';

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
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
        <IconButton
          edge="start"
          aria-label="Abrir menú de navegación"
          onClick={onMenuClick}
          sx={{ mr: 1, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 500 }}>
          Habit Tracker
        </Typography>

        {usuario && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              onClick={() => router.push('/perfil')}
              aria-label="Ir a mi perfil"
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                textTransform: 'none',
                color: 'text.secondary',
                fontWeight: 400,
                fontSize: '0.875rem',
              }}
            >
              Hola, {usuario.nombre}
            </Button>
            <Button
              size="small"
              onClick={handleLogout}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              Cerrar sesión
            </Button>
            <IconButton
              aria-label="Cerrar sesión"
              onClick={handleLogout}
              sx={{ display: { sm: 'none' } }}
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}