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
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open) {
      setNombre(habito?.nombre ?? '');
      setDescripcion(habito?.descripcion ?? '');
      setCategoria(habito?.categoria ?? '');
      setFrecuencia(habito?.frecuencia ?? 'diario');
      setPrioridad(habito?.prioridad ?? 1);
      setError(null);
    }
  }, [open, habito]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      await onGuardar({
        nombre,
        descripcion: descripcion || undefined,
        categoria: categoria || undefined,
        frecuencia,
        prioridad,
      });
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
          <TextField
            label="Prioridad"
            type="number"
            fullWidth
            margin="normal"
            value={prioridad}
            onChange={(e) => setPrioridad(Number(e.target.value))}
            inputProps={{ min: 1 }}
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
