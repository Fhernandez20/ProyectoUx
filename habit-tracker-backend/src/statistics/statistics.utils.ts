/**
 * Funciones puras para calcular estadísticas de hábitos.
 * No dependen de Prisma ni de Nest, así se pueden probar fácilmente.
 *
 * Todas las fechas se manejan por DÍA CALENDARIO en la hora local del servidor
 * (misma convención que usa HabitsService.completar()).
 */

export interface HabitoBase {
  id: string;
  nombre: string;
  activo: boolean;
  frecuencia: string; // 'diario' | 'semanal' | 'personalizada'
  fechaInicio: Date;
  fechaFin: Date | null;
  prioridad?: number | null;
}

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** Fecha a las 00:00 (hora local) del mismo día. */
export function inicioDelDia(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

/** Suma (o resta, con negativos) días calendario. */
export function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias);
}

/** "2026-09-18" en hora local. Se usa como llave para agrupar registros por día. */
export function claveDia(fecha: Date): string {
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mm}-${dd}`;
}

export function fechaDesdeClave(clave: string): Date {
  const [y, m, d] = clave.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Calcula la racha actual y la mejor racha a partir de los días en que hubo
 * al menos un hábito completado.
 *
 * - Mejor racha: la secuencia más larga de días consecutivos.
 * - Racha actual: días consecutivos terminando hoy. Si hoy todavía no hay
 *   actividad, se cuenta desde ayer (la racha no se rompe hasta que termina el día).
 */
export function calcularRachas(
  diasConActividad: Set<string>,
  hoy: Date,
): { actual: number; mejor: number } {
  const ordenados = [...diasConActividad].sort();

  let mejor = 0;
  let corrida = 0;
  let anterior: Date | null = null;

  for (const clave of ordenados) {
    const fecha = fechaDesdeClave(clave);
    if (anterior && Math.round((fecha.getTime() - anterior.getTime()) / MS_POR_DIA) === 1) {
      corrida++;
    } else {
      corrida = 1;
    }
    mejor = Math.max(mejor, corrida);
    anterior = fecha;
  }

  let cursor = inicioDelDia(hoy);
  if (!diasConActividad.has(claveDia(cursor))) {
    cursor = sumarDias(cursor, -1);
  }
  let actual = 0;
  while (diasConActividad.has(claveDia(cursor))) {
    actual++;
    cursor = sumarDias(cursor, -1);
  }

  return { actual, mejor };
}

/** ¿Se espera que este hábito se cumpla en ese día? */
export function aplicaEnDia(habito: HabitoBase, dia: Date): boolean {
  if (!habito.activo) return false;
  const d = inicioDelDia(dia);
  if (d < inicioDelDia(habito.fechaInicio)) return false;
  if (habito.fechaFin && d > inicioDelDia(habito.fechaFin)) return false;
  return true;
}

/**
 * Peso de un hábito dentro de un día:
 * - diario / personalizada: 1 por día.
 * - semanal: 1/7 por día (equivale a 1 vez por semana).
 */
export function pesoDiario(habito: HabitoBase): number {
  return habito.frecuencia === 'semanal' ? 1 / 7 : 1;
}

/**
 * Cuántos hábitos se esperaban y cuántos se completaron en un día.
 * Solo cuentan los completados que efectivamente aplicaban ese día.
 */
export function evaluarDia(
  habitos: HabitoBase[],
  idsCompletados: Set<string> | undefined,
  dia: Date,
): { completados: number; esperados: number } {
  let completados = 0;
  let esperados = 0;
  for (const h of habitos) {
    if (!aplicaEnDia(h, dia)) continue;
    esperados += pesoDiario(h);
    if (idsCompletados?.has(h.id)) completados += 1;
  }
  return { completados, esperados };
}

/** Porcentaje entero 0-100. Si no se esperaba nada, devuelve 0. */
export function porcentaje(completados: number, esperados: number): number {
  if (esperados <= 0) return 0;
  return Math.min(100, Math.round((completados / esperados) * 100));
}

export function redondear1(n: number): number {
  return Math.round(n * 10) / 10;
}