import type { Habito } from './api';
import { fechaLocal, hoyLocal } from './fechas';
import { nivelPrioridad } from './prioridad';

export type EstadoFiltro = 'todos' | 'activos' | 'inactivos' | 'finalizados';
export type OrdenHabitos = 'prioridad' | 'nombre' | 'inicio';

export interface Filtros {
  busqueda: string;
  estado: EstadoFiltro;
  categoria: string;
  orden: OrdenHabitos;
}

export const FILTROS_INICIALES: Filtros = {
  busqueda: '',
  estado: 'activos',
  categoria: 'todas',
  orden: 'inicio',
};

export function estaFinalizado(h: Habito, hoy: string = hoyLocal()): boolean {
  return !!h.fechaFin && fechaLocal(h.fechaFin) < hoy;
}

export function aunNoInicia(h: Habito, hoy: string = hoyLocal()): boolean {
  return fechaLocal(h.fechaInicio) > hoy;
}

export function esVigenteHoy(h: Habito, hoy: string = hoyLocal()): boolean {
  return h.activo && !estaFinalizado(h, hoy) && !aunNoInicia(h, hoy);
}

const normalizar = (t: string) => t.trim().toLowerCase();

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
    f.busqueda.trim() !== '' ||
    f.estado !== FILTROS_INICIALES.estado ||
    f.categoria !== FILTROS_INICIALES.categoria ||
    f.orden !== FILTROS_INICIALES.orden
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
      return (
        fechaLocal(b.fechaInicio).localeCompare(fechaLocal(a.fechaInicio)) ||
        a.nombre.localeCompare(b.nombre, 'es')
      );
    }
    return (
      nivelPrioridad(a.prioridad) - nivelPrioridad(b.prioridad) ||
      a.nombre.localeCompare(b.nombre, 'es')
    );
  });
}