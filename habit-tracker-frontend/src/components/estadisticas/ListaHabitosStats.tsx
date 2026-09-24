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

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function fechaCorta(clave: string) {
  const [, m, d] = clave.split('-').map(Number);
  return `${d} ${MESES[m - 1]}`;
}

function textoPeriodo(inicio: string, fin: string) {
  const [, mi, di] = inicio.split('-').map(Number);
  const [, mf, df] = fin.split('-').map(Number);
  if (inicio === fin) return `El ${di} ${MESES[mf - 1]}`;
  if (mi === mf) return `Del ${di} al ${df} ${MESES[mf - 1]}`;
  return `Del ${di} ${MESES[mi - 1]} al ${df} ${MESES[mf - 1]}`;
}

export const porcentajeGeneral = (h: HabitoStats) =>
  h.metaPeriodo > 0
    ? Math.min(100, Math.round((h.completadosPeriodo / h.metaPeriodo) * 100))
    : 0;

const colorBarra = (p: number): 'success' | 'warning' | 'error' =>
  p >= 70 ? 'success' : p >= 40 ? 'warning' : 'error';

const unidades = (h: HabitoStats): [string, string] =>
  h.frecuencia === 'semanal' ? ['semana', 'semanas'] : ['día', 'días'];

const textoRacha = (h: HabitoStats, n: number) => {
  const [uno, varios] = unidades(h);
  return plural(n, uno, varios);
};

function textoTranscurrido(h: HabitoStats) {
  if (!h.diasTotales || !h.fechaFin) return null;
  const fin = `termina el ${fechaCorta(h.fechaFin)}.`;
  if (h.frecuencia === 'semanal') {
    const total = Math.ceil(h.diasTotales / 7);
    const actual = Math.min(Math.ceil(h.diasTranscurridos / 7), total);
    return `Semana ${actual} de ${total}, ${fin}`;
  }
  return `Día ${Math.min(h.diasTranscurridos, h.diasTotales)} de ${h.diasTotales}, ${fin}`;
}

function textoAvance(h: HabitoStats) {
  const hechos = Math.min(h.completadosPeriodo, h.metaPeriodo);
  const [uno, varios] = unidades(h);
  return `${hechos} de ${plural(h.metaPeriodo, uno, varios)}`;
}

function textoReciente(h: HabitoStats) {
  if (h.frecuencia === 'semanal') {
    return `Esta semana: ${h.completadosSemana > 0 ? 'hecho' : 'pendiente'}.`;
  }
  const dias = Math.min(7, h.diasTranscurridos);
  return `Esta semana: ${h.completadosSemana} de ${dias}.`;
}

function FilaHabito({ h, inactivo = false }: { h: HabitoStats; inactivo?: boolean }) {
  const noEmpieza = h.metaPeriodo === 0;
  const p = porcentajeGeneral(h);
  const detalle = [
    noEmpieza ? null : textoTranscurrido(h),
    noEmpieza ? null : textoReciente(h),
    `Mejor racha: ${textoRacha(h, h.mejorRacha)}.`,
  ]
    .filter(Boolean)
    .join(' ');

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
          {h.frecuencia !== 'diario' && <Chip label={h.frecuencia} size="small" />}
          {!inactivo && h.rachaActual > 0 && (
            <Chip
              icon={<FireIcon />}
              label={`Racha de ${textoRacha(h, h.rachaActual)}`}
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
        </Box>
        {noEmpieza ? (
          <Typography variant="body2" color="text.secondary">
            Empieza el {fechaCorta(h.fechaInicio)}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="body2" color={inactivo ? 'text.disabled' : 'text.secondary'}>
              {textoAvance(h)}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, minWidth: 44, textAlign: 'right' }}>
              {p}%
            </Typography>
          </Box>
        )}
      </Box>

      <LinearProgress
        variant="determinate"
        value={p}
        color={inactivo || noEmpieza ? 'inherit' : colorBarra(p)}
        sx={{ height: 8, borderRadius: 4, my: 1, opacity: inactivo || noEmpieza ? 0.3 : 1 }}
        aria-label={`${h.nombre}: ${p}% de cumplimiento desde que empezó`}
      />

      <Typography variant="body2" color={inactivo ? 'text.disabled' : 'text.secondary'}>
        {detalle}
      </Typography>
    </Box>
  );
}

function FilaFinalizado({ h }: { h: HabitoStats }) {
  const p = porcentajeGeneral(h);

  return (
    <Box
      component="li"
      sx={{ py: 1.5, borderBottom: 1, borderColor: 'divider', listStyle: 'none' }}
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
          {h.frecuencia !== 'diario' && <Chip label={h.frecuencia} size="small" />}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {textoAvance(h)}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, minWidth: 44, textAlign: 'right' }}>
            {p}%
          </Typography>
        </Box>
      </Box>

      <LinearProgress
        variant="determinate"
        value={p}
        color="secondary"
        sx={{ height: 8, borderRadius: 4, my: 1 }}
        aria-label={`${h.nombre}: ${p}% de su periodo`}
      />

      <Typography variant="body2" color="text.secondary">
        {h.fechaFin ? `${textoPeriodo(h.fechaInicio, h.fechaFin)}. ` : ''}Mejor racha:{' '}
        {textoRacha(h, h.mejorRacha)}.
      </Typography>
    </Box>
  );
}

function SeccionPlegable({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
}) {
  const [abierta, setAbierta] = useState(false);
  return (
    <Box sx={{ mt: 1 }}>
      <Button
        size="small"
        color="inherit"
        onClick={() => setAbierta((v) => !v)}
        endIcon={abierta ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        aria-expanded={abierta}
        sx={{ color: 'text.secondary', textTransform: 'none', px: 0 }}
      >
        {titulo}
      </Button>
      <Collapse in={abierta}>
        {descripcion && (
          <Typography variant="caption" color="text.secondary" component="p">
            {descripcion}
          </Typography>
        )}
        <Box component="ul" sx={{ m: 0, p: 0 }} aria-label={titulo}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}

export default function ListaHabitosStats({ habitos }: { habitos: HabitoStats[] }) {
  const vigentes = habitos
    .filter((h) => h.activo && !h.finalizado)
    .sort(
      (a, b) =>
        porcentajeGeneral(b) - porcentajeGeneral(a) ||
        b.completadosPeriodo - a.completadosPeriodo,
    );
  const finalizados = habitos
    .filter((h) => h.finalizado)
    .sort((a, b) => (b.fechaFin ?? '').localeCompare(a.fechaFin ?? ''));
  const inactivos = habitos.filter((h) => !h.activo && !h.finalizado);

  return (
    <Box>
      {vigentes.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No tienes hábitos vigentes. Crea o activa uno para ver su progreso aquí.
        </Typography>
      ) : (
        <Box component="ul" sx={{ m: 0, p: 0 }} aria-label="Progreso por hábito">
          {vigentes.map((h) => (
            <FilaHabito key={h.id} h={h} />
          ))}
        </Box>
      )}

      {finalizados.length > 0 && (
        <SeccionPlegable
          titulo={`Finalizados (${finalizados.length})`}
          descripcion="Resultado de todo su periodo."
        >
          {finalizados.map((h) => (
            <FilaFinalizado key={h.id} h={h} />
          ))}
        </SeccionPlegable>
      )}

      {inactivos.length > 0 && (
        <SeccionPlegable titulo={`Inactivos (${inactivos.length})`}>
          {inactivos.map((h) => (
            <FilaHabito key={h.id} h={h} inactivo />
          ))}
        </SeccionPlegable>
      )}
    </Box>
  );
}