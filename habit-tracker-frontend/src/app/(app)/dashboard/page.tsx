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
  Divider,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import ChecklistIcon from '@mui/icons-material/ChecklistOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAltOutlined';
import FireIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import TrophyIcon from '@mui/icons-material/EmojiEventsOutlined';
import {
  statsApi,
  ResumenStats,
  ActividadDia,
  ApiError,
} from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { etiquetaDiaMes, etiquetaDiaSemana } from '@/lib/fechas';

interface DatosDashboard {
  resumen: ResumenStats;
  semana: ActividadDia[];
  mes: ActividadDia[];
}

function BarraCumplimiento({ label, valor }: { label: string; valor: number }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {valor}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={valor}
        color="success"
        sx={{ height: 8, borderRadius: 4 }}
        aria-label={`Cumplimiento ${label}: ${valor}%`}
      />
    </Box>
  );
}

export default function DashboardPage() {
  const { usuario } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const [datos, setDatos] = useState<DatosDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      statsApi.resumen(),
      statsApi.actividad(7),
      statsApi.actividad(30),
    ])
      .then(([resumen, semana, mes]) => setDatos({ resumen, semana, mes }))
      .catch((err) =>
        setError(
          err instanceof ApiError ? err.message : 'No se pudo cargar el resumen',
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

  const { resumen, semana, mes } = datos;

  const tarjetas = [
    {
      label: 'Hábitos activos',
      valor: resumen.habitosActivos,
      icono: <ChecklistIcon color="primary" />,
    },
    {
      label: 'Completados hoy',
      valor: `${resumen.completadosHoy} / ${Math.ceil(resumen.esperadosHoy)}`,
      icono: <TaskAltIcon color="success" />,
    },
    {
      label: 'Racha actual',
      valor: `${resumen.rachaActual} ${resumen.rachaActual === 1 ? 'día' : 'días'}`,
      icono: <FireIcon sx={{ color: 'warning.main' }} />,
    },
    {
      label: 'Mejor racha',
      valor: `${resumen.mejorRacha} ${resumen.mejorRacha === 1 ? 'día' : 'días'}`,
      icono: <TrophyIcon color="secondary" />,
    },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }} style={{ fontWeight: 500 }}>
        Hola, {usuario?.nombre}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Este es el resumen de tu actividad
      </Typography>

      {resumen.totalHabitos === 0 ? (
        <Card variant="outlined" sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Aún no tienes hábitos registrados.
          </Typography>
          <Button variant="contained" onClick={() => router.push('/habitos')}>
            Crear mi primer hábito
          </Button>
        </Card>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {tarjetas.map((t) => (
              <Grid size={{ xs: 6, md: 3 }} key={t.label}>
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
                        {t.label}
                      </Typography>
                      {t.icono}
                    </Box>
                    <Typography variant="h4" style={{ fontWeight: 500 }}>
                      {t.valor}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                    Porcentaje de cumplimiento
                  </Typography>
                  <BarraCumplimiento label="Hoy" valor={resumen.cumplimiento.hoy} />
                  <BarraCumplimiento
                    label="Últimos 7 días"
                    valor={resumen.cumplimiento.semana}
                  />
                  <BarraCumplimiento
                    label="Últimos 30 días"
                    valor={resumen.cumplimiento.mes}
                  />
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total de hábitos
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {resumen.totalHabitos}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Hábitos finalizados
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {resumen.habitosFinalizados}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={() => router.push('/estadisticas')}
                  >
                    Ver estadísticas completas
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    Actividad semanal
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hábitos completados por día (últimos 7 días)
                  </Typography>
                  <BarChart
                    height={260}
                    xAxis={[
                      {
                        scaleType: 'band',
                        data: semana.map((d) => etiquetaDiaSemana(d.fecha)),
                      },
                    ]}
                    yAxis={[{ min: 0, tickMinStep: 1 }]}
                    series={[
                      {
                        data: semana.map((d) => d.completados),
                        label: 'Completados',
                        color: theme.palette.success.main,
                      },
                    ]}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                Progreso mensual
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Porcentaje de cumplimiento diario (últimos 30 días)
              </Typography>
              <LineChart
                height={280}
                xAxis={[
                  {
                    scaleType: 'point',
                    data: mes.map((d) => etiquetaDiaMes(d.fecha)),
                  },
                ]}
                yAxis={[{ min: 0, max: 100 }]}
                series={[
                  {
                    data: mes.map((d) => d.porcentaje),
                    label: 'Cumplimiento (%)',
                    color: theme.palette.secondary.main,
                    showMark: false,
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Button variant="outlined" onClick={() => router.push('/habitos')}>
            Ver todos mis hábitos
          </Button>
        </>
      )}
    </Box>
  );
}