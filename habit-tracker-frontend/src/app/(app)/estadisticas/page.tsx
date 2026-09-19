'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveIcon from '@mui/icons-material/Remove';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import {
  statsApi,
  ResumenStats,
  SemanaTendencia,
  ActividadDia,
  HabitoStats,
  ApiError,
} from '@/lib/api';
import { etiquetaDiaMes } from '@/lib/fechas';

interface DatosEstadisticas {
  resumen: ResumenStats;
  tendencia: SemanaTendencia[];
  mes: ActividadDia[];
  habitos: HabitoStats[];
}

function TarjetaNumero({ label, valor }: { label: string; valor: string | number }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {label}
        </Typography>
        <Typography variant="h4" style={{ fontWeight: 500 }}>
          {valor}
        </Typography>
      </CardContent>
    </Card>
  );
}

function ChipTendencia({ tendencia }: { tendencia: SemanaTendencia[] }) {
  if (tendencia.length < 2) return null;
  const actual = tendencia[tendencia.length - 1].porcentaje;
  const anterior = tendencia[tendencia.length - 2].porcentaje;
  const diff = actual - anterior;

  if (diff > 0) {
    return (
      <Chip
        icon={<TrendingUpIcon />}
        color="success"
        size="small"
        label={`+${diff} puntos vs. semana anterior`}
      />
    );
  }
  if (diff < 0) {
    return (
      <Chip
        icon={<TrendingDownIcon />}
        color="error"
        size="small"
        label={`${diff} puntos vs. semana anterior`}
      />
    );
  }
  return (
    <Chip
      icon={<TrendingFlatIcon />}
      size="small"
      label="Igual que la semana anterior"
    />
  );
}

export default function EstadisticasPage() {
  const router = useRouter();
  const theme = useTheme();
  const [datos, setDatos] = useState<DatosEstadisticas | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      statsApi.resumen(),
      statsApi.tendencia(8),
      statsApi.actividad(30),
      statsApi.porHabito(),
    ])
      .then(([resumen, tendencia, mes, habitos]) =>
        setDatos({ resumen, tendencia, mes, habitos }),
      )
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.message
            : 'No se pudieron cargar las estadísticas',
        ),
      );
  }, []);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!datos) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const { resumen, tendencia, mes, habitos } = datos;

  if (resumen.totalHabitos === 0) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 500 }}>
          Estadísticas
        </Typography>
        <Card variant="outlined" sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Crea tu primer hábito para empezar a ver estadísticas.
          </Typography>
          <Button variant="contained" onClick={() => router.push('/habitos')}>
            Crear mi primer hábito
          </Button>
        </Card>
      </Box>
    );
  }

  const completadosMes = mes.reduce((suma, d) => suma + d.completados, 0);

  // Activos primero; dentro de cada grupo, mayor racha primero
  const habitosOrdenados = [...habitos].sort(
    (a, b) =>
      Number(b.activo) - Number(a.activo) || b.rachaActual - a.rachaActual,
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 500 }}>
        Estadísticas
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tu progreso y la evolución de tus hábitos
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <TarjetaNumero label="Total de hábitos" valor={resumen.totalHabitos} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <TarjetaNumero label="Hábitos activos" valor={resumen.habitosActivos} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <TarjetaNumero
            label="Hábitos finalizados"
            valor={resumen.habitosFinalizados}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <TarjetaNumero
            label="Días consecutivos"
            valor={`${resumen.rachaActual} ${resumen.rachaActual === 1 ? 'día' : 'días'}`}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                Progreso mensual
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Últimos 30 días
              </Typography>
              <Typography variant="h3" style={{ fontWeight: 500 }}>
                {resumen.cumplimiento.mes}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={resumen.cumplimiento.mes}
                color="success"
                sx={{ height: 8, borderRadius: 4, my: 2 }}
                aria-label={`Progreso mensual: ${resumen.cumplimiento.mes}%`}
              />
              <Typography variant="body2" color="text.secondary">
                {completadosMes}{' '}
                {completadosMes === 1 ? 'hábito completado' : 'hábitos completados'}{' '}
                en el mes
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Mejor racha: {resumen.mejorRacha}{' '}
                {resumen.mejorRacha === 1 ? 'día' : 'días'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    Tendencia de cumplimiento
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Porcentaje por semana (últimas 8 semanas)
                  </Typography>
                </Box>
                <ChipTendencia tendencia={tendencia} />
              </Box>
              <LineChart
                height={260}
                xAxis={[
                  {
                    scaleType: 'point',
                    data: tendencia.map((t) => etiquetaDiaMes(t.desde)),
                    label: 'Semana que inicia el',
                  },
                ]}
                yAxis={[{ min: 0, max: 100 }]}
                series={[
                  {
                    data: tendencia.map((t) => t.porcentaje),
                    label: 'Cumplimiento (%)',
                    color: theme.palette.secondary.main,
                  },
                ]}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
            Seguimiento por hábito
          </Typography>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" aria-label="Seguimiento por hábito">
              <TableHead>
                <TableRow>
                  <TableCell>Hábito</TableCell>
                  <TableCell align="center">Hoy</TableCell>
                  <TableCell align="center">Esta semana</TableCell>
                  <TableCell align="center">Este mes</TableCell>
                  <TableCell align="center">Racha actual</TableCell>
                  <TableCell align="center">Mejor racha</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {habitosOrdenados.map((h) => (
                  <TableRow
                    key={h.id}
                    sx={{ opacity: h.activo ? 1 : 0.55 }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {h.nombre}
                        </Typography>
                        <Chip label={h.frecuencia} size="small" />
                        {!h.activo && (
                          <Chip label="Inactivo" size="small" variant="outlined" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {h.completadoHoy ? (
                        <CheckCircleIcon
                          color="success"
                          fontSize="small"
                          aria-label="Completado hoy"
                        />
                      ) : (
                        <RemoveIcon
                          fontSize="small"
                          sx={{ color: 'text.disabled' }}
                          aria-label="Pendiente"
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">{h.completadosSemana} / 7</TableCell>
                    <TableCell align="center">{h.completadosMes} / 30</TableCell>
                    <TableCell align="center">
                      {h.rachaActual} {h.rachaActual === 1 ? 'día' : 'días'}
                    </TableCell>
                    <TableCell align="center">
                      {h.mejorRacha} {h.mejorRacha === 1 ? 'día' : 'días'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}