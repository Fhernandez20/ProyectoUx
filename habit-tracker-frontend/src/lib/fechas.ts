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