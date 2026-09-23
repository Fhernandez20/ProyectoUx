function desdeClave(clave: string): Date {
  const [y, m, d] = clave.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function etiquetaDiaSemana(clave: string): string {
  const f = desdeClave(clave);
  const dia = f.toLocaleDateString('es', { weekday: 'short' }).replace('.', '');
  return `${dia} ${f.getDate()}`;
}

export function etiquetaDiaMes(clave: string): string {
  const f = desdeClave(clave);
  return `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}`;
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function etiquetaRangoSemana(desde: string, hasta: string): string {
  const d = desdeClave(desde);
  const h = desdeClave(hasta);
  const mesD = MESES_CORTOS[d.getMonth()];
  const mesH = MESES_CORTOS[h.getMonth()];
  return mesD === mesH
    ? `${d.getDate()}–${h.getDate()} ${mesH}`
    : `${d.getDate()} ${mesD}–${h.getDate()} ${mesH}`;
}


function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function hoyLocal(): string {
  const f = new Date();
  return `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`;
}

export function aFechaApi(fecha: string): string {
  return `${fecha}T12:00:00.000Z`;
}


export function fechaLocal(iso: string): string {
  if (iso.endsWith('T12:00:00.000Z')) return iso.slice(0, 10);
  const f = new Date(iso);
  return `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`;
}

export function formatoFechaCorta(iso: string): string {
  const [y, m, d] = fechaLocal(iso).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}