'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  Chip,
  IconButton,
  Switch,
  Snackbar,
  Alert,
  CircularProgress,
  Stack,
  Tooltip,
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CirculoIcon from '@mui/icons-material/RadioButtonUnchecked';
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
  const [enProceso, setEnProceso] = useState<Set<string>>(new Set());

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

  function marcarEnProceso(id: string, activo: boolean) {
    setEnProceso((prev) => {
      const nuevo = new Set(prev);
      if (activo) nuevo.add(id);
      else nuevo.delete(id);
      return nuevo;
    });
  }

  function marcarCompletado(id: string, completado: boolean) {
    setCompletadosHoy((prev) => {
      const nuevo = new Set(prev);
      if (completado) nuevo.add(id);
      else nuevo.delete(id);
      return nuevo;
    });
  }

  async function alternarCompletado(h: Habito) {
    const yaCompletado = completadosHoy.has(h.id);
    marcarEnProceso(h.id, true);
    try {
      if (yaCompletado) {
        await habitsApi.descompletar(h.id);
        marcarCompletado(h.id, false);
        setSnackbar(`"${h.nombre}" desmarcado`);
      } else {
        await habitsApi.completar(h.id);
        marcarCompletado(h.id, true);
        setSnackbar(`"${h.nombre}" completado hoy`);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) marcarCompletado(h.id, true);
      if (err instanceof ApiError && err.status === 404 && yaCompletado) {
        marcarCompletado(h.id, false);
      }
      setSnackbar(err instanceof ApiError ? err.message : 'No se pudo actualizar');
    } finally {
      marcarEnProceso(h.id, false);
    }
  }

  function motivoNoDisponible(h: Habito): string | null {
    if (!h.activo) return 'Activa el hábito para poder completarlo';
    if (estaFinalizado(h)) return 'Este hábito ya finalizó';
    if (aunNoInicia(h)) return `Este hábito inicia el ${formatoFechaCorta(h.fechaInicio)}`;
    return null;
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
                Restablecer filtros
              </Button>
            )}
          </Box>
        </Box>
      )}

      {habitos && habitos.length > 0 && visibles.length === 0 && (
        <Card variant="outlined" sx={{ textAlign: 'center', py: 5 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {hayFiltrosActivos(filtros)
              ? 'Ningún hábito coincide con los filtros.'
              : 'No tienes hábitos activos en este momento.'}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setFiltros({ ...FILTROS_INICIALES, estado: 'todos' })}
          >
            Ver todos los hábitos
          </Button>
        </Card>
      )}

      <Stack spacing={1.5} component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
        {visibles.map((h) => {
          const completadoHoy = completadosHoy.has(h.id);
          const finalizado = estaFinalizado(h);
          const porIniciar = aunNoInicia(h);
          const procesando = enProceso.has(h.id);
          const motivo = completadoHoy ? null : motivoNoDisponible(h);
          const prioridad = infoPrioridad(h.prioridad);

          const botonCompletar = (
            <Button
              variant={completadoHoy ? 'contained' : 'outlined'}
              color={completadoHoy ? 'success' : 'secondary'}
              onClick={() => alternarCompletado(h)}
              disabled={procesando || (!completadoHoy && !esVigenteHoy(h))}
              aria-pressed={completadoHoy}
              startIcon={
                procesando ? (
                  <CircularProgress size={16} color="inherit" />
                ) : completadoHoy ? (
                  <CheckCircleIcon />
                ) : (
                  <CirculoIcon />
                )
              }
              sx={{
                minWidth: 168,
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none' },
              }}
            >
              {completadoHoy ? 'Completado' : 'Completar hoy'}
            </Button>
          );

          return (
            <Card
              key={h.id}
              component="li"
              variant="outlined"
              sx={{
                transition: 'border-color 0.2s, background-color 0.2s',
                ...(completadoHoy && {
                  borderColor: 'success.main',
                  bgcolor: 'rgba(22, 163, 74, 0.04)',
                }),
                ...(!h.activo && { opacity: 0.75 }),
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: { xs: 'stretch', md: 'center' },
                  gap: { xs: 1.5, md: 3 },
                  px: { xs: 2, sm: 2.5 },
                  py: 2,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
                      {h.nombre}
                    </Typography>
                    <Chip
                      label={prioridad.label}
                      size="small"
                      variant="outlined"
                      color={prioridad.color}
                    />
                    {!h.activo && <Chip label="Inactivo" size="small" />}
                    {finalizado && <Chip label="Finalizado" size="small" color="warning" />}
                    {porIniciar && (
                      <Chip
                        label={`Inicia el ${formatoFechaCorta(h.fechaInicio)}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {h.descripcion && (
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.25 }}>
                      {h.descripcion}
                    </Typography>
                  )}

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      flexWrap: 'wrap',
                      mt: 1,
                    }}
                  >
                    <Chip label={h.frecuencia} size="small" />
                    {h.categoria && <Chip label={h.categoria} size="small" variant="outlined" />}
                    <Typography variant="caption" color="text.secondary">
                      Desde {formatoFechaCorta(h.fechaInicio)}
                      {h.fechaFin ? ` · hasta ${formatoFechaCorta(h.fechaFin)}` : ''}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: { xs: 'space-between', md: 'flex-end' },
                    gap: 1,
                    flexShrink: 0,
                  }}
                >
                  {motivo ? (
                    <Tooltip title={motivo} arrow>
                      <span>{botonCompletar}</span>
                    </Tooltip>
                  ) : completadoHoy ? (
                    <Tooltip title="Haz clic para desmarcarlo" arrow>
                      {botonCompletar}
                    </Tooltip>
                  ) : (
                    botonCompletar
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Tooltip title={h.activo ? 'Desactivar' : 'Activar'} arrow>
                      <Switch
                        checked={h.activo}
                        onChange={() => toggleActivo(h)}
                        size="small"
                        slotProps={{
                          input: { 'aria-label': `Activar o desactivar ${h.nombre}` },
                        }}
                      />
                    </Tooltip>
                    <Tooltip title="Editar" arrow>
                      <IconButton aria-label={`Editar ${h.nombre}`} onClick={() => abrirEditar(h)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar" arrow>
                      <IconButton
                        aria-label={`Eliminar ${h.nombre}`}
                        onClick={() => setHabitoAEliminar(h)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            </Card>
          );
        })}
      </Stack>

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