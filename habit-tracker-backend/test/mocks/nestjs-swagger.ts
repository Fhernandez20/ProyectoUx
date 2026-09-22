/**
 * Sustituto de @nestjs/swagger SOLO para los tests unitarios.
 *
 * @nestjs/swagger v12 es un módulo ES y Jest (que ejecuta CommonJS) no puede cargarlo.
 * Los decoradores de Swagger solo generan documentación, no afectan a la validación,
 * así que en los tests se reemplazan por decoradores vacíos (ver jest.config.ts).
 */
const decoradorVacio = () => () => undefined;

export const ApiProperty = decoradorVacio;
export const ApiPropertyOptional = decoradorVacio;
