import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  ActividadQueryDto,
  SeguimientoQueryDto,
  TendenciaQueryDto,
} from './statistics-query.dto';

async function probar<T extends object>(clase: new () => T, datos: object) {
  const dto = plainToInstance(clase, datos);
  return { dto, errores: await validate(dto) };
}

describe('ActividadQueryDto', () => {
  it('sin parámetro usa 7 días', async () => {
    const { dto, errores } = await probar(ActividadQueryDto, {});
    expect(errores).toHaveLength(0);
    expect(dto.dias).toBe(7);
  });

  it('convierte el texto a número', async () => {
    const { dto, errores } = await probar(ActividadQueryDto, { dias: '30' });
    expect(errores).toHaveLength(0);
    expect(dto.dias).toBe(30);
  });

  it.each(['abc', '0', '91', '3.5', ''])('rechaza dias=%p', async (valor) => {
    const { errores } = await probar(ActividadQueryDto, { dias: valor });
    expect(errores.length).toBeGreaterThan(0);
  });
});

describe('TendenciaQueryDto', () => {
  it('sin parámetro usa 8 semanas', async () => {
    const { dto, errores } = await probar(TendenciaQueryDto, {});
    expect(errores).toHaveLength(0);
    expect(dto.semanas).toBe(8);
  });

  it.each(['xyz', '0', '13'])('rechaza semanas=%p', async (valor) => {
    const { errores } = await probar(TendenciaQueryDto, { semanas: valor });
    expect(errores.length).toBeGreaterThan(0);
  });
});

describe('SeguimientoQueryDto', () => {
  it('acepta fechas AAAA-MM-DD', async () => {
    const { errores } = await probar(SeguimientoQueryDto, { desde: '2026-09-01', hasta: '2026-09-30' });
    expect(errores).toHaveLength(0);
  });

  it('exige ambas fechas', async () => {
    expect((await probar(SeguimientoQueryDto, { desde: '2026-09-01' })).errores.length).toBeGreaterThan(0);
    expect((await probar(SeguimientoQueryDto, { hasta: '2026-09-01' })).errores.length).toBeGreaterThan(0);
    expect((await probar(SeguimientoQueryDto, {})).errores.length).toBeGreaterThan(0);
  });

  it.each(['2026/09/01', '01-09-2026', 'hoy', '2026-9-1', ''])('rechaza el formato %p', async (valor) => {
    const { errores } = await probar(SeguimientoQueryDto, { desde: valor, hasta: '2026-09-30' });
    expect(errores.length).toBeGreaterThan(0);
  });
});
