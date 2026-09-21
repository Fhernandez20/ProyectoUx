'use client';

import {
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UncheckedIcon from '@mui/icons-material/RadioButtonUncheckedOutlined';
import type { HabitoSeguimiento } from '@/lib/api';
import { infoPrioridad } from '@/lib/prioridad';

interface Props {
  /** Hábitos que tocaban ese día (ya ordenados). */
  habitos: HabitoSeguimiento[];
  completadosIds: string[];
  esHoy: boolean;
  /** Si se pasa, los pendientes de hoy muestran el botón "Completar". */
  onCompletar?: (id: string) => void;
  completandoId?: string | null;
}

export default function ListaHabitosDia({
  habitos,
  completadosIds,
  esHoy,
  onCompletar,
  completandoId,
}: Props) {
  return (
    <List disablePadding aria-label="Hábitos del día">
      {habitos.map((h) => {
        const completado = completadosIds.includes(h.id);
        const prioridad = infoPrioridad(h.prioridad);
        return (
          <ListItem
            key={h.id}
            divider
            disableGutters
            secondaryAction={
              completado ? (
                <Chip label="Completado" size="small" color="success" />
              ) : esHoy && onCompletar ? (
                <Button
                  size="small"
                  variant="outlined"
                  disabled={completandoId === h.id}
                  onClick={() => onCompletar(h.id)}
                  aria-label={`Completar ${h.nombre}`}
                >
                  Completar
                </Button>
              ) : (
                <Chip
                  label={esHoy ? 'Pendiente' : 'No completado'}
                  size="small"
                  variant="outlined"
                />
              )
            }
            sx={{ pr: 14 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {completado ? (
                <CheckCircleIcon color="success" aria-hidden />
              ) : (
                <UncheckedIcon sx={{ color: 'text.disabled' }} aria-hidden />
              )}
            </ListItemIcon>
            <ListItemText
              primary={h.nombre}
              secondary={
                <Box component="span" sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                  <Chip label={h.frecuencia} size="small" />
                  <Chip
                    label={`Prioridad ${prioridad.label.toLowerCase()}`}
                    size="small"
                    variant="outlined"
                    color={prioridad.color}
                  />
                </Box>
              }
              slotProps={{ secondary: { component: 'div' } }}
              sx={{ textDecoration: completado ? 'none' : undefined }}
            />
          </ListItem>
        );
      })}
    </List>
  );
}
