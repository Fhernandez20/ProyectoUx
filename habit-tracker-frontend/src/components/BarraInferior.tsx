'use client';

import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { itemsBarraInferior, rutaActiva } from './navegacion';

export const ALTO_BARRA_INFERIOR = 64;

export default function BarraInferior() {
  const pathname = usePathname();
  const activo = itemsBarraInferior.find((i) => rutaActiva(pathname, i.href))?.href ?? false;

  return (
    <Paper
      component="nav"
      aria-label="Navegación principal"
      elevation={0}
      sx={{
        display: { xs: 'block', sm: 'none' },
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (t) => t.zIndex.appBar,
        borderTop: 1,
        borderColor: 'divider',
        pb: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <BottomNavigation value={activo} showLabels sx={{ height: ALTO_BARRA_INFERIOR }}>
        {itemsBarraInferior.map((item) => (
          <BottomNavigationAction
            key={item.href}
            value={item.href}
            label={item.corto}
            icon={item.icon}
            component={Link}
            href={item.href}
            aria-current={activo === item.href ? 'page' : undefined}
            sx={{
              minWidth: 0,
              px: 0.5,
              color: 'text.secondary',
              '&.Mui-selected': { color: 'secondary.main' },
              '& .MuiBottomNavigationAction-label': { fontSize: '0.75rem' },
              '& .MuiBottomNavigationAction-label.Mui-selected': {
                fontSize: '0.75rem',
                fontWeight: 600,
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
