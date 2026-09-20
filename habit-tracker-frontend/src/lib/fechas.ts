// Convierte "2026-09-18" en una fecha local (sin desfase de zona horaria)
function desdeClave(clave: string): Date {
  const [y, m, d] = clave.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "lun 14" */
export function etiquetaDiaSemana(clave: string): string {
  const f = desdeClave(clave);
  const dia = f.toLocaleDateString('es', { weekday: 'short' }).replace('.', '');
  return `${dia} ${f.getDate()}`;
}

/** "14/09" */
export function etiquetaDiaMes(clave: string): string {
  const f = desdeClave(clave);
  return `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}`;
}

// ---------- Fechas de hábitos (inicio / fin) ----------
// Las fechas de los hábitos se guardan a mediodía UTC ("YYYY-MM-DDT12:00:00.000Z")
// para que caigan en el mismo día calendario en cualquier zona horaria.

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Hoy como "YYYY-MM-DD" en hora local (formato de <input type="date">). */
export function hoyLocal(): string {
  const f = new Date();
  return `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`;
}

/** "2026-09-20" (input) -> "2026-09-20T12:00:00.000Z" (API). */
export function aFechaApi(fecha: string): string {
  return `${fecha}T12:00:00.000Z`;
}

/**
 * Fecha de la API -> "YYYY-MM-DD" local.
 * Los hábitos antiguos guardaron el instante exacto de creación, por eso si no
 * es de mediodía UTC se convierte a la fecha local.
 */
export function fechaLocal(iso: string): string {
  if (iso.endsWith('T12:00:00.000Z')) return iso.slice(0, 10);
  const f = new Date(iso);
  return `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`;
}

/** "6 sept 2026" */
export function formatoFechaCorta(iso: string): string {
  const [y, m, d] = fechaLocal(iso).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}