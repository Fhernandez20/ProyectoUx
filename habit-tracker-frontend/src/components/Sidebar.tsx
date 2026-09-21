'use client';

import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import ChecklistIcon from '@mui/icons-material/ChecklistOutlined';
import CalendarIcon from '@mui/icons-material/CalendarMonthOutlined';
import BarChartIcon from '@mui/icons-material/BarChartOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlineOutlined';
import { usePathname, useRouter } from 'next/navigation';

const DRAWER_WIDTH = 220;

const items = [
  { label: 'Dashboard', href: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Mis hábitos', href: '/habitos', icon: <ChecklistIcon /> },
  { label: 'Seguimiento', href: '/seguimiento', icon: <CalendarIcon /> },
  { label: 'Estadísticas', href: '/estadisticas', icon: <BarChartIcon /> },
  { label: 'Perfil', href: '/perfil', icon: <PersonIcon /> },
];

const paperSx = {
  width: DRAWER_WIDTH,
  boxSizing: 'border-box',
  borderRight: 1,
  borderColor: 'divider',
} as const;

function ListaNavegacion({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <List component="nav" aria-label="Navegación principal" sx={{ px: 1 }}>
      {items.map((item) => {
        const activo = pathname === item.href;
        return (
          <ListItemButton
            key={item.href}
            selected={activo}
            aria-current={activo ? 'page' : undefined}
            onClick={() => {
              router.push(item.href);
              onNavigate?.();
            }}
            sx={{ borderRadius: 1, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        );
      })}
    </List>
  );
}

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Móvil: menú lateral que se abre con el botón de hamburguesa */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': paperSx,
        }}
      >
        <Box sx={{ px: 2, py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Habit Tracker
          </Typography>
        </Box>
        <ListaNavegacion onNavigate={onClose} />
      </Drawer>

      {/* Escritorio / tablet: menú fijo */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': paperSx,
        }}
      >
        <Toolbar />
        <ListaNavegacion />
      </Drawer>
    </>
  );
}