'use client';

import {
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { HabitoSeguimiento } from '@/lib/api';

/**
 * Hábitos inactivos que se completaron ese día. Van aparte y en gris: su
 * historial se conserva, pero no cuentan en el cumplimiento.
 */
export default function ListaInactivosDia({
  habitos,
}: {
  habitos: HabitoSeguimiento[];
}) {
  if (habitos.length === 0) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
        Inactivos · no cuentan en el cumplimiento
      </Typography>
      <List disablePadding aria-label="Hábitos inactivos completados ese día">
        {habitos.map((h) => (
          <ListItem
            key={h.id}
            divider
            disableGutters
            secondaryAction={
              <Chip label="Completado" size="small" variant="outlined" />
            }
            sx={{ pr: 14 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CheckCircleIcon sx={{ color: 'text.disabled' }} aria-hidden />
            </ListItemIcon>
            <ListItemText
              primary={h.nombre}
              secondary={
                <Chip label="Inactivo" size="small" variant="outlined" />
              }
              slotProps={{ secondary: { component: 'div' } }}
              sx={{ '& .MuiListItemText-primary': { color: 'text.secondary' } }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
