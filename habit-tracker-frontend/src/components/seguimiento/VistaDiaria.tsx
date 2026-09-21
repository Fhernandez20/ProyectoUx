'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  LinearProgress,
  Snackbar,
  Typography,
} from '@mui/material';
import { habitsApi, ApiError } from '@/lib/api';
import { hoyLocal } from '@/lib/fechas';
import { useSeguimiento } from '@/lib/useSeguimiento';
import {
  capitalizar,
  fechaLarga,
  ordenarHabitos,
  sumarDiasClave,
} from '@/lib/seguimiento';
import NavegadorPeriodo from './NavegadorPeriodo';
import ListaHabitosDia from './ListaHabitosDia';

export default function VistaDiaria() {
  const hoy = hoyLocal();
  const [fecha, setFecha] = useState(hoy);
  const [version, setVersion] = useState(0);
  const [completandoId, setCompletandoId] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const { datos, cargando, error } = useSeguimiento(fecha, fecha, version);

  async function completar(id: string) {
    setCompletandoId(id);
    try {
      await habitsApi.completar(id);
      setMensaje('¡Hábito completado!');
    } catch (err) {
      setMensaje(err instanceof ApiError ? err.message : 'No se pudo completar');
    } finally {
      setCompletandoId(null);
      setVersion((v) => v + 1);
    }
  }

  // Solo se muestra la respuesta si corresponde a la fecha elegida
  const listo = datos && datos.desde === fecha && datos.dias.length === 1;
  const dia = listo ? datos.dias[0] : null;
  const habitosDia =
    listo && dia
      ? ordenarHabitos(datos.habitos.filter((h) => dia.aplicanIds.includes(h.id)))
      : [];
  const hechos = dia
    ? habitosDia.filter((h) => dia.completadosIds.includes(h.id)).length
    : 0;
  const progreso = habitosDia.length ? Math.round((hechos / habitosDia.length) * 100) : 0;

  return (
    <Box>
      <NavegadorPeriodo
        titulo={capitalizar(fechaLarga(fecha))}
        etiquetaActual="Hoy"
        esActual={fecha === hoy}
        etiquetaAnterior="Día anterior"
        etiquetaSiguiente="Día siguiente"
        siguienteDeshabilitado={fecha >= hoy}
        onAnterior={() => setFecha(sumarDiasClave(fecha, -1))}
        onSiguiente={() => setFecha(sumarDiasClave(fecha, 1))}
        onVolverAlActual={() => setFecha(hoy)}
      />

      {error && <Alert severity="error">{error}</Alert>}

      {!error && !listo && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!error && listo && (
        <Card variant="outlined">
          <CardContent>
            {habitosDia.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No tenías hábitos programados este día.
              </Typography>
            ) : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {hechos} de {habitosDia.length}{' '}
                    {habitosDia.length === 1 ? 'hábito completado' : 'hábitos completados'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {progreso}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progreso}
                  color="success"
                  sx={{ height: 8, borderRadius: 4, mb: 2 }}
                  aria-label={`Progreso del día: ${hechos} de ${habitosDia.length}`}
                />
                {cargando && <LinearProgress sx={{ mb: 1 }} />}
                <ListaHabitosDia
                  habitos={habitosDia}
                  completadosIds={dia?.completadosIds ?? []}
                  esHoy={fecha === hoy}
                  onCompletar={completar}
                  completandoId={completandoId}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={!!mensaje}
        autoHideDuration={3000}
        onClose={() => setMensaje(null)}
        message={mensaje}
      />
    </Box>
  );
}
