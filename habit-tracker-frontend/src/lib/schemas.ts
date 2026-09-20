import { z } from 'zod';


z.config(z.locales.es());

export const loginSchema = z.object({
  correo: z
    .string()
    .min(1, 'El correo es obligatorio')
    .email('Ingresa un correo válido'),
  contrasena: z.string().min(1, 'La contraseña es obligatoria'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre es demasiado largo'),
  correo: z
    .string()
    .min(1, 'El correo es obligatorio')
    .email('Ingresa un correo válido'),
  contrasena: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const perfilSchema = z.object({
  nombre: registerSchema.shape.nombre,
});

const fechaInput = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ingresa una fecha válida');

export const habitoSchema = z
  .object({
    nombre: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre es demasiado largo'),
    descripcion: z.string().max(500, 'La descripción es demasiado larga').optional(),
    categoria: z.string().max(50, 'La categoría es demasiado larga').optional(),
    frecuencia: z.enum(['diario', 'semanal', 'personalizada'], {
      message: 'Selecciona una frecuencia válida',
    }),
    prioridad: z
      .number()
      .int('La prioridad debe ser un número entero')
      .min(1, 'La prioridad mínima es 1')
      .max(10, 'La prioridad máxima es 10')
      .optional(),
    fechaInicio: fechaInput.optional(),
    fechaFin: fechaInput.optional(),
  })
  .refine((d) => !d.fechaInicio || !d.fechaFin || d.fechaFin >= d.fechaInicio, {
    message: 'La fecha de fin no puede ser anterior a la fecha de inicio',
    path: ['fechaFin'],
  });

export type HabitoFormData = z.infer<typeof habitoSchema>;

export function primerError(
  schema: z.ZodTypeAny,
  data: unknown,
): string | null {
  const resultado = schema.safeParse(data);
  if (resultado.success) return null;
  return resultado.error.issues[0]?.message ?? 'Datos inválidos';
}