import type { Habito } from './api';
import { fechaLocal, hoyLocal } from './fechas';

export type EstadoFiltro = 'todos' | 'activos' | 'inactivos' | 'finalizados';
export type OrdenHabitos = 'prioridad' | 'nombre' | 'inicio';

export interface Filtros {
  busqueda: string;
  estado: EstadoFiltro;
  categoria: string; // 'todas' o el nombre de la categoría
  orden: OrdenHabitos;
}

export const FILTROS_INICIALES: Filtros = {
  busqueda: '',
  estado: 'todos',
  categoria: 'todas',
  orden: 'prioridad',
};

/** Un hábito está finalizado si su fecha de fin ya pasó. */
export function estaFinalizado(h: Habito, hoy: string = hoyLocal()): boolean {
  return !!h.fechaFin && fechaLocal(h.fechaFin) < hoy;
}

/** Un hábito "aún no inicia" si su fecha de inicio es futura. */
export function aunNoInicia(h: Habito, hoy: string = hoyLocal()): boolean {
  return fechaLocal(h.fechaInicio) > hoy;
}

/** ¿Se puede marcar como completado hoy? */
export function esVigenteHoy(h: Habito, hoy: string = hoyLocal()): boolean {
  return h.activo && !estaFinalizado(h, hoy) && !aunNoInicia(h, hoy);
}

const normalizar = (t: string) => t.trim().toLowerCase();

/** Categorías distintas (sin distinguir mayúsculas), ordenadas alfabéticamente. */
export function categoriasDisponibles(habitos: Habito[]): string[] {
  const vistas = new Map<string, string>();
  for (const h of habitos) {
    const c = h.categoria?.trim();
    if (c && !vistas.has(normalizar(c))) vistas.set(normalizar(c), c);
  }
  return [...vistas.values()].sort((a, b) => a.localeCompare(b, 'es'));
}

export function hayFiltrosActivos(f: Filtros): boolean {
  return (
    f.busqueda.trim() !== '' || f.estado !== 'todos' || f.categoria !== 'todas'
  );
}

export function aplicarFiltros(
  habitos: Habito[],
  f: Filtros,
  hoy: string = hoyLocal(),
): Habito[] {
  const texto = normalizar(f.busqueda);

  const filtrados = habitos.filter((h) => {
    if (texto) {
      const enNombre = normalizar(h.nombre).includes(texto);
      const enDescripcion = normalizar(h.descripcion ?? '').includes(texto);
      if (!enNombre && !enDescripcion) return false;
    }

    if (f.categoria !== 'todas') {
      if (normalizar(h.categoria ?? '') !== normalizar(f.categoria)) return false;
    }

    const finalizado = estaFinalizado(h, hoy);
    if (f.estado === 'activos' && !(h.activo && !finalizado)) return false;
    if (f.estado === 'inactivos' && h.activo) return false;
    if (f.estado === 'finalizados' && !finalizado) return false;

    return true;
  });

  return [...filtrados].sort((a, b) => {
    if (f.orden === 'nombre') return a.nombre.localeCompare(b.nombre, 'es');
    if (f.orden === 'inicio') {
      return fechaLocal(b.fechaInicio).localeCompare(fechaLocal(a.fechaInicio));
    }
    // prioridad: número menor = más importante; sin prioridad al final
    const pa = a.prioridad ?? Number.MAX_SAFE_INTEGER;
    const pb = b.prioridad ?? Number.MAX_SAFE_INTEGER;
    return pa - pb || a.nombre.localeCompare(b.nombre, 'es');
  });
}
