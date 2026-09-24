import {
  HabitoBase,
  aplicaEnDia,
  calcularRachas,
  calcularRachasSemanales,
  claveDia,
  evaluarDia,
  porcentaje,
} from './statistics.utils';

const d = (y: number, m: number, dia: number) => new Date(y, m - 1, dia);
const dias = (...claves: string[]) => new Set(claves);

function habito(parcial: Partial<HabitoBase> = {}): HabitoBase {
  return {
    id: 'h1',
    nombre: 'Leer',
    activo: true,
    frecuencia: 'diario',
    fechaInicio: d(2026, 9, 1),
    fechaFin: null,
    ...parcial,
  };
}

describe('claveDia', () => {
  it('formatea con ceros a la izquierda', () => {
    expect(claveDia(d(2026, 3, 5))).toBe('2026-03-05');
  });
});

describe('calcularRachas', () => {
  const hoy = d(2026, 9, 18);

  it('sin actividad: rachas en 0', () => {
    expect(calcularRachas(new Set(), hoy)).toEqual({ actual: 0, mejor: 0 });
  });

  it('racha actual cuenta hacia atrás desde hoy', () => {
    const r = calcularRachas(
      dias('2026-09-16', '2026-09-17', '2026-09-18'),
      hoy,
    );
    expect(r).toEqual({ actual: 3, mejor: 3 });
  });

  it('si hoy aún no hay actividad, la racha sigue desde ayer', () => {
    const r = calcularRachas(dias('2026-09-16', '2026-09-17'), hoy);
    expect(r.actual).toBe(2);
  });

  it('si ayer tampoco hubo actividad, la racha actual es 0', () => {
    const r = calcularRachas(dias('2026-09-10', '2026-09-11'), hoy);
    expect(r).toEqual({ actual: 0, mejor: 2 });
  });

  it('la mejor racha puede ser anterior a la actual', () => {
    const r = calcularRachas(
      dias(
        '2026-09-01',
        '2026-09-02',
        '2026-09-03',
        '2026-09-04',
        '2026-09-17',
        '2026-09-18',
      ),
      hoy,
    );
    expect(r).toEqual({ actual: 2, mejor: 4 });
  });

  it('funciona al cruzar de mes', () => {
    const r = calcularRachas(
      dias('2026-08-30', '2026-08-31', '2026-09-01'),
      d(2026, 9, 1),
    );
    expect(r).toEqual({ actual: 3, mejor: 3 });
  });
});

describe('aplicaEnDia', () => {
  it('no aplica antes de la fecha de inicio', () => {
    expect(aplicaEnDia(habito(), d(2026, 8, 31))).toBe(false);
    expect(aplicaEnDia(habito(), d(2026, 9, 1))).toBe(true);
  });

  it('no aplica después de la fecha de fin', () => {
    const h = habito({ fechaFin: d(2026, 9, 10) });
    expect(aplicaEnDia(h, d(2026, 9, 10))).toBe(true);
    expect(aplicaEnDia(h, d(2026, 9, 11))).toBe(false);
  });

  it('no aplica si el hábito está inactivo', () => {
    expect(aplicaEnDia(habito({ activo: false }), d(2026, 9, 18))).toBe(false);
  });
});

describe('evaluarDia y porcentaje', () => {
  const dia = d(2026, 9, 18);

  it('2 hábitos diarios, 1 completado = 50%', () => {
    const habitos = [habito({ id: 'a' }), habito({ id: 'b' })];
    const r = evaluarDia(habitos, new Set(['a']), dia);
    expect(r).toEqual({
      completados: 1,
      completadosPonderados: 1,
      esperados: 2,
    });
    expect(porcentaje(r.completados, r.esperados)).toBe(50);
  });

  it('ignora completados de hábitos que no aplican ese día', () => {
    const habitos = [habito({ id: 'a', activo: false }), habito({ id: 'b' })];
    const r = evaluarDia(habitos, new Set(['a', 'b']), dia);
    expect(r).toEqual({
      completados: 1,
      completadosPonderados: 1,
      esperados: 1,
    });
  });

  it('un hábito semanal pesa 1/7 por día', () => {
    const r = evaluarDia([habito({ frecuencia: 'semanal' })], undefined, dia);
    expect(r.esperados).toBeCloseTo(1 / 7);
  });

  it('completadosPonderados usa el mismo peso que esperados', () => {
    const habitos = [
      habito({ id: 'a', frecuencia: 'diario' }),
      habito({ id: 'b', frecuencia: 'semanal' }),
    ];
    const r = evaluarDia(habitos, new Set(['a', 'b']), dia);
    expect(r.completados).toBe(2);
    expect(r.completadosPonderados).toBeCloseTo(1 + 1 / 7);
  });

  it('completadosPonderados: un hábito semanal completado varias veces en la semana no debe superar su propio peso diario', () => {
    const semanal = habito({ id: 'b', frecuencia: 'semanal' });
    let suma = 0;
    for (const d2 of [dia, new Date(2026, 8, 19), new Date(2026, 8, 20)]) {
      suma += evaluarDia([semanal], new Set(['b']), d2).completadosPonderados;
    }
    expect(suma).toBeCloseTo(3 / 7);
    expect(suma).toBeLessThan(1);
  });

  it('porcentaje nunca pasa de 100 y con 0 esperados devuelve 0', () => {
    expect(porcentaje(5, 2)).toBe(100);
    expect(porcentaje(0, 0)).toBe(0);
  });
});

describe('calcularRachasSemanales', () => {
  const inicio = new Date(2026, 7, 3);
  const hoy = new Date(2026, 8, 24, 12);

  it('cuenta semanas seguidas desde el inicio del hábito, aunque sea un solo día por semana', () => {
    const dias = new Set([
      '2026-08-31',
      '2026-09-08',
      '2026-09-15',
      '2026-09-24',
    ]);
    expect(calcularRachasSemanales(dias, inicio, hoy)).toEqual({
      actual: 4,
      mejor: 4,
    });
  });

  it('la semana actual sin completar no rompe la racha', () => {
    const dias = new Set(['2026-09-08', '2026-09-15']);
    expect(calcularRachasSemanales(dias, inicio, hoy)).toEqual({
      actual: 2,
      mejor: 2,
    });
  });

  it('una semana sin completar sí la rompe', () => {
    const dias = new Set([
      '2026-08-04',
      '2026-08-11',
      '2026-08-18',
      '2026-09-15',
    ]);
    expect(calcularRachasSemanales(dias, inicio, hoy)).toEqual({
      actual: 1,
      mejor: 3,
    });
  });

  it('dos veces en la misma semana cuentan como una', () => {
    const dias = new Set(['2026-09-22', '2026-09-24']);
    expect(calcularRachasSemanales(dias, inicio, hoy)).toEqual({
      actual: 1,
      mejor: 1,
    });
  });

  it('sin actividad da cero', () => {
    expect(calcularRachasSemanales(new Set(), inicio, hoy)).toEqual({
      actual: 0,
      mejor: 0,
    });
  });
});