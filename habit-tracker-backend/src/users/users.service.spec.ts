// Se simulan @nestjs/common (evita problemas de módulos ES según la versión de
// Node) y PrismaService (evita cargar el cliente real de Prisma).
jest.mock('@nestjs/common', () => ({
  Injectable: () => () => undefined,
  NotFoundException: class NotFoundException extends Error {},
}));
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

const usuarioDb = {
  id: 'u1',
  nombre: 'Fernando',
  correo: 'f@test.com',
  fechaRegistro: new Date('2026-09-01'),
};

function crearServicio(findUnique: jest.Mock, update: jest.Mock = jest.fn()) {
  const prisma = { usuario: { findUnique, update } };
  return { servicio: new UsersService(prisma as never), prisma };
}

describe('UsersService', () => {
  it('findMe devuelve el usuario sin contraseña', async () => {
    const { servicio, prisma } = crearServicio(jest.fn().mockResolvedValue(usuarioDb));
    const r = await servicio.findMe('u1');
    expect(r).toEqual(usuarioDb);
    const args = prisma.usuario.findUnique.mock.calls[0][0];
    expect(args.select.contrasena).toBeUndefined();
  });

  it('findMe lanza NotFound si el usuario no existe', async () => {
    const { servicio } = crearServicio(jest.fn().mockResolvedValue(null));
    await expect(servicio.findMe('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updateMe solo actualiza el nombre', async () => {
    const update = jest.fn().mockResolvedValue({ ...usuarioDb, nombre: 'Nuevo' });
    const { servicio } = crearServicio(jest.fn().mockResolvedValue(usuarioDb), update);
    const r = await servicio.updateMe('u1', { nombre: 'Nuevo' });
    expect(r.nombre).toBe('Nuevo');
    expect(update.mock.calls[0][0].data).toEqual({ nombre: 'Nuevo' });
  });
});
