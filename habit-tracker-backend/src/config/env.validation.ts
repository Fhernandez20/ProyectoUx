/**
 * Valida las variables de entorno al arrancar. Si falta alguna obligatoria, el
 * backend se detiene con un mensaje claro en lugar de fallar más tarde con un
 * error difícil de entender.
 */
const OBLIGATORIAS = ['DATABASE_URL', 'JWT_SECRET'] as const;

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const errores: string[] = [];

  for (const nombre of OBLIGATORIAS) {
    const valor = config[nombre];
    if (typeof valor !== 'string' || valor.trim() === '') {
      errores.push(`Falta la variable ${nombre}`);
    }
  }

  const url = config.DATABASE_URL;
  if (
    typeof url === 'string' &&
    url.trim() !== '' &&
    !/^mongodb(\+srv)?:\/\//.test(url.trim())
  ) {
    errores.push('DATABASE_URL debe empezar con mongodb:// o mongodb+srv://');
  }

  const puerto = config.PORT;
  if (puerto !== undefined && puerto !== '') {
    const texto = String(puerto);
    if (!/^\d+$/.test(texto) || Number(texto) < 1 || Number(texto) > 65535) {
      errores.push('PORT debe ser un número entre 1 y 65535');
    }
  }

  if (errores.length > 0) {
    throw new Error(
      'Configuración inválida. Revisa tu archivo .env (hay un ejemplo en .env.example):\n' +
        errores.map((e) => `  - ${e}`).join('\n'),
    );
  }

  return config;
}
