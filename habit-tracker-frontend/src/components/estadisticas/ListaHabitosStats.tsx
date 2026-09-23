'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Collapse,
  LinearProgress,
  Typography,
} from '@mui/material';
import FireIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { HabitoStats } from '@/lib/api';

const plural = (n: number, uno: string, varios: string) =>
  `${n} ${n === 1 ? uno : varios}`;

/** Meta de la semana: los semanales solo necesitan 1, el resto 7 días. */
const metaSemana = (h: HabitoStats) => (h.frecuencia === 'semanal' ? 1 : 7);

/** Porcentaje de la semana, de 0 a 100 (un semanal hecho 2 veces sigue en 100). */
export const porcentajeSemana = (h: HabitoStats) =>
  Math.min(100, Math.round((h.completadosSemana / metaSemana(h)) * 100));

const colorBarra = (p: number): 'success' | 'warning' | 'error' =>
  p >= 70 ? 'success' : p >= 40 ? 'warning' : 'error';

function textoSemana(h: HabitoStats) {
  if (h.frecuencia === 'semanal') {
    return h.completadosSemana > 0 ? 'Hecho' : 'Pendiente';
  }
  return `${h.completadosSemana} de 7 días`;
}

function FilaHabito({ h, inactivo = false }: { h: HabitoStats; inactivo?: boolean }) {
  const p = porcentajeSemana(h);

  return (
    <Box
      component="li"
      sx={{
        py: 1.5,
        borderBottom: 1,
        borderColor: 'divider',
        listStyle: 'none',
        color: inactivo ? 'text.disabled' : 'text.primary',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {h.nombre}
          </Typography>
          {/* "diario" es lo normal: solo se marca cuando es otra frecuencia */}
          {h.frecuencia !== 'diario' && <Chip label={h.frecuencia} size="small" />}
          {!inactivo && h.rachaActual > 0 && (
            <Chip
              icon={<FireIcon />}
              label={`Racha de ${plural(h.rachaActual, 'día', 'días')}`}
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {textoSemana(h)}
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={p}
        color={inactivo ? 'inherit' : colorBarra(p)}
        sx={{ height: 8, borderRadius: 4, my: 1, opacity: inactivo ? 0.4 : 1 }}
        aria-label={`${h.nombre}: ${p}% de la semana`}
      />

      <Typography variant="body2" color={inactivo ? 'text.disabled' : 'text.secondary'}>
        Este mes: {plural(h.completadosMes, 'vez', 'veces')}. Mejor racha:{' '}
        {plural(h.mejorRacha, 'día', 'días')}.
      </Typography>
    </Box>
  );
}

export default function ListaHabitosStats({ habitos }: { habitos: HabitoStats[] }) {
  const [verInactivos, setVerInactivos] = useState(false);

  // De mejor a peor en la semana; si empatan, el de más veces en el mes
  const activos = habitos
    .filter((h) => h.activo)
    .sort(
      (a, b) =>
        porcentajeSemana(b) - porcentajeSemana(a) ||
        b.completadosMes - a.completadosMes,
    );
  const inactivos = habitos.filter((h) => !h.activo);

  return (
    <Box>
      {activos.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No tienes hábitos activos. Activa uno para ver su progreso aquí.
        </Typography>
      ) : (
        <Box component="ul" sx={{ m: 0, p: 0 }} aria-label="Progreso por hábito">
          {activos.map((h) => (
            <FilaHabito key={h.id} h={h} />
          ))}
        </Box>
      )}

      {inactivos.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Button
            size="small"
            color="inherit"
            onClick={() => setVerInactivos((v) => !v)}
            endIcon={verInactivos ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            aria-expanded={verInactivos}
            sx={{ color: 'text.secondary', textTransform: 'none', px: 0 }}
          >
            Inactivos ({inactivos.length})
          </Button>
          <Collapse in={verInactivos}>
            <Box component="ul" sx={{ m: 0, p: 0 }} aria-label="Hábitos inactivos">
              {inactivos.map((h) => (
                <FilaHabito key={h.id} h={h} inactivo />
              ))}
            </Box>
          </Collapse>
        </Box>
      )}
    </Box>
  );
}