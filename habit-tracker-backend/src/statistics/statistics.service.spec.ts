jest.mock('@nestjs/common', () => ({
  Injectable: () => () => undefined,
  BadRequestException: class BadRequestException extends Error {},
}));
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

import { BadRequestException } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

const fecha = (dia: number, hora = 10) => new Date(2026, 8, dia, hora, 0);

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
    await expect(
      s.seguimiento('u1', '2026-09-20', '2026-09-10'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza fechas que no existen (2026-02-31)', async () => {
    await expect(
      s.seguimiento('u1', '2026-02-31', '2026-03-05'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      s.seguimiento('u1', '2026-09-01', '2026-13-01'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza rangos de más de 62 días, pero acepta exactamente 62', async () => {
    await expect(
      s.seguimiento('u1', '2026-01-01', '2026-03-05'),
    ).rejects.toBeInstanceOf(BadRequestException);
    const r = await s.seguimiento('u1', '2026-07-01', '2026-08-31');
    expect(r.dias).toHaveLength(62);
  });

  it('un solo día es válido', async () => {
    const r = await s.seguimiento('u1', '2026-09-18', '2026-09-18');
    expect(r.dias).toHaveLength(1);
  });
});

describe('StatisticsService.seguimiento - contenido', () => {
  const habitos = [
    habito({ id: 'A', nombre: 'Leer', prioridad: 2 }),
    habito({
      id: 'B',
      nombre: 'Correr',
      prioridad: 1,
      fechaInicio: new Date(2026, 8, 19),
    }),
    habito({ id: 'C', nombre: 'Viejo', activo: false }),
  ];
  const registros = [
    { habitoId: 'A', fecha: fecha(18, 9) },
    { habitoId: 'A', fecha: fecha(18, 20) },
    { habitoId: 'A', fecha: fecha(19) },
    { habitoId: 'B', fecha: fecha(19) },
  ];

  it('devuelve un elemento por día, en orden, con qué tocaba y qué se completó', async () => {
    const r = await crearServicio(habitos, registros).seguimiento(
      'u1',
      '2026-09-17',
      '2026-09-19',
    );

    expect(r.dias.map((d) => d.fecha)).toEqual([
      '2026-09-17',
      '2026-09-18',
      '2026-09-19',
    ]);
    expect(r.dias[0].aplicanIds).toEqual(['A']);
    expect(r.dias[0].completadosIds).toEqual([]);
    expect(r.dias[1].completadosIds).toEqual(['A']);
    expect(r.dias[2].aplicanIds.sort()).toEqual(['A', 'B']);
    expect(r.dias[2].completadosIds.sort()).toEqual(['A', 'B']);
  });

  it('calcula porcentaje por día y el resumen del rango', async () => {
    const r = await crearServicio(habitos, registros).seguimiento(
      'u1',
      '2026-09-17',
      '2026-09-19',
    );

    expect(r.dias.map((d) => d.porcentaje)).toEqual([0, 100, 100]);
    expect(r.resumen).toEqual({
      completados: 3,
      esperados: 4,
      porcentaje: 75,
      diasConActividad: 2,
    });
  });

  it('incluye solo los hábitos que tocaban o se completaron, ordenados por prioridad', async () => {
    const r = await crearServicio(habitos, registros).seguimiento(
      'u1',
      '2026-09-17',
      '2026-09-19',
    );
    expect(r.habitos.map((h) => h.id)).toEqual(['B', 'A']);
  });

  it('un hábito que aún no empieza no aparece en un rango anterior a su inicio', async () => {
    const r = await crearServicio(habitos, registros).seguimiento(
      'u1',
      '2026-09-05',
      '2026-09-06',
    );
    expect(r.habitos.map((h) => h.id)).toEqual(['A']);
  });

  it('sin hábitos devuelve días vacíos y 0%', async () => {
    const r = await crearServicio([], []).seguimiento(
      'u1',
      '2026-09-14',
      '2026-09-16',
    );
    expect(r.habitos).toEqual([]);
    expect(r.dias.every((d) => d.esperados === 0 && d.porcentaje === 0)).toBe(
      true,
    );
    expect(r.resumen.porcentaje).toBe(0);
  });
});

describe('StatisticsService.seguimiento - hábitos inactivos', () => {
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
    const r = await crearServicio(habitos, registros).seguimiento(
      'u1',
      '2026-09-18',
      '2026-09-19',
    );
    const [d18, d19] = r.dias;

    expect(d18.completadosIds).toEqual(['C']);
    expect(d18.completados).toBe(0);
    expect(d18.aplicanIds).toEqual(['A']);

    expect(d19.completadosIds.sort()).toEqual(['A', 'C']);
    expect(d19.completados).toBe(1);
    expect(d19.porcentaje).toBe(100);
  });

  it('el hábito inactivo aparece en la lista (con activo: false) si tiene actividad en el rango', async () => {
    const r = await crearServicio(habitos, registros).seguimiento(
      'u1',
      '2026-09-18',
      '2026-09-19',
    );
    const c = r.habitos.find((h) => h.id === 'C');
    expect(c).toBeDefined();
    expect(c?.activo).toBe(false);
  });

  it('un inactivo sin actividad en el rango no aparece', async () => {
    const r = await crearServicio(habitos, registros).seguimiento(
      'u1',
      '2026-09-05',
      '2026-09-06',
    );
    expect(r.habitos.map((h) => h.id)).toEqual(['A']);
  });

  it('diasConActividad ignora los días en que solo se completó un inactivo', async () => {
    const r = await crearServicio(habitos, registros).seguimiento(
      'u1',
      '2026-09-18',
      '2026-09-19',
    );
    expect(r.resumen.diasConActividad).toBe(1);
    expect(r.resumen.completados).toBe(1);
  });
});

describe('StatisticsService - bug: % inflado por un hábito semanal sobre-completado', () => {
  const hoyFijo = new Date(2026, 8, 21, 12, 0);
  const diaHace = (n: number) => new Date(2026, 8, 21 - n, 8, 0);

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    jest.setSystemTime(hoyFijo);
  });
  afterEach(() => jest.useRealTimers());

  const habitos = [
    habito({
      id: 'diario',
      nombre: 'Tomar agua',
      frecuencia: 'diario',
      fechaInicio: diaHace(30),
    }),
    habito({
      id: 'semanal',
      nombre: 'Jugar Splatoon',
      frecuencia: 'semanal',
      fechaInicio: diaHace(30),
    }),
  ];

  const registros: { habitoId: string; fecha: Date }[] = [];
  for (let i = 0; i < 7; i++) {
    if (i !== 3) registros.push({ habitoId: 'diario', fecha: diaHace(i) });
    registros.push({ habitoId: 'semanal', fecha: diaHace(i) });
  }

  it('resumen(): el % semanal ya NO se infla a 100%', async () => {
    const servicio = crearServicio(habitos, registros);
    const r = await servicio.resumen('u1');
    expect(r.cumplimiento.semana).toBe(88);
    expect(r.cumplimiento.semana).toBeLessThan(100);
  });

  it('resumen(): "completadosHoy" sigue siendo un conteo simple (no cambia)', async () => {
    const servicio = crearServicio(habitos, registros);
    const r = await servicio.resumen('u1');
    expect(r.completadosHoy).toBe(2);
  });

  it('seguimiento(): el "Cumplimiento de la semana" ya no se infla, y el conteo total no cambia', async () => {
    const servicio = crearServicio(habitos, registros);
    const r = await servicio.seguimiento('u1', '2026-09-15', '2026-09-21');
    expect(r.resumen.porcentaje).toBe(88);
    expect(r.resumen.completados).toBe(13);
    expect(r.resumen.diasConActividad).toBe(7);
  });

  it('actividad(): el % de un día usa el valor ponderado, no el conteo simple', async () => {
    const servicio = crearServicio(habitos, registros);
    const dias = await servicio.actividad('u1', 7);
    const diaSinDiario = dias.find((d) => d.fecha === '2026-09-18');
    expect(diaSinDiario?.completados).toBe(1);
    expect(diaSinDiario?.porcentaje).toBe(13);
  });
});
describe('StatisticsService.tendencia - semanas sin hábitos', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 8, 23, 12, 0));
  });
  afterEach(() => jest.useRealTimers());

  it('marca conHabitos: false en las semanas anteriores al primer hábito', async () => {
    const s = crearServicio(
      [habito({ fechaInicio: new Date(2026, 8, 10) })],
      [],
    );
    const r = await s.tendencia('u1', 4);
    expect(r).toHaveLength(4);
    expect(r.map((x) => x.conHabitos)).toEqual([false, false, true, true]);
  });

  it('una semana con hábitos pero sin completar nada sigue contando (0%, conHabitos: true)', async () => {
    const s = crearServicio(
      [habito({ fechaInicio: new Date(2026, 8, 1) })],
      [],
    );
    const r = await s.tendencia('u1', 2);
    expect(r.every((x) => x.conHabitos && x.porcentaje === 0)).toBe(true);
  });
});

describe('StatisticsService.resumen - activos, finalizados e inactivos', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 8, 23, 12, 0));
  });
  afterEach(() => jest.useRealTimers());

  it('cada hábito cae en un solo grupo y los tres suman el total', async () => {
    const s = crearServicio(
      [
        habito({ id: 'A' }),
        habito({ id: 'B', fechaFin: new Date(2026, 8, 20) }),
        habito({ id: 'C', activo: false, fechaFin: new Date(2026, 8, 18) }),
        habito({ id: 'D', activo: false }),
        habito({ id: 'E', fechaFin: new Date(2026, 8, 23) }),
      ],
      [],
    );
    const r = await s.resumen('u1');
    expect(r.habitosActivos).toBe(2);
    expect(r.habitosFinalizados).toBe(2);
    expect(r.habitosInactivos).toBe(1);
    expect(r.habitosActivos + r.habitosFinalizados + r.habitosInactivos).toBe(
      r.totalHabitos,
    );
  });

  it('totalCompletados cuenta todas las veces, incluidos inactivos, sin registros de hábitos borrados', async () => {
    const s = crearServicio(
      [habito({ id: 'A' }), habito({ id: 'B', activo: false })],
      [
        { habitoId: 'A', fecha: fecha(1) },
        { habitoId: 'A', fecha: fecha(2) },
        { habitoId: 'A', fecha: fecha(2, 18) },
        { habitoId: 'B', fecha: fecha(3) },
        { habitoId: 'BORRADO', fecha: fecha(4) },
      ],
    );
    const r = await s.resumen('u1');
    expect(r.totalCompletados).toBe(3);
  });
});