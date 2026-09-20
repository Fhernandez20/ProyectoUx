'use client';

import { useState, FormEvent, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';
import { Habito, HabitoInput, ApiError } from '@/lib/api';
import { habitoSchema, primerError } from '@/lib/schemas';
import { aFechaApi, fechaLocal, hoyLocal } from '@/lib/fechas';

interface Props {
  open: boolean;
  habito: Habito | null; // null = creando, con valor = editando
  onClose: () => void;
  onGuardar: (data: HabitoInput) => Promise<void>;
}

const frecuencias = [
  { value: 'diario', label: 'Diario' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'personalizada', label: 'Personalizada' },
];

export default function HabitoFormDialog({
  open,
  habito,
  onClose,
  onGuardar,
}: Props) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [frecuencia, setFrecuencia] =
    useState<HabitoInput['frecuencia']>('diario');
  const [prioridad, setPrioridad] = useState(1);
  const [fechaInicio, setFechaInicio] = useState(hoyLocal());
  const [fechaFin, setFechaFin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open) {
      setNombre(habito?.nombre ?? '');
      setDescripcion(habito?.descripcion ?? '');
      setCategoria(habito?.categoria ?? '');
      setFrecuencia(habito?.frecuencia ?? 'diario');
      setPrioridad(habito?.prioridad ?? 1);
      setFechaInicio(habito ? fechaLocal(habito.fechaInicio) : hoyLocal());
      setFechaFin(habito?.fechaFin ? fechaLocal(habito.fechaFin) : '');
      setError(null);
    }
  }, [open, habito]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Validación con las fechas tal como las escribe el usuario (YYYY-MM-DD)
    const errorValidacion = primerError(habitoSchema, {
      nombre,
      descripcion: descripcion || undefined,
      categoria: categoria || undefined,
      frecuencia,
      prioridad,
      fechaInicio: fechaInicio || undefined,
      fechaFin: fechaFin || undefined,
    });
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    // Al editar, un campo vacío se envía vacío/null para que el backend lo borre
    // (con undefined el backend lo interpretaría como "no cambiar").
    const editando = !!habito;
    const datos: HabitoInput = {
      nombre,
      descripcion: descripcion || (editando ? '' : undefined),
      categoria: categoria || (editando ? '' : undefined),
      frecuencia,
      prioridad,
      fechaInicio: aFechaApi(fechaInicio),
      fechaFin: fechaFin ? aFechaApi(fechaFin) : editando ? null : undefined,
    };

    setError(null);
    setGuardando(true);
    try {
      await onGuardar(datos);
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'No se pudo guardar el hábito',
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{habito ? 'Editar hábito' : 'Nuevo hábito'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            label="Nombre"
            fullWidth
            required
            margin="normal"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <TextField
            label="Descripción"
            fullWidth
            multiline
            rows={2}
            margin="normal"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
          <TextField
            label="Categoría"
            fullWidth
            margin="normal"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          />
          <TextField
            select
            label="Frecuencia"
            fullWidth
            required
            margin="normal"
            value={frecuencia}
            onChange={(e) =>
              setFrecuencia(e.target.value as HabitoInput['frecuencia'])
            }
          >
            {frecuencias.map((f) => (
              <MenuItem key={f.value} value={f.value}>
                {f.label}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              label="Fecha de inicio"
              type="date"
              fullWidth
              required
              margin="normal"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Fecha de fin"
              type="date"
              fullWidth
              margin="normal"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              helperText="Opcional: déjala vacía si no termina"
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { min: fechaInicio || undefined },
              }}
            />
          </Box>
          <TextField
            label="Prioridad"
            type="number"
            fullWidth
            margin="normal"
            value={prioridad}
            onChange={(e) => setPrioridad(Number(e.target.value))}
            slotProps={{ htmlInput: { min: 1 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={guardando}>
            {guardando ? <CircularProgress size={22} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}