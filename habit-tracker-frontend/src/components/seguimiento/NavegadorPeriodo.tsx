'use client';

import { Box, Button, Chip, IconButton, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface Props {
  titulo: string;
  /** Texto del chip cuando se está viendo el periodo actual (ej. "Hoy", "Esta semana"). */
  etiquetaActual: string;
  esActual: boolean;
  etiquetaAnterior: string;
  etiquetaSiguiente: string;
  siguienteDeshabilitado: boolean;
  onAnterior: () => void;
  onSiguiente: () => void;
  onVolverAlActual: () => void;
}

export default function NavegadorPeriodo({
  titulo,
  etiquetaActual,
  esActual,
  etiquetaAnterior,
  etiquetaSiguiente,
  siguienteDeshabilitado,
  onAnterior,
  onSiguiente,
  onVolverAlActual,
}: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        mb: 2,
      }}
    >
      <IconButton aria-label={etiquetaAnterior} onClick={onAnterior}>
        <ChevronLeftIcon />
      </IconButton>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 1,
          textAlign: 'center',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }} aria-live="polite">
          {titulo}
        </Typography>
        {esActual ? (
          <Chip label={etiquetaActual} size="small" color="primary" />
        ) : (
          <Button size="small" onClick={onVolverAlActual}>
            Volver a {etiquetaActual.toLowerCase()}
          </Button>
        )}
      </Box>

      <IconButton
        aria-label={etiquetaSiguiente}
        onClick={onSiguiente}
        disabled={siguienteDeshabilitado}
      >
        <ChevronRightIcon />
      </IconButton>
    </Box>
  );
}
