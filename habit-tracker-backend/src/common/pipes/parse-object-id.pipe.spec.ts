// Se simula @nestjs/common (evita problemas de módulos ES según la versión de Node)
jest.mock('@nestjs/common', () => ({
  Injectable: () => () => undefined,
  BadRequestException: class BadRequestException extends Error {},
}));

import { BadRequestException } from '@nestjs/common';
import { ParseObjectIdPipe } from './parse-object-id.pipe';

describe('ParseObjectIdPipe', () => {
  const pipe = new ParseObjectIdPipe();

  it.each(['6aaf536cb49a8a4eca44713e', '507F1F77BCF86CD799439011', '000000000000000000000000'])(
    'acepta el ObjectId válido %p',
    (id) => {
      expect(pipe.transform(id)).toBe(id);
    },
  );

  it.each([
    ['vacío', ''],
    ['texto cualquiera', 'abc'],
    ['24 caracteres pero no hexadecimales', 'zzzzzzzzzzzzzzzzzzzzzzzz'],
    ['23 caracteres', '6aaf536cb49a8a4eca44713'],
    ['25 caracteres', '6aaf536cb49a8a4eca44713ef'],
    ['varios ids separados por espacios', '6aaf536cb49a8a4eca44713e 6aaf536cb49a8a4eca44713f'],
    ['con espacios alrededor', ' 6aaf536cb49a8a4eca44713e '],
    ['con un salto de línea final', '6aaf536cb49a8a4eca44713e\n'],
  ])('rechaza %s', (_descripcion, id) => {
    expect(() => pipe.transform(id)).toThrow(BadRequestException);
  });

  it('rechaza valores que no son texto', () => {
    expect(() => pipe.transform(undefined as unknown as string)).toThrow(BadRequestException);
    expect(() => pipe.transform(123 as unknown as string)).toThrow(BadRequestException);
  });
});
