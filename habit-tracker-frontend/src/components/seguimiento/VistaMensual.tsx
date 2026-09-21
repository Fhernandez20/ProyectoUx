'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  ButtonBase,
  Card,
  CardContent,
  CircularProgress,
  LinearProgress,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { hoyLocal } from '@/lib/fechas';
import { useSeguimiento } from '@/lib/useSeguimiento';
import type { DiaSeguimiento } from '@/lib/api';
import {
  capitalizar,
  fechaLarga,
  moverMes,
  ordenarHabitos,
  parseClave,
  rangoMes,
  semanasDelMes,
  tituloMes,
} from '@/lib/seguimiento';
import NavegadorPeriodo from './NavegadorPeriodo';
import ResumenPeriodo from './ResumenPeriodo';
import ListaHabitosDia from './ListaHabitosDia';

const ENCABEZADOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function LeyendaColor({ color, texto }: { color: string; texto: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <Box
        sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: color, border: 1, borderColor: 'divider' }}
        aria-hidden
      />
      <Typography variant="caption" color="text.secondary">
        {texto}
      </Typography>
    </Box>
  );
}

export default function VistaMensual() {
  const hoy = hoyLocal();
  const hoyFecha = parseClave(hoy);
  const theme = useTheme();

  const [mes, setMes] = useState({ anio: hoyFecha.getFullYear(), mes0: hoyFecha.getMonth() });
  const [seleccion, setSeleccion] = useState<string | null>(hoy);
  const { desde, hasta } = rangoMes(mes.anio, mes.mes0);
  const { datos, cargando, error } = useSeguimiento(desde, hasta);

  const esMesActual = mes.anio === hoyFecha.getFullYear() && mes.mes0 === hoyFecha.getMonth();
  const listo = datos && datos.desde === desde;
  const porFecha = new Map<string, DiaSeguimiento>(listo ? datos.dias.map((d) => [d.fecha, d]) : []);

  const verde = (pct: number) => alpha(theme.palette.success.main, 0.2 + 0.6 * (pct / 100));
  const rojo = alpha(theme.palette.error.main, 0.1);

  function colorDia(d: DiaSeguimiento | undefined, futuro: boolean): string {
    if (futuro || !d || d.aplicanIds.length === 0) return 'transparent';
    return d.completadosIds.length === 0 ? rojo : verde(d.porcentaje);
  }

  function cambiarMes(delta: number) {
    const nuevo = moverMes(mes.anio, mes.mes0, delta);
    setMes(nuevo);
    // Al volver al mes actual se vuelve a seleccionar hoy; en otros meses, ninguno
    setSeleccion(nuevo.anio === hoyFecha.getFullYear() && nuevo.mes0 === hoyFecha.getMonth() ? hoy : null);
  }

  const diaElegido = seleccion ? porFecha.get(seleccion) : undefined;
  const habitosElegido =
    listo && diaElegido
      ? ordenarHabitos(datos.habitos.filter((h) => diaElegido.aplicanIds.includes(h.id)))
      : [];

  return (
    <Box>
      <NavegadorPeriodo
        titulo={capitalizar(tituloMes(mes.anio, mes.mes0))}
        etiquetaActual="Este mes"
        esActual={esMesActual}
        etiquetaAnterior="Mes anterior"
        etiquetaSiguiente="Mes siguiente"
        siguienteDeshabilitado={esMesActual}
        onAnterior={() => cambiarMes(-1)}
        onSiguiente={() => cambiarMes(1)}
        onVolverAlActual={() => {
          setMes({ anio: hoyFecha.getFullYear(), mes0: hoyFecha.getMonth() });
          setSeleccion(hoy);
        }}
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
            titulo="Cumplimiento del mes"
            porcentaje={datos.resumen.porcentaje}
            datos={[
              { label: 'Hábitos completados', valor: datos.resumen.completados },
              { label: 'Días con actividad', valor: datos.resumen.diasConActividad },
            ]}
          />
          {cargando && <LinearProgress sx={{ mb: 1 }} />}

          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Box
                sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}
                aria-hidden
              >
                {ENCABEZADOS.map((e) => (
                  <Typography key={e} variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                    {e}
                  </Typography>
                ))}
              </Box>

              <Box
                role="group"
                aria-label={`Calendario de ${tituloMes(mes.anio, mes.mes0)}`}
                sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}
              >
                {semanasDelMes(mes.anio, mes.mes0)
                  .flat()
                  .map((f, i) => {
                    if (!f) return <Box key={`vacio-${i}`} />;
                    const d = porFecha.get(f);
                    const futuro = f > hoy;
                    const elegido = f === seleccion;
                    const hechos = d?.completadosIds.length ?? 0;
                    const total = d?.aplicanIds.length ?? 0;
                    return (
                      <ButtonBase
                        key={f}
                        disabled={futuro}
                        onClick={() => setSeleccion(f)}
                        aria-pressed={elegido}
                        aria-label={
                          total > 0
                            ? `${fechaLarga(f)}: ${hechos} de ${total} hábitos completados`
                            : `${fechaLarga(f)}: sin hábitos`
                        }
                        sx={{
                          minHeight: { xs: 44, sm: 60 },
                          borderRadius: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: colorDia(d, futuro),
                          border: 2,
                          borderColor: elegido
                            ? 'secondary.main'
                            : f === hoy
                              ? 'text.secondary'
                              : 'transparent',
                          opacity: futuro ? 0.4 : 1,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: f === hoy ? 700 : 400 }}>
                          {parseClave(f).getDate()}
                        </Typography>
                        {total > 0 && !futuro && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: { xs: 'none', sm: 'block' }, lineHeight: 1 }}
                          >
                            {hechos}/{total}
                          </Typography>
                        )}
                      </ButtonBase>
                    );
                  })}
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                <LeyendaColor color={rojo} texto="Ninguno completado" />
                <LeyendaColor color={verde(40)} texto="Parcial" />
                <LeyendaColor color={verde(100)} texto="Todo completado" />
              </Box>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              {!seleccion || !diaElegido ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  Toca un día del calendario para ver el detalle.
                </Typography>
              ) : (
                <>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                    {capitalizar(fechaLarga(seleccion))}
                  </Typography>
                  {habitosElegido.length === 0 ? (
                    <Typography color="text.secondary">No había hábitos programados este día.</Typography>
                  ) : (
                    <ListaHabitosDia
                      habitos={habitosElegido}
                      completadosIds={diaElegido.completadosIds}
                      esHoy={seleccion === hoy}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
