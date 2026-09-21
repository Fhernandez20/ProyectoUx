/**
 * Funciones de fechas para las vistas de Seguimiento (diaria, semanal y mensual).
 * Todas trabajan con claves "YYYY-MM-DD" en hora local. Las semanas van de lunes a domingo.
 */

import { nivelPrioridad } from './prioridad';
import type { DiaSeguimiento, HabitoSeguimiento } from './api';

const pad = (n: number) => String(n).padStart(2, '0');

export function parseClave(clave: string): Date {
  const [y, m, d] = clave.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function aClave(fecha: Date): string {
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
}

export function sumarDiasClave(clave: string, dias: number): string {
  const f = parseClave(clave);
  return aClave(new Date(f.getFullYear(), f.getMonth(), f.getDate() + dias));
}

/** Lunes de la semana que contiene la fecha. */
export function lunesDeSemana(clave: string): string {
  const diaSemana = parseClave(clave).getDay(); // 0 = domingo
  const desdeLunes = (diaSemana + 6) % 7; // lunes = 0 ... domingo = 6
  return sumarDiasClave(clave, -desdeLunes);
}

/** Lunes y domingo de la semana que contiene la fecha. */
export function rangoSemana(clave: string): { desde: string; hasta: string } {
  const desde = lunesDeSemana(clave);
  return { desde, hasta: sumarDiasClave(desde, 6) };
}

/** Los 7 días (lunes a domingo) de la semana que contiene la fecha. */
export function diasDeSemana(clave: string): string[] {
  const { desde } = rangoSemana(clave);
  return Array.from({ length: 7 }, (_, i) => sumarDiasClave(desde, i));
}

/** Primer y último día de un mes (mes0: 0 = enero ... 11 = diciembre). */
export function rangoMes(anio: number, mes0: number): { desde: string; hasta: string } {
  return {
    desde: aClave(new Date(anio, mes0, 1)),
    hasta: aClave(new Date(anio, mes0 + 1, 0)),
  };
}

/**
 * Cuadrícula del calendario de un mes: filas de 7 celdas (lunes a domingo).
 * Las celdas fuera del mes son null.
 */
export function semanasDelMes(anio: number, mes0: number): (string | null)[][] {
  const { desde, hasta } = rangoMes(anio, mes0);
  const diasEnMes = parseClave(hasta).getDate();
  const huecosInicio = (parseClave(desde).getDay() + 6) % 7;

  const celdas: (string | null)[] = [
    ...Array(huecosInicio).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => aClave(new Date(anio, mes0, i + 1))),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);

  const filas: (string | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) filas.push(celdas.slice(i, i + 7));
  return filas;
}

/** Mes anterior/siguiente sin salirse de rango (mes0 puede pasar de 11 o bajar de 0). */
export function moverMes(anio: number, mes0: number, delta: number): { anio: number; mes0: number } {
  const f = new Date(anio, mes0 + delta, 1);
  return { anio: f.getFullYear(), mes0: f.getMonth() };
}

/** "septiembre de 2026" */
export function tituloMes(anio: number, mes0: number): string {
  return new Date(anio, mes0, 1).toLocaleDateString('es', { month: 'long', year: 'numeric' });
}

/** "viernes, 18 de septiembre de 2026" */
export function fechaLarga(clave: string): string {
  return parseClave(clave).toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** "14 sept – 20 sept 2026" (o con años distintos si cruza de año). */
export function tituloRango(desde: string, hasta: string): string {
  const a = parseClave(desde);
  const b = parseClave(hasta);
  const corto = (f: Date) => f.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  const anio = b.getFullYear();
  return a.getFullYear() === anio
    ? `${corto(a)} – ${corto(b)} ${anio}`
    : `${corto(a)} ${a.getFullYear()} – ${corto(b)} ${anio}`;
}

/** Abreviatura del día de la semana: "lun", "mar"... */
export function abreviaturaDia(clave: string): string {
  return parseClave(clave).toLocaleDateString('es', { weekday: 'short' }).replace('.', '');
}

export function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Ordena por prioridad (alta primero) y, a igual nivel, por nombre. */
export function ordenarHabitos<T extends { prioridad: number | null; nombre: string }>(
  lista: T[],
): T[] {
  return [...lista].sort(
    (a, b) =>
      nivelPrioridad(a.prioridad) - nivelPrioridad(b.prioridad) ||
      a.nombre.localeCompare(b.nombre, 'es'),
  );
}

/**
 * Hábitos inactivos que se completaron ese día. Se muestran aparte (en gris):
 * conservan su historial, pero no cuentan en el cumplimiento.
 */
export function inactivosCompletados(
  habitos: HabitoSeguimiento[],
  dia?: DiaSeguimiento,
): HabitoSeguimiento[] {
  if (!dia) return [];
  return habitos.filter((h) => !h.activo && dia.completadosIds.includes(h.id));
}

export type EstadoDia = 'sin-habitos' | 'ninguno' | 'parcial' | 'completo';

/** Estado de un día según cuántos de los hábitos que tocaban se completaron. */
export function estadoDia(hechos: number, total: number): EstadoDia {
  if (total <= 0) return 'sin-habitos';
  if (hechos <= 0) return 'ninguno';
  return hechos >= total ? 'completo' : 'parcial';
}

/** Intensidad (20 a 70) del verde de un día parcial, según el avance. */
export function intensidadParcial(hechos: number, total: number): number {
  return 20 + 50 * (hechos / total);
}