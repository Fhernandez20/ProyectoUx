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
  TextField,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import { habitsApi, Habito, HabitoInput, ApiError } from '@/lib/api';
import HabitoFormDialog from '@/components/HabitoFormDialog';
import { formatoFechaCorta } from '@/lib/fechas';
import { infoPrioridad } from '@/lib/prioridad';
import {
  Filtros,
  FILTROS_INICIALES,
  aplicarFiltros,
  aunNoInicia,
  categoriasDisponibles,
  esVigenteHoy,
  estaFinalizado,
  hayFiltrosActivos,
} from '@/lib/habitos-filtros';

export default function HabitosPage() {
  const [habitos, setHabitos] = useState<Habito[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [habitoEditando, setHabitoEditando] = useState<Habito | null>(null);
  const [habitoAEliminar, setHabitoAEliminar] = useState<Habito | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [completadosHoy, setCompletadosHoy] = useState<Set<string>>(new Set());
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIALES);

  async function cargarHabitos() {
    try {
      const [data, idsCompletados] = await Promise.all([
        habitsApi.listar(),
        habitsApi.completadosHoy(),
      ]);
      setHabitos(data);
      setCompletadosHoy(new Set(idsCompletados));
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
      if (err instanceof ApiError && err.status === 409) {
        // Ya estaba completado hoy (ej. desde otra pestaña): solo sincronizamos la vista
        setCompletadosHoy((prev) => new Set(prev).add(h.id));
      }
      setSnackbar(
        err instanceof ApiError ? err.message : 'No se pudo completar',
      );
    }
  }

  const visibles = habitos ? aplicarFiltros(habitos, filtros) : [];
  const categorias = habitos ? categoriasDisponibles(habitos) : [];

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
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
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

      {habitos && habitos.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Buscar"
                size="small"
                fullWidth
                value={filtros.busqueda}
                onChange={(e) =>
                  setFiltros({ ...filtros, busqueda: e.target.value })
                }
                placeholder="Nombre o descripción"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
              <TextField
                select
                label="Estado"
                size="small"
                fullWidth
                value={filtros.estado}
                onChange={(e) =>
                  setFiltros({
                    ...filtros,
                    estado: e.target.value as Filtros['estado'],
                  })
                }
              >
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="activos">Activos</MenuItem>
                <MenuItem value="inactivos">Inactivos</MenuItem>
                <MenuItem value="finalizados">Finalizados</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
              <TextField
                select
                label="Categoría"
                size="small"
                fullWidth
                value={filtros.categoria}
                onChange={(e) =>
                  setFiltros({ ...filtros, categoria: e.target.value })
                }
              >
                <MenuItem value="todas">Todas</MenuItem>
                {categorias.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <TextField
                select
                label="Ordenar por"
                size="small"
                fullWidth
                value={filtros.orden}
                onChange={(e) =>
                  setFiltros({
                    ...filtros,
                    orden: e.target.value as Filtros['orden'],
                  })
                }
              >
                <MenuItem value="prioridad">Prioridad (alta primero)</MenuItem>
                <MenuItem value="nombre">Nombre (A-Z)</MenuItem>
                <MenuItem value="inicio">Fecha de inicio (recientes)</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary" aria-live="polite">
              Mostrando {visibles.length} de {habitos.length}{' '}
              {habitos.length === 1 ? 'hábito' : 'hábitos'}
            </Typography>
            {hayFiltrosActivos(filtros) && (
              <Button
                size="small"
                onClick={() => setFiltros(FILTROS_INICIALES)}
              >
                Limpiar filtros
              </Button>
            )}
          </Box>
        </Box>
      )}

      {habitos && habitos.length > 0 && visibles.length === 0 && (
        <Card variant="outlined" sx={{ textAlign: 'center', py: 5 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Ningún hábito coincide con los filtros.
          </Typography>
          <Button variant="outlined" onClick={() => setFiltros(FILTROS_INICIALES)}>
            Limpiar filtros
          </Button>
        </Card>
      )}

      <Grid container spacing={2}>
        {visibles.map((h) => {
          const completadoHoy = completadosHoy.has(h.id);
          const finalizado = estaFinalizado(h);
          const porIniciar = aunNoInicia(h);
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
                  <Typography variant="h6" style={{ fontWeight: 500 }}>
                    {h.nombre}
                  </Typography>
                  <Switch
                    checked={h.activo}
                    onChange={() => toggleActivo(h)}
                    size="small"
                    slotProps={{
                      input: {
                        'aria-label': `Activar o desactivar ${h.nombre}`,
                      },
                    }}
                  />
                </Box>
                {h.descripcion && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {h.descripcion}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Desde {formatoFechaCorta(h.fechaInicio)}
                  {h.fechaFin ? ` · hasta ${formatoFechaCorta(h.fechaFin)}` : ''}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  <Chip label={h.frecuencia} size="small" />
                  {h.categoria && (
                    <Chip label={h.categoria} size="small" variant="outlined" />
                  )}
                  <Chip
                    label={`Prioridad ${infoPrioridad(h.prioridad).label.toLowerCase()}`}
                    size="small"
                    variant="outlined"
                    color={infoPrioridad(h.prioridad).color}
                  />
                  {!h.activo && (
                    <Chip label="Inactivo" size="small" color="default" />
                  )}
                  {finalizado && (
                    <Chip label="Finalizado" size="small" color="warning" />
                  )}
                  {porIniciar && (
                    <Chip
                      label={`Inicia el ${formatoFechaCorta(h.fechaInicio)}`}
                      size="small"
                      variant="outlined"
                    />
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
                  disabled={!esVigenteHoy(h) || completadoHoy}
                >
                  {completadoHoy ? 'Completado' : 'Completar hoy'}
                </Button>
                <Box>
                  <IconButton
                    size="small"
                    aria-label={`Editar ${h.nombre}`}
                    onClick={() => abrirEditar(h)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={`Eliminar ${h.nombre}`}
                    onClick={() => setHabitoAEliminar(h)}
                  >
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