'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
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
                        <TableCell
                          sx={{ position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 }}
                        >
                          Hábito
                        </TableCell>
                        {dias.map((f) => (
                          <TableCell
                            key={f}
                            align="center"
                            sx={{
                              bgcolor: f === hoy ? alpha(theme.palette.secondary.main, 0.08) : undefined,
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
                      {habitos.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell
                            sx={{
                              position: 'sticky',
                              left: 0,
                              bgcolor: 'background.paper',
                              zIndex: 1,
                              fontWeight: 500,
                              minWidth: 120,
                            }}
                          >
                            {h.nombre}
                          </TableCell>
                          {dias.map((f) => {
                            const d = porFecha.get(f);
                            const completado = d?.completadosIds.includes(h.id) ?? false;
                            const toca = d?.aplicanIds.includes(h.id) ?? false;
                            const futuro = f > hoy;
                            return (
                              <TableCell
                                key={f}
                                align="center"
                                sx={{
                                  bgcolor: f === hoy ? alpha(theme.palette.secondary.main, 0.08) : undefined,
                                }}
                              >
                                {completado ? (
                                  <CheckCircleIcon
                                    color="success"
                                    fontSize="small"
                                    aria-label="Completado"
                                  />
                                ) : toca && !futuro ? (
                                  <UncheckedIcon
                                    fontSize="small"
                                    sx={{ color: 'text.disabled' }}
                                    aria-label={f === hoy ? 'Pendiente' : 'No completado'}
                                  />
                                ) : (
                                  <Box
                                    component="span"
                                    sx={{ color: 'text.disabled' }}
                                    aria-label={futuro ? 'Aún no llega' : 'No aplica'}
                                  >
                                    ·
                                  </Box>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell
                          sx={{
                            position: 'sticky',
                            left: 0,
                            bgcolor: 'background.paper',
                            zIndex: 1,
                            fontWeight: 600,
                          }}
                        >
                          Completados
                        </TableCell>
                        {dias.map((f) => (
                          <TableCell key={f} align="center" sx={{ fontWeight: 600 }}>
                            {f > hoy ? '' : (porFecha.get(f)?.completados ?? 0)}
                          </TableCell>
                        ))}
                      </TableRow>
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
