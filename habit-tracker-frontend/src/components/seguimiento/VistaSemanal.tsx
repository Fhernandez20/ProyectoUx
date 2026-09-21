'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UncheckedIcon from '@mui/icons-material/RadioButtonUncheckedOutlined';
import type { HabitoSeguimiento } from '@/lib/api';
import { hoyLocal } from '@/lib/fechas';
import { useSeguimiento } from '@/lib/useSeguimiento';
import {
  abreviaturaDia,
  diasDeSemana,
  ordenarHabitos,
  parseClave,
  rangoSemana,
  sumarDiasClave,
  tituloRango,
} from '@/lib/seguimiento';
import NavegadorPeriodo from './NavegadorPeriodo';
import ResumenPeriodo from './ResumenPeriodo';

// Columna del nombre fija a la izquierda al hacer scroll horizontal
const celdaNombre = {
  position: 'sticky',
  left: 0,
  bgcolor: 'background.paper',
  zIndex: 1,
  minWidth: 130,
} as const;

export default function VistaSemanal() {
  const hoy = hoyLocal();
  const theme = useTheme();
  const [ancla, setAncla] = useState(hoy);
  const { desde, hasta } = rangoSemana(ancla);
  const dias = diasDeSemana(ancla);
  const { datos, cargando, error } = useSeguimiento(desde, hasta);

  const listo = datos && datos.desde === desde;
  const porFecha = new Map(listo ? datos.dias.map((d) => [d.fecha, d]) : []);
  const habitos = listo ? ordenarHabitos(datos.habitos) : [];
  const activos = habitos.filter((h) => h.activo);
  // Inactivos: se muestran aparte y en gris; no cuentan en el cumplimiento
  const inactivos = habitos.filter((h) => !h.activo);

  const resaltarHoy = (f: string) =>
    f === hoy ? alpha(theme.palette.secondary.main, 0.08) : undefined;

  function celda(h: HabitoSeguimiento, f: string) {
    const d = porFecha.get(f);
    const completado = d?.completadosIds.includes(h.id) ?? false;
    const toca = d?.aplicanIds.includes(h.id) ?? false;
    const futuro = f > hoy;
    const inactivo = !h.activo;

    if (completado) {
      return (
        <CheckCircleIcon
          fontSize="small"
          color={inactivo ? 'inherit' : 'success'}
          sx={inactivo ? { color: 'text.disabled' } : undefined}
          titleAccess={inactivo ? 'Completado (hábito inactivo)' : 'Completado'}
        />
      );
    }
    // ○ solo en hábitos activos que tocaban ese día. Un hábito semanal se cumple
    // una vez por semana, así que no se marca como fallado cada día.
    if (!inactivo && toca && !futuro && h.frecuencia !== 'semanal') {
      return (
        <UncheckedIcon
          fontSize="small"
          sx={{ color: 'text.disabled' }}
          titleAccess={f === hoy ? 'Pendiente' : 'No completado'}
        />
      );
    }
    return (
      <Box component="span" role="img" aria-label={futuro ? 'Aún no llega' : 'Sin marcar'} sx={{ color: 'text.disabled' }}>
        ·
      </Box>
    );
  }

  /** Para hábitos semanales: se cumple con un solo día completado en la semana. */
  function estadoSemanal(h: HabitoSeguimiento): string {
    const cumplido = dias.some((f) => porFecha.get(f)?.completadosIds.includes(h.id));
    if (cumplido) return 'cumplido';
    return hasta < hoy ? 'no cumplido' : 'pendiente';
  }

  function fila(h: HabitoSeguimiento) {
    const inactivo = !h.activo;
    return (
      <TableRow key={h.id}>
        <TableCell sx={{ ...celdaNombre, fontWeight: 500, color: inactivo ? 'text.disabled' : undefined }}>
          {h.nombre}
          {inactivo && (
            <Chip label="Inactivo" size="small" variant="outlined" sx={{ ml: 1 }} />
          )}
          {!inactivo && h.frecuencia === 'semanal' && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 400 }}>
              Semanal · {estadoSemanal(h)}
            </Typography>
          )}
        </TableCell>
        {dias.map((f) => (
          <TableCell key={f} align="center" sx={{ bgcolor: resaltarHoy(f) }}>
            {celda(h, f)}
          </TableCell>
        ))}
      </TableRow>
    );
  }

  return (
    <Box>
      <NavegadorPeriodo
        titulo={tituloRango(desde, hasta)}
        etiquetaActual="Esta semana"
        esActual={desde <= hoy && hoy <= hasta}
        etiquetaAnterior="Semana anterior"
        etiquetaSiguiente="Semana siguiente"
        siguienteDeshabilitado={hasta >= hoy}
        onAnterior={() => setAncla(sumarDiasClave(desde, -7))}
        onSiguiente={() => setAncla(sumarDiasClave(desde, 7))}
        onVolverAlActual={() => setAncla(hoy)}
      />

      {error && <Alert severity="error">{error}</Alert>}

      {!error && !listo && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!error && listo && (
        <>
          <ResumenPeriodo
            titulo="Cumplimiento de la semana"
            porcentaje={datos.resumen.porcentaje}
            datos={[
              { label: 'Hábitos completados', valor: datos.resumen.completados },
              { label: 'Días con actividad', valor: `${datos.resumen.diasConActividad} de 7` },
            ]}
          />
          {cargando && <LinearProgress sx={{ mb: 1 }} />}

          <Card variant="outlined">
            <CardContent>
              {habitos.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No hay hábitos registrados en esta semana.
                </Typography>
              ) : (
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" aria-label="Seguimiento semanal por hábito">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={celdaNombre}>Hábito</TableCell>
                        {dias.map((f) => (
                          <TableCell
                            key={f}
                            align="center"
                            sx={{
                              bgcolor: resaltarHoy(f),
                              fontWeight: f === hoy ? 600 : 400,
                              lineHeight: 1.2,
                            }}
                          >
                            <Box component="span" sx={{ display: 'block', textTransform: 'capitalize' }}>
                              {abreviaturaDia(f)}
                            </Box>
                            {parseClave(f).getDate()}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activos.map(fila)}

                      <TableRow>
                        <TableCell sx={{ ...celdaNombre, fontWeight: 600 }}>Completados</TableCell>
                        {dias.map((f) => (
                          <TableCell key={f} align="center" sx={{ fontWeight: 600 }}>
                            {f > hoy ? '' : (porFecha.get(f)?.completados ?? 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {inactivos.length > 0 && (
                        <>
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              sx={{
                                bgcolor: alpha(theme.palette.text.primary, 0.04),
                                color: 'text.secondary',
                              }}
                            >
                              Inactivos · no cuentan en el cumplimiento
                            </TableCell>
                          </TableRow>
                          {inactivos.map(fila)}
                        </>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}