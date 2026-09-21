/**
 * La prioridad se guarda como número (1, 2 o 3) para poder ordenar en la base de
 * datos, pero al usuario siempre se le muestra como nivel: Alta, Media o Baja.
 * Menor número = más importante (aparece primero al ordenar).
 */
export type NivelPrioridad = 1 | 2 | 3;

export const PRIORIDADES: {
  valor: NivelPrioridad;
  label: string;
  color: 'error' | 'warning' | 'default';
}[] = [
  { valor: 1, label: 'Alta', color: 'error' },
  { valor: 2, label: 'Media', color: 'warning' },
  { valor: 3, label: 'Baja', color: 'default' },
];

/**
 * Convierte cualquier valor guardado en un nivel válido.
 * Los hábitos creados antes de este cambio pudieron guardar otros números
 * (1 a 10): 1 = Alta, 2 = Media, 3 o más = Baja. Sin dato = Media.
 */
export function nivelPrioridad(valor?: number | null): NivelPrioridad {
  if (valor == null) return 2;
  if (valor <= 1) return 1;
  if (valor === 2) return 2;
  return 3;
}

export function infoPrioridad(valor?: number | null) {
  const nivel = nivelPrioridad(valor);
  return PRIORIDADES.find((p) => p.valor === nivel)!;
}
