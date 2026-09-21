// Se simulan @nestjs/common (evita problemas de módulos ES según la versión de
// Node) y PrismaService (evita cargar el cliente real de Prisma).
jest.mock('@nestjs/common', () => ({
  Injectable: () => () => undefined,
  BadRequestException: class BadRequestException extends Error {},
}));
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

import { BadRequestException } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

const fecha = (dia: number, hora = 10) => new Date(2026, 8, dia, hora, 0); // septiembre 2026

function habito(parcial: Record<string, unknown> = {}) {
  return {
    id: 'A',
    nombre: 'Leer',
    frecuencia: 'diario',
    activo: true,
    prioridad: 2,
    fechaInicio: new Date(2026, 8, 1),
    fechaFin: null,
    ...parcial,
  };
}

function crearServicio(habitos: unknown[], registros: unknown[]) {
  const prisma = {
    habito: { findMany: jest.fn().mockResolvedValue(habitos) },
    registro: { findMany: jest.fn().mockResolvedValue(registros) },
  };
  return new StatisticsService(prisma as never);
}

describe('StatisticsService.seguimiento - validaciones', () => {
  const s = crearServicio([], []);

  it('rechaza si la fecha final es anterior a la inicial', async () => {
    await expect(s.seguimiento('u1', '2026-09-20', '2026-09-10')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rechaza fechas que no existen (2026-02-31)', async () => {
    await expect(s.seguimiento('u1', '2026-02-31', '2026-03-05')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(s.seguimiento('u1', '2026-09-01', '2026-13-01')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rechaza rangos de más de 62 días, pero acepta exactamente 62', async () => {
    await expect(s.seguimiento('u1', '2026-01-01', '2026-03-05')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    const r = await s.seguimiento('u1', '2026-07-01', '2026-08-31'); // 62 días
    expect(r.dias).toHaveLength(62);
  });

  it('un solo día es válido', async () => {
    const r = await s.seguimiento('u1', '2026-09-18', '2026-09-18');
    expect(r.dias).toHaveLength(1);
  });
});

describe('StatisticsService.seguimiento - contenido', () => {
  // A: diario desde el 1. B: diario desde el 19. C: inactivo (sin actividad).
  const habitos = [
    habito({ id: 'A', nombre: 'Leer', prioridad: 2 }),
    habito({ id: 'B', nombre: 'Correr', prioridad: 1, fechaInicio: new Date(2026, 8, 19) }),
    habito({ id: 'C', nombre: 'Viejo', activo: false }),
  ];
  const registros = [
    { habitoId: 'A', fecha: fecha(18, 9) },
    { habitoId: 'A', fecha: fecha(18, 20) }, // duplicado el mismo día
    { habitoId: 'A', fecha: fecha(19) },
    { habitoId: 'B', fecha: fecha(19) },
  ];

  it('devuelve un elemento por día, en orden, con qué tocaba y qué se completó', async () => {
    const r = await crearServicio(habitos, registros).seguimiento('u1', '2026-09-17', '2026-09-19');

    expect(r.dias.map((d) => d.fecha)).toEqual(['2026-09-17', '2026-09-18', '2026-09-19']);
    expect(r.dias[0].aplicanIds).toEqual(['A']);
    expect(r.dias[0].completadosIds).toEqual([]);
    expect(r.dias[1].completadosIds).toEqual(['A']); // el duplicado cuenta una sola vez
    expect(r.dias[2].aplicanIds.sort()).toEqual(['A', 'B']);
    expect(r.dias[2].completadosIds.sort()).toEqual(['A', 'B']);
  });

  it('calcula porcentaje por día y el resumen del rango', async () => {
    const r = await crearServicio(habitos, registros).seguimiento('u1', '2026-09-17', '2026-09-19');

    expect(r.dias.map((d) => d.porcentaje)).toEqual([0, 100, 100]);
    expect(r.resumen).toEqual({
      completados: 3, // A el 18, A y B el 19
      esperados: 4, // A x3 + B x1
      porcentaje: 75,
      diasConActividad: 2,
    });
  });

  it('incluye solo los hábitos que tocaban o se completaron, ordenados por prioridad', async () => {
    const r = await crearServicio(habitos, registros).seguimiento('u1', '2026-09-17', '2026-09-19');
    expect(r.habitos.map((h) => h.id)).toEqual(['B', 'A']); // C (inactivo, sin actividad) no aparece
  });

  it('un hábito que aún no empieza no aparece en un rango anterior a su inicio', async () => {
    const r = await crearServicio(habitos, registros).seguimiento('u1', '2026-09-05', '2026-09-06');
    expect(r.habitos.map((h) => h.id)).toEqual(['A']);
  });

  it('sin hábitos devuelve días vacíos y 0%', async () => {
    const r = await crearServicio([], []).seguimiento('u1', '2026-09-14', '2026-09-16');
    expect(r.habitos).toEqual([]);
    expect(r.dias.every((d) => d.esperados === 0 && d.porcentaje === 0)).toBe(true);
    expect(r.resumen.porcentaje).toBe(0);
  });
});

describe('StatisticsService.seguimiento - hábitos inactivos', () => {
  // A activo. C inactivo, pero con un completado el 18 y otro el 19.
  const habitos = [
    habito({ id: 'A', nombre: 'Leer' }),
    habito({ id: 'C', nombre: 'Viejo', activo: false }),
  ];
  const registros = [
    { habitoId: 'C', fecha: fecha(18) },
    { habitoId: 'A', fecha: fecha(19) },
    { habitoId: 'C', fecha: fecha(19) },
  ];

  it('conserva lo completado por un inactivo en completadosIds, pero no lo cuenta', async () => {
    const r = await crearServicio(habitos, registros).seguimiento('u1', '2026-09-18', '2026-09-19');
    const [d18, d19] = r.dias;

    expect(d18.completadosIds).toEqual(['C']); // se ve en el historial...
    expect(d18.completados).toBe(0); // ...pero no cuenta
    expect(d18.aplicanIds).toEqual(['A']); // un inactivo nunca "toca"

    expect(d19.completadosIds.sort()).toEqual(['A', 'C']);
    expect(d19.completados).toBe(1); // solo A
    expect(d19.porcentaje).toBe(100);
  });

  it('el hábito inactivo aparece en la lista (con activo: false) si tiene actividad en el rango', async () => {
    const r = await crearServicio(habitos, registros).seguimiento('u1', '2026-09-18', '2026-09-19');
    const c = r.habitos.find((h) => h.id === 'C');
    expect(c).toBeDefined();
    expect(c?.activo).toBe(false);
  });

  it('un inactivo sin actividad en el rango no aparece', async () => {
    const r = await crearServicio(habitos, registros).seguimiento('u1', '2026-09-05', '2026-09-06');
    expect(r.habitos.map((h) => h.id)).toEqual(['A']);
  });

  it('diasConActividad ignora los días en que solo se completó un inactivo', async () => {
    const r = await crearServicio(habitos, registros).seguimiento('u1', '2026-09-18', '2026-09-19');
    expect(r.resumen.diasConActividad).toBe(1); // solo el 19; el 18 fue únicamente el inactivo
    expect(r.resumen.completados).toBe(1);
  });
});