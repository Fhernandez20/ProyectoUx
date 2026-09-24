'use client';

import { useEffect, useState, type ReactNode } from 'react';
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
  useTheme,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import ListAltIcon from '@mui/icons-material/ListAltOutlined';
import ChecklistIcon from '@mui/icons-material/ChecklistOutlined';
import FlagIcon from '@mui/icons-material/FlagOutlined';
import FireIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
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
import { etiquetaRangoSemana } from '@/lib/fechas';
import ListaHabitosStats from '@/components/estadisticas/ListaHabitosStats';

interface DatosEstadisticas {
  resumen: ResumenStats;
  tendencia: SemanaTendencia[];
  mes: ActividadDia[];
  habitos: HabitoStats[];
}

function TarjetaNumero({
  label,
  valor,
  icono,
}: {
  label: string;
  valor: string | number;
  icono: ReactNode;
}) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          {icono}
        </Box>
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

  if (actual > anterior) {
    return (
      <Chip
        icon={<TrendingUpIcon />}
        color="success"
        size="small"
        label={`Subiste de ${anterior}% a ${actual}% esta semana`}
      />
    );
  }
  if (actual < anterior) {
    return (
      <Chip
        icon={<TrendingDownIcon />}
        color="error"
        size="small"
        label={`Bajaste de ${anterior}% a ${actual}% esta semana`}
      />
    );
  }
  return (
    <Chip
      icon={<TrendingFlatIcon />}
      size="small"
      label={`Igual que la semana pasada (${actual}%)`}
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

  const { resumen, mes, habitos } = datos;

  const primeraConHabitos = datos.tendencia.findIndex((t) => t.conHabitos !== false);
  const tendencia =
    primeraConHabitos === -1 ? [] : datos.tendencia.slice(primeraConHabitos);
  const recortada = tendencia.length < datos.tendencia.length;

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
          <TarjetaNumero
            label="Total de hábitos"
            valor={resumen.totalHabitos}
            icono={<ListAltIcon sx={{ color: 'text.secondary' }} />}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <TarjetaNumero
            label="Hábitos activos"
            valor={resumen.habitosActivos}
            icono={<ChecklistIcon color="primary" />}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <TarjetaNumero
            label="Hábitos finalizados"
            valor={resumen.habitosFinalizados}
            icono={<FlagIcon color="secondary" />}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <TarjetaNumero
            label="Racha actual"
            valor={`${resumen.rachaActual} ${resumen.rachaActual === 1 ? 'día' : 'días'}`}
            icono={<FireIcon sx={{ color: 'warning.main' }} />}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            variant="outlined"
            sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
                Has completado {completadosMes}{' '}
                {completadosMes === 1 ? 'vez' : 'veces'} tus hábitos
              </Typography>

              <Box
                sx={{
                  mt: 'auto',
                  pt: 2,
                  borderTop: 1,
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Mejor racha
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FireIcon sx={{ color: 'warning.main', fontSize: 40 }} />
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 500, color: 'warning.dark' }}
                  >
                    {resumen.mejorRacha}{' '}
                    {resumen.mejorRacha === 1 ? 'día' : 'días'}
                  </Typography>
                </Box>
              </Box>
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
                    {recortada
                      ? 'Porcentaje por semana, desde que empezaste'
                      : `Porcentaje por semana (últimas ${tendencia.length} semanas)`}
                  </Typography>
                </Box>
                <ChipTendencia tendencia={tendencia} />
              </Box>
              <LineChart
                height={260}
                margin={{ right: 48 }}
                xAxis={[
                  {
                    scaleType: 'point',
                    data: tendencia.map((t, i) =>
                      i === tendencia.length - 1
                        ? 'Esta semana'
                        : etiquetaRangoSemana(t.desde, t.hasta),
                    ),
                  },
                ]}
                yAxis={[{ min: 0, max: 100 }]}
                series={[
                  {
                    data: tendencia.map((t) => t.porcentaje),
                    label: 'Cumplimiento (%)',
                    color: theme.palette.secondary.main,
                    curve: 'linear',
                    showMark: true,
                    valueFormatter: (v) => (v == null ? '' : `${v}%`),
                  },
                ]}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card variant="outlined">
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              Seguimiento por hábito
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Desde que empezaste
            </Typography>
          </Box>
          <ListaHabitosStats habitos={habitos} />
        </CardContent>
      </Card>
    </Box>
  );
}