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
} from '@mui/material';
import { habitsApi, Habito, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const { usuario } = useAuth();
  const router = useRouter();
  const [habitos, setHabitos] = useState<Habito[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    habitsApi
      .listar()
      .then(setHabitos)
      .catch((err) =>
        setError(
          err instanceof ApiError ? err.message : 'No se pudo cargar el resumen',
        ),
      );
  }, []);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!habitos) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const activos = habitos.filter((h) => h.activo).length;
  const total = habitos.length;

  const tarjetas = [
    { label: 'Hábitos activos', valor: activos },
    { label: 'Total de hábitos', valor: total },
    { label: 'Inactivos', valor: total - activos },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }} style={{ fontWeight: 500 }}>
        Hola, {usuario?.nombre}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Este es el resumen de tu actividad
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {tarjetas.map((t) => (
          <Grid size={{ xs: 12, sm: 4 }} key={t.label}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {t.label}
                </Typography>
                <Typography variant="h3" style={{ fontWeight: 500 }}>
                  {t.valor}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {total === 0 ? (
        <Card variant="outlined" sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Aún no tienes hábitos registrados.
          </Typography>
          <Button variant="contained" onClick={() => router.push('/habitos')}>
            Crear mi primer hábito
          </Button>
        </Card>
      ) : (
        <Button variant="outlined" onClick={() => router.push('/habitos')}>
          Ver todos mis hábitos
        </Button>
      )}
    </Box>
  );
}
