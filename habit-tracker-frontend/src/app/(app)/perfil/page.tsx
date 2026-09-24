'use client';

import { useEffect, useState, FormEvent } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  usersApi,
  statsApi,
  Usuario,
  ResumenStats,
  SemanaTendencia,
  HabitoStats,
  ApiError,
} from '@/lib/api';
import Logros from '@/components/perfil/Logros';
import { useAuth } from '@/lib/auth-context';
import { perfilSchema, primerError } from '@/lib/schemas';

function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function fechaLarga(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function Dato({
  label,
  valor,
  detalle,
}: {
  label: string;
  valor: string | number;
  detalle?: string;
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" style={{ fontWeight: 500 }} noWrap>
        {valor}
      </Typography>
      {detalle && (
        <Typography variant="caption" color="text.secondary">
          {detalle}
        </Typography>
      )}
    </Box>
  );
}

function diasDesde(iso?: string): number {
  if (!iso) return 0;
  const inicio = new Date(iso);
  inicio.setHours(0, 0, 0, 0);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.max(1, Math.round((hoy.getTime() - inicio.getTime()) / 86_400_000) + 1);
}

function masConstante(habitos: HabitoStats[]): HabitoStats | null {
  const conRacha = habitos.filter((h) => h.frecuencia !== 'semanal' && h.mejorRacha > 0);
  if (conRacha.length === 0) return null;
  return [...conRacha].sort(
    (a, b) => b.mejorRacha - a.mejorRacha || b.completadosMes - a.completadosMes,
  )[0];
}

const plural = (n: number, uno: string, varios: string) =>
  `${n} ${n === 1 ? uno : varios}`;

export default function PerfilPage() {
  const { actualizarUsuario } = useAuth();
  const [perfil, setPerfil] = useState<Usuario | null>(null);
  const [resumen, setResumen] = useState<ResumenStats | null>(null);
  const [tendencia, setTendencia] = useState<SemanaTendencia[]>([]);
  const [habitos, setHabitos] = useState<HabitoStats[]>([]);
  const [cargaError, setCargaError] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      usersApi.me(),
      statsApi.resumen(),
      statsApi.tendencia(12),
      statsApi.porHabito(),
    ])
      .then(([u, r, t, h]) => {
        setPerfil(u);
        setNombre(u.nombre);
        setResumen(r);
        setTendencia(t);
        setHabitos(h);
      })
      .catch((err) =>
        setCargaError(
          err instanceof ApiError ? err.message : 'No se pudo cargar el perfil',
        ),
      );
  }, []);

  if (cargaError) {
    return <Alert severity="error">{cargaError}</Alert>;
  }

  if (!perfil || !resumen) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const sinCambios = nombre.trim() === perfil.nombre;
  const constante = masConstante(habitos);
  const semanaPerfecta = tendencia.some(
    (t) => t.conHabitos !== false && t.porcentaje >= 100,
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorForm(null);

    const errorValidacion = primerError(perfilSchema, { nombre });
    if (errorValidacion) {
      setErrorForm(errorValidacion);
      return;
    }

    setGuardando(true);
    try {
      const actualizado = await usersApi.actualizar({ nombre: nombre.trim() });
      setPerfil(actualizado);
      setNombre(actualizado.nombre);
      actualizarUsuario(actualizado);
      setSnackbar('Perfil actualizado');
    } catch (err) {
      setErrorForm(
        err instanceof ApiError ? err.message : 'No se pudo guardar el cambio',
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 500 }}>
        Mi perfil
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Consulta y edita tu información personal
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'secondary.main',
                  fontSize: '1.75rem',
                }}
                aria-label={`Avatar de ${perfil.nombre}`}
              >
                {iniciales(perfil.nombre)}
              </Avatar>
              <Typography variant="h6" style={{ fontWeight: 500 }}>
                {perfil.nombre}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {perfil.correo}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                Miembro desde {fechaLarga(perfil.fechaRegistro)}
              </Typography>
            </CardContent>
          </Card>

          <Box sx={{ mt: 2 }}>
            <Logros
              datos={{
                totalHabitos: resumen.totalHabitos,
                mejorRacha: resumen.mejorRacha,
                totalCompletados: resumen.totalCompletados,
                semanaPerfecta,
              }}
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                Tu actividad
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                  gap: 2,
                }}
              >
                <Dato
                  label="Días en la app"
                  valor={diasDesde(perfil.fechaRegistro)}
                />
                <Dato
                  label="Veces completadas"
                  valor={resumen.totalCompletados}
                  detalle="Desde que empezaste"
                />
                <Dato
                  label="Tu hábito más constante"
                  valor={constante ? constante.nombre : 'Aún ninguno'}
                  detalle={
                    constante
                      ? `Mejor racha: ${plural(constante.mejorRacha, 'día', 'días')}`
                      : 'Completa un hábito para verlo aquí'
                  }
                />
              </Box>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                Editar información
              </Typography>
              <Box
                component="form"
                onSubmit={handleSubmit}
                noValidate
                sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
              >
                {errorForm && <Alert severity="error">{errorForm}</Alert>}
                <TextField
                  label="Nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  fullWidth
                  required
                />
                <TextField
                  label="Correo"
                  value={perfil.correo}
                  fullWidth
                  disabled
                  helperText="El correo no se puede cambiar"
                />
                <Box>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={guardando || sinCambios}
                  >
                    {guardando ? 'Guardando…' : 'Guardar cambios'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
        message={snackbar}
      />
    </Box>
  );
}