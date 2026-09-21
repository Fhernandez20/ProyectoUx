'use client';

import { useEffect, useState } from 'react';
import { statsApi, Seguimiento, ApiError } from './api';

/** Carga el seguimiento de un rango de fechas y evita respuestas desactualizadas. */
export function useSeguimiento(desde: string, hasta: string, version = 0) {
  const [datos, setDatos] = useState<Seguimiento | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);

    statsApi
      .seguimiento(desde, hasta)
      .then((d) => {
        if (cancelado) return;
        setDatos(d);
        setCargando(false);
      })
      .catch((err) => {
        if (cancelado) return;
        setError(
          err instanceof ApiError ? err.message : 'No se pudo cargar el seguimiento',
        );
        setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [desde, hasta, version]);

  return { datos, cargando, error };
}
