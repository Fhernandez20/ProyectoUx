jest.mock('@nestjs/common', () => ({
  Injectable: () => () => undefined,
  BadRequestException: class BadRequestException extends Error {},
  ConflictException: class ConflictException extends Error {},
  ForbiddenException: class ForbiddenException extends Error {},
  NotFoundException: class NotFoundException extends Error {},
}));
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { HabitsService } from './habits.service';

const dia = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
};

function habitoDb(parcial: Record<string, unknown> = {}) {
  return {
    id: 'h1',
    usuarioId: 'u1',
    nombre: 'Leer',
    frecuencia: 'diario',
    activo: true,
    fechaInicio: dia(-5),
    fechaFin: null,
    ...parcial,
  };
}

function crearServicio(
  habito: ReturnType<typeof habitoDb> | null = habitoDb(),
) {
  const prisma = {
    habito: {
      findUnique: jest.fn().mockResolvedValue(habito),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
    registro: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'r1' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  return { servicio: new HabitsService(prisma as never), prisma };
}

describe('HabitsService - fechas', () => {
  it('create rechaza fecha de fin anterior a la de inicio', () => {
    const { servicio } = crearServicio();
    expect(() =>
      servicio.create('u1', {
        nombre: 'Leer',
        frecuencia: 'diario',
        fechaInicio: '2026-09-20T12:00:00.000Z',
        fechaFin: '2026-09-10T12:00:00.000Z',
      }),
    ).toThrow(BadRequestException);
  });

  it('create acepta fin igual al inicio (hábito de un solo día)', async () => {
    const { servicio, prisma } = crearServicio();
    await servicio.create('u1', {
      nombre: 'Leer',
      frecuencia: 'diario',
      fechaInicio: '2026-09-20T12:00:00.000Z',
      fechaFin: '2026-09-20T12:00:00.000Z',
    });
    expect(prisma.habito.create).toHaveBeenCalled();
  });

  it('update con fechaFin null la quita (guarda null)', async () => {
    const { servicio, prisma } = crearServicio(habitoDb({ fechaFin: dia(10) }));
    await servicio.update('u1', 'h1', { fechaFin: null });
    expect(prisma.habito.update.mock.calls[0][0].data.fechaFin).toBeNull();
  });

  it('update sin fechaFin no la modifica (undefined)', async () => {
    const { servicio, prisma } = crearServicio();
    await servicio.update('u1', 'h1', { nombre: 'Nuevo' });
    expect(prisma.habito.update.mock.calls[0][0].data.fechaFin).toBeUndefined();
  });

  it('update rechaza un fin anterior al inicio ya guardado', async () => {
    const { servicio } = crearServicio(habitoDb({ fechaInicio: dia(-1) }));
    await expect(
      servicio.update('u1', 'h1', { fechaFin: dia(-20).toISOString() }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('HabitsService - completar', () => {
  it('completa un hábito vigente', async () => {
    const { servicio, prisma } = crearServicio();
    await servicio.completar('u1', 'h1');
    expect(prisma.registro.create).toHaveBeenCalled();
  });

  it('rechaza un hábito inactivo', async () => {
    const { servicio, prisma } = crearServicio(habitoDb({ activo: false }));
    await expect(servicio.completar('u1', 'h1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.registro.create).not.toHaveBeenCalled();
  });

  it('rechaza un hábito que ya finalizó', async () => {
    const { servicio } = crearServicio(habitoDb({ fechaFin: dia(-2) }));
    await expect(servicio.completar('u1', 'h1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rechaza un hábito que aún no inicia', async () => {
    const { servicio } = crearServicio(habitoDb({ fechaInicio: dia(3) }));
    await expect(servicio.completar('u1', 'h1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rechaza completar dos veces el mismo día', async () => {
    const { servicio, prisma } = crearServicio();
    prisma.registro.findFirst.mockResolvedValue({ id: 'ya' });
    await expect(servicio.completar('u1', 'h1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

describe('HabitsService - descompletar', () => {
  it('borra solo el completado de hoy de ese hábito', async () => {
    const { servicio, prisma } = crearServicio();
    await expect(servicio.descompletar('u1', 'h1')).resolves.toEqual({
      habitoId: 'h1',
      completadoHoy: false,
    });
    const where = prisma.registro.deleteMany.mock.calls[0][0].where;
    expect(where).toMatchObject({
      habitoId: 'h1',
      usuarioId: 'u1',
      completado: true,
    });
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    expect(where.fecha.gte).toEqual(inicio);
    expect(
      where.fecha.lt.getTime() - where.fecha.gte.getTime(),
    ).toBeGreaterThanOrEqual(23 * 3600e3);
  });

  it('responde NotFound si hoy no estaba completado', async () => {
    const { servicio, prisma } = crearServicio();
    prisma.registro.deleteMany.mockResolvedValue({ count: 0 });
    await expect(servicio.descompletar('u1', 'h1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('también se puede desmarcar un hábito inactivo o finalizado', async () => {
    const { servicio } = crearServicio(
      habitoDb({ activo: false, fechaFin: dia(-1) }),
    );
    await expect(servicio.descompletar('u1', 'h1')).resolves.toMatchObject({
      completadoHoy: false,
    });
  });
});