export interface HabitoBase {
  id: string;
  nombre: string;
  activo: boolean;
  frecuencia: string;
  fechaInicio: Date;
  fechaFin: Date | null;
  prioridad?: number | null;
}

const MS_POR_DIA = 24 * 60 * 60 * 1000;

export function inicioDelDia(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

export function sumarDias(fecha: Date, dias: number): Date {
  return new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    fecha.getDate() + dias,
  );
}

export function claveDia(fecha: Date): string {
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mm}-${dd}`;
}

export function fechaDesdeClave(clave: string): Date {
  const [y, m, d] = clave.split('-').map(Number);
  return new Date(y, m - 1, d);
}

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
    if (
      anterior &&
      Math.round((fecha.getTime() - anterior.getTime()) / MS_POR_DIA) === 1
    ) {
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

export function calcularRachasSemanales(
  diasConActividad: Set<string>,
  inicio: Date,
  hoy: Date,
): { actual: number; mejor: number } {
  const base = inicioDelDia(inicio).getTime();
  const semanaDe = (fecha: Date) =>
    Math.floor(
      Math.round((inicioDelDia(fecha).getTime() - base) / MS_POR_DIA) / 7,
    );

  const semanas = new Set<number>();
  for (const clave of diasConActividad) {
    const fecha = fechaDesdeClave(clave);
    if (fecha.getTime() >= base) semanas.add(semanaDe(fecha));
  }

  let mejor = 0;
  let corrida = 0;
  let anterior: number | null = null;
  for (const semana of [...semanas].sort((a, b) => a - b)) {
    corrida = anterior !== null && semana === anterior + 1 ? corrida + 1 : 1;
    mejor = Math.max(mejor, corrida);
    anterior = semana;
  }

  let cursor = semanaDe(hoy);
  if (!semanas.has(cursor)) cursor--;
  let actual = 0;
  while (semanas.has(cursor)) {
    actual++;
    cursor--;
  }

  return { actual, mejor };
}

export type EstadoHabito = 'activo' | 'finalizado' | 'inactivo';

export function estadoHabito(habito: HabitoBase, hoy: Date): EstadoHabito {
  if (habito.fechaFin && inicioDelDia(habito.fechaFin) < inicioDelDia(hoy)) {
    return 'finalizado';
  }
  return habito.activo ? 'activo' : 'inactivo';
}

export function aplicaEnDia(habito: HabitoBase, dia: Date): boolean {
  if (!habito.activo) return false;
  const d = inicioDelDia(dia);
  if (d < inicioDelDia(habito.fechaInicio)) return false;
  if (habito.fechaFin && d > inicioDelDia(habito.fechaFin)) return false;
  return true;
}

export function pesoDiario(habito: HabitoBase): number {
  return habito.frecuencia === 'semanal' ? 1 / 7 : 1;
}

export function evaluarDia(
  habitos: HabitoBase[],
  idsCompletados: Set<string> | undefined,
  dia: Date,
): { completados: number; completadosPonderados: number; esperados: number } {
  let completados = 0;
  let completadosPonderados = 0;
  let esperados = 0;
  for (const h of habitos) {
    if (!aplicaEnDia(h, dia)) continue;
    esperados += pesoDiario(h);
    if (idsCompletados?.has(h.id)) {
      completados += 1;
      completadosPonderados += pesoDiario(h);
    }
  }
  return { completados, completadosPonderados, esperados };
}

export function porcentaje(completados: number, esperados: number): number {
  if (esperados <= 0) return 0;
  return Math.min(100, Math.round((completados / esperados) * 100));
}

export function redondear1(n: number): number {
  return Math.round(n * 10) / 10;
}