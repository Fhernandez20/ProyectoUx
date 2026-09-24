'use client';

import { useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlineOutlined';
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const router = useRouter();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const abierto = Boolean(anchor);

  function cerrarMenu() {
    setAnchor(null);
  }

  function irAPerfil() {
    cerrarMenu();
    router.push('/perfil');
  }

  function handleLogout() {
    cerrarMenu();
    logout();
    router.push('/login');
  }

  const inicial = usuario?.nombre.trim().charAt(0).toUpperCase() || '?';

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: 'primary.main',
        color: 'common.white',
        zIndex: (t) => t.zIndex.drawer + 1,
      }}
    >
      <Toolbar>
        <Box
          component={Link}
          href="/dashboard"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            textDecoration: 'none',
            color: 'inherit',
            borderRadius: 1,
            '&:focus-visible': { outline: '2px solid', outlineColor: 'cream.main', outlineOffset: 2 },
          }}
        >
          <TrackChangesOutlinedIcon sx={{ color: 'cream.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'common.white', letterSpacing: 0.3 }}>
            Habit Tracker
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {usuario && (
          <>
            <Tooltip title="Tu cuenta">
              <IconButton
                onClick={(e) => setAnchor(e.currentTarget)}
                aria-label={`Menú de la cuenta de ${usuario.nombre}`}
                aria-controls={abierto ? 'menu-cuenta' : undefined}
                aria-haspopup="true"
                aria-expanded={abierto ? 'true' : undefined}
                sx={{
                  p: 0.5,
                  '&:focus-visible': { outline: '2px solid', outlineColor: 'cream.main' },
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: 'secondary.main',
                    color: 'common.white',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  {inicial}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              id="menu-cuenta"
              anchorEl={anchor}
              open={abierto}
              onClose={cerrarMenu}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{ paper: { sx: { mt: 1, minWidth: 220 } } }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                  {usuario.nombre}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap component="p">
                  {usuario.correo}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={irAPerfil}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                Mi perfil
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Cerrar sesión
              </MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}