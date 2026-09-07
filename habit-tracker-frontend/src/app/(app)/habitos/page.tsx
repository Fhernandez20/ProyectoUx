'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Switch,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import { habitsApi, Habito, HabitoInput, ApiError } from '@/lib/api';
import HabitoFormDialog from '@/components/HabitoFormDialog';

export default function HabitosPage() {
  const [habitos, setHabitos] = useState<Habito[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [habitoEditando, setHabitoEditando] = useState<Habito | null>(null);
  const [habitoAEliminar, setHabitoAEliminar] = useState<Habito | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [completadosHoy, setCompletadosHoy] = useState<Set<string>>(new Set());

  async function cargarHabitos() {
    try {
      const data = await habitsApi.listar();
      setHabitos(data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'No se pudieron cargar los hábitos',
      );
    }
  }

  useEffect(() => {
    cargarHabitos();
  }, []);

  function abrirCrear() {
    setHabitoEditando(null);
    setDialogAbierto(true);
  }

  function abrirEditar(h: Habito) {
    setHabitoEditando(h);
    setDialogAbierto(true);
  }

  async function guardarHabito(data: HabitoInput) {
    if (habitoEditando) {
      await habitsApi.actualizar(habitoEditando.id, data);
      setSnackbar('Hábito actualizado');
    } else {
      await habitsApi.crear(data);
      setSnackbar('Hábito creado');
    }
    await cargarHabitos();
  }

  async function confirmarEliminar() {
    if (!habitoAEliminar) return;
    try {
      await habitsApi.eliminar(habitoAEliminar.id);
      setSnackbar('Hábito eliminado');
      setHabitoAEliminar(null);
      await cargarHabitos();
    } catch (err) {
      setSnackbar(
        err instanceof ApiError ? err.message : 'No se pudo eliminar',
      );
    }
  }

  async function toggleActivo(h: Habito) {
    try {
      await habitsApi.toggle(h.id);
      await cargarHabitos();
    } catch (err) {
      setSnackbar(
        err instanceof ApiError ? err.message : 'No se pudo actualizar',
      );
    }
  }

  async function completarHoy(h: Habito) {
    try {
      await habitsApi.completar(h.id);
      setCompletadosHoy((prev) => new Set(prev).add(h.id));
      setSnackbar(`"${h.nombre}" marcado como completado hoy`);
    } catch (err) {
      setSnackbar(
        err instanceof ApiError ? err.message : 'No se pudo completar',
      );
    }
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight={500}>
          Mis hábitos
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirCrear}>
          Nuevo hábito
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!habitos && !error && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {habitos && habitos.length === 0 && (
        <Card variant="outlined" sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">
            Todavía no tienes hábitos. Crea el primero para empezar.
          </Typography>
        </Card>
      )}

      <Grid container spacing={2}>
        {habitos?.map((h) => {
          const completadoHoy = completadosHoy.has(h.id);
          return (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={h.id}>
            <Card
              variant="outlined"
              sx={
                completadoHoy
                  ? { borderColor: 'success.main', borderWidth: 2, bgcolor: 'rgba(22, 163, 74, 0.04)' }
                  : undefined
              }
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Typography variant="h6" fontWeight={500}>
                    {h.nombre}
                  </Typography>
                  <Switch
                    checked={h.activo}
                    onChange={() => toggleActivo(h)}
                    size="small"
                  />
                </Box>
                {h.descripcion && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {h.descripcion}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  <Chip label={h.frecuencia} size="small" />
                  {h.categoria && (
                    <Chip label={h.categoria} size="small" variant="outlined" />
                  )}
                  {!h.activo && (
                    <Chip label="Inactivo" size="small" color="default" />
                  )}
                  {completadoHoy && (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Completado hoy"
                      size="small"
                      color="success"
                    />
                  )}
                </Box>
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
                <Button
                  size="small"
                  color={completadoHoy ? 'success' : 'primary'}
                  startIcon={<CheckCircleIcon />}
                  onClick={() => completarHoy(h)}
                  disabled={!h.activo || completadoHoy}
                >
                  {completadoHoy ? 'Completado' : 'Completar hoy'}
                </Button>
                <Box>
                  <IconButton size="small" onClick={() => abrirEditar(h)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => setHabitoAEliminar(h)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </CardActions>
            </Card>
          </Grid>
          );
        })}
      </Grid>

      <HabitoFormDialog
        open={dialogAbierto}
        habito={habitoEditando}
        onClose={() => setDialogAbierto(false)}
        onGuardar={guardarHabito}
      />

      <Dialog open={!!habitoAEliminar} onClose={() => setHabitoAEliminar(null)}>
        <DialogTitle>¿Eliminar hábito?</DialogTitle>
        <DialogContent>
          <Typography>
            Esto eliminará &quot;{habitoAEliminar?.nombre}&quot; permanentemente.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHabitoAEliminar(null)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={confirmarEliminar}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
        message={snackbar}
      />
    </Box>
  );
}
