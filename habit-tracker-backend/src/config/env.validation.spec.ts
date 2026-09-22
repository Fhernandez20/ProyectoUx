import { validateEnv } from './env.validation';

const valido = {
  DATABASE_URL: 'mongodb://admin:123456@localhost:27017/nestdb?authSource=admin',
  JWT_SECRET: 'un-secreto-largo',
};

describe('validateEnv', () => {
  it('acepta la configuración mínima válida y devuelve el mismo objeto', () => {
    expect(validateEnv(valido)).toBe(valido);
  });

  it('acepta mongodb+srv y un PORT válido', () => {
    expect(() =>
      validateEnv({ ...valido, DATABASE_URL: 'mongodb+srv://u:p@cluster.mongodb.net/db', PORT: '4000' }),
    ).not.toThrow();
  });

  it('PORT es opcional (undefined o vacío)', () => {
    expect(() => validateEnv({ ...valido, PORT: undefined })).not.toThrow();
    expect(() => validateEnv({ ...valido, PORT: '' })).not.toThrow();
  });

  it.each([
    ['DATABASE_URL', { JWT_SECRET: 'x' }],
    ['JWT_SECRET', { DATABASE_URL: valido.DATABASE_URL }],
  ])('rechaza si falta %s y lo nombra en el mensaje', (nombre, config) => {
    expect(() => validateEnv(config)).toThrow(new RegExp(`Falta la variable ${nombre}`));
  });

  it('rechaza variables vacías o solo espacios', () => {
    expect(() => validateEnv({ ...valido, JWT_SECRET: '   ' })).toThrow(/JWT_SECRET/);
    expect(() => validateEnv({ ...valido, DATABASE_URL: '' })).toThrow(/DATABASE_URL/);
  });

  it('rechaza una DATABASE_URL que no sea de MongoDB', () => {
    expect(() => validateEnv({ ...valido, DATABASE_URL: 'postgres://localhost/db' })).toThrow(
      /mongodb:\/\//,
    );
  });

  it.each(['abc', '0', '70000', '-1', '3000.5'])('rechaza PORT=%p', (puerto) => {
    expect(() => validateEnv({ ...valido, PORT: puerto })).toThrow(/PORT/);
  });

  it('reporta todos los problemas juntos', () => {
    expect(() => validateEnv({ PORT: 'abc' })).toThrow(/DATABASE_URL[\s\S]*JWT_SECRET[\s\S]*PORT/);
  });

  it('explica dónde está el ejemplo de configuración', () => {
    expect(() => validateEnv({})).toThrow(/\.env\.example/);
  });
});
