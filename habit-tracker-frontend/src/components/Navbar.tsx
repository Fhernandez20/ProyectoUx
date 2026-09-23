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
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined';
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
      elevation={0}
      sx={{
        bgcolor: 'primary.main', // explícito: con color="primary" el fondo blanco de Paper puede ganar
        color: 'common.white',
        // Por encima del Sidebar: si no, el menú lateral (que tiene más
        // prioridad por defecto en MUI) tapa el lado izquierdo de esta barra.
        zIndex: (t) => t.zIndex.drawer + 1,
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          aria-label="Abrir menú de navegación"
          onClick={onMenuClick}
          sx={{ mr: 1, display: { sm: 'none' }, color: 'common.white' }}
        >
          <MenuIcon />
        </IconButton>

        {/* Logo / marca, a la izquierda (queda alineado con el Sidebar) */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
          onClick={() => router.push('/dashboard')}
        >
          <TrackChangesOutlinedIcon sx={{ color: 'cream.main' }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: 'common.white', letterSpacing: 0.3 }}
          >
            Habit Tracker
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {usuario && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            <Button
              size="small"
              onClick={() => router.push('/perfil')}
              aria-label="Ir a mi perfil"
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                textTransform: 'none',
                color: 'rgba(255,255,255,0.85)',
                fontWeight: 400,
                fontSize: '0.875rem',
                '&:hover': { color: 'common.white', bgcolor: 'rgba(255,255,255,0.08)' },
              }}
            >
              Hola, {usuario.nombre}
            </Button>

            <Button
              variant="contained"
              size="small"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              aria-label="Cerrar sesión"
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                bgcolor: 'cream.main',
                color: 'cream.contrastText',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: 'none',
                '&:hover': { bgcolor: 'cream.main', opacity: 0.9, boxShadow: 'none' },
              }}
            >
              Cerrar sesión
            </Button>

            <IconButton
              aria-label="Cerrar sesión"
              onClick={handleLogout}
              sx={{
                display: { sm: 'none' },
                bgcolor: 'cream.main',
                color: 'cream.contrastText',
                '&:hover': { bgcolor: 'cream.main', opacity: 0.9 },
              }}
              size="small"
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}