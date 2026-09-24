'use client';

import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { itemsNavegacion, rutaActiva } from './navegacion';

const DRAWER_WIDTH = 220;

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <Drawer
      variant="permanent"
      sx={{ width: DRAWER_WIDTH, flexShrink: 0, display: { xs: 'none', sm: 'block' } }}
      slotProps={{
        paper: {
          sx: {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            borderRight: 1,
            borderColor: 'divider',
          },
        },
      }}
    >
      <Toolbar />
      <List component="nav" aria-label="Navegación principal" sx={{ px: 1, pt: 1 }}>
        {itemsNavegacion.map((item) => {
          const activo = rutaActiva(pathname, item.href);
          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={activo}
              aria-current={activo ? 'page' : undefined}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                color: 'text.secondary',
                '&:hover': { bgcolor: 'action.hover' },
                '&.Mui-selected': {
                  bgcolor: (t) => alpha(t.palette.secondary.main, 0.1),
                  color: 'secondary.main',
                  borderLeft: '3px solid',
                  borderLeftColor: 'secondary.main',
                  pl: '13px',
                  '& .MuiListItemIcon-root': { color: 'secondary.main' },
                  '&:hover': { bgcolor: (t) => alpha(t.palette.secondary.main, 0.16) },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{ primary: { sx: { fontWeight: activo ? 600 : 400 } } }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}