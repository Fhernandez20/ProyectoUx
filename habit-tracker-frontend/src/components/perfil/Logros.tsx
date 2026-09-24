'use client';

import { ReactNode } from 'react';
import { Box, Card, CardContent, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import SpaIcon from '@mui/icons-material/SpaOutlined';
import FireIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import WhatshotIcon from '@mui/icons-material/WhatshotOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAltOutlined';
import MedallaIcon from '@mui/icons-material/MilitaryTechOutlined';
import TrofeoIcon from '@mui/icons-material/EmojiEventsOutlined';
import LockIcon from '@mui/icons-material/LockOutlined';

export interface DatosLogros {
  totalHabitos: number;
  mejorRacha: number;
  totalCompletados: number;
  semanaPerfecta: boolean;
}

interface Logro {
  id: string;
  nombre: string;
  descripcion: string;
  icono: ReactNode;
  actual: number;
  meta: number;
}

export function calcularLogros(d: DatosLogros): Logro[] {
  return [
    {
      id: 'primer-habito',
      nombre: 'Primer hábito',
      descripcion: 'Crea tu primer hábito',
      icono: <SpaIcon />,
      actual: d.totalHabitos,
      meta: 1,
    },
    {
      id: 'racha-3',
      nombre: 'Racha de 3 días',
      descripcion: 'Completa hábitos 3 días seguidos',
      icono: <FireIcon />,
      actual: d.mejorRacha,
      meta: 3,
    },
    {
      id: 'racha-7',
      nombre: 'Racha de 7 días',
      descripcion: 'Completa hábitos 7 días seguidos',
      icono: <WhatshotIcon />,
      actual: d.mejorRacha,
      meta: 7,
    },
    {
      id: 'completados-10',
      nombre: '10 completados',
      descripcion: 'Completa hábitos 10 veces',
      icono: <TaskAltIcon />,
      actual: d.totalCompletados,
      meta: 10,
    },
    {
      id: 'completados-50',
      nombre: '50 completados',
      descripcion: 'Completa hábitos 50 veces',
      icono: <MedallaIcon />,
      actual: d.totalCompletados,
      meta: 50,
    },
    {
      id: 'semana-perfecta',
      nombre: 'Semana perfecta',
      descripcion: 'Llega a 100% de cumplimiento en una semana',
      icono: <TrofeoIcon />,
      actual: d.semanaPerfecta ? 1 : 0,
      meta: 1,
    },
  ];
}

function Insignia({ logro }: { logro: Logro }) {
  const ganado = logro.actual >= logro.meta;
  const progreso =
    !ganado && logro.meta > 1 ? `${Math.min(logro.actual, logro.meta)} de ${logro.meta}` : null;

  return (
    <Tooltip title={ganado ? `Logrado: ${logro.descripcion}` : logro.descripcion} arrow>
      <Box
        component="li"
        tabIndex={0}
        aria-label={`${logro.nombre}: ${ganado ? 'logrado' : 'bloqueado'}${progreso ? `, ${progreso}` : ''}`}
        sx={{
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 0.75,
          outline: 'none',
          borderRadius: 2,
          '&:focus-visible': { boxShadow: (t) => `0 0 0 2px ${t.palette.secondary.main}` },
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (t) => (ganado ? alpha(t.palette.warning.main, 0.15) : t.palette.action.hover),
            color: ganado ? 'warning.dark' : 'text.disabled',
            '& svg': { fontSize: 28 },
          }}
        >
          {ganado ? logro.icono : <LockIcon />}
        </Box>
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, lineHeight: 1.2 }}
          color={ganado ? 'text.primary' : 'text.disabled'}
        >
          {logro.nombre}
        </Typography>
        {progreso && (
          <Typography variant="caption" color="text.secondary">
            {progreso}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}

export default function Logros({ datos }: { datos: DatosLogros }) {
  const logros = calcularLogros(datos);
  const ganados = logros.filter((l) => l.actual >= l.meta).length;

  return (
    <Card variant="outlined">
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            mb: 2,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            Logros
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {ganados} de {logros.length}
          </Typography>
        </Box>
        <Box
          component="ul"
          aria-label="Logros"
          sx={{
            m: 0,
            p: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            rowGap: 2.5,
            columnGap: 1,
          }}
        >
          {logros.map((l) => (
            <Insignia key={l.id} logro={l} />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}