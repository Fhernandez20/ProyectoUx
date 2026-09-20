import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateUserDto } from './update-user.dto';

async function errores(datos: unknown) {
  const dto = plainToInstance(UpdateUserDto, datos);
  return { dto, errs: await validate(dto) };
}

describe('UpdateUserDto', () => {
  it('acepta un nombre válido y le quita espacios sobrantes', async () => {
    const { dto, errs } = await errores({ nombre: '  Fernando  ' });
    expect(errs).toHaveLength(0);
    expect(dto.nombre).toBe('Fernando');
  });

  it('rechaza nombre muy corto (o solo espacios)', async () => {
    expect((await errores({ nombre: 'A' })).errs).not.toHaveLength(0);
    expect((await errores({ nombre: '   ' })).errs).not.toHaveLength(0);
  });

  it('rechaza nombre demasiado largo', async () => {
    expect((await errores({ nombre: 'x'.repeat(81) })).errs).not.toHaveLength(0);
  });

  it('rechaza si falta el nombre', async () => {
    expect((await errores({})).errs).not.toHaveLength(0);
  });
});
