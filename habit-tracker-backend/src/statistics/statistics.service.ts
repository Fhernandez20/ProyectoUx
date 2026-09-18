import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  HabitoBase,
  calcularRachas,
  claveDia,
  evaluarDia,
  inicioDelDia,
  porcentaje,
  redondear1,
  sumarDias,
} from './statistics.utils';

interface Datos {
  habitos: HabitoBase[];
  /** día ("2026-09-18") -> ids de hábitos completados ese día (sin duplicados) */
  porDia: Map<string, Set<string>>;
  /** id de hábito -> días en que se completó */
  porHabito: Map<string, Set<string>>;
}

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  private async cargarDatos(usuarioId: string): Promise<Datos> {
    const [habitos, registros] = await Promise.all([
      this.prisma.habito.findMany({ where: { usuarioId } }),
      this.prisma.registro.findMany({
        where: { usuarioId, completado: true },
        select: { habitoId: true, fecha: true },
      }),
    ]);

    const porDia = new Map<string, Set<string>>();
    const porHabito = new Map<string, Set<string>>();

    for (const r of registros) {
      const dia = claveDia(r.fecha);
      if (!porDia.has(dia)) porDia.set(dia, new Set());
      porDia.get(dia)!.add(r.habitoId);

      if (!porHabito.has(r.habitoId)) porHabito.set(r.habitoId, new Set());
      porHabito.get(r.habitoId)!.add(dia);
    }

    return { habitos, porDia, porHabito };
  }

  /** Cumplimiento (%) de los `dias` días que terminan en `hasta` (inclusive). */
  private cumplimientoEnRango(datos: Datos, hasta: Date, dias: number): number {
    let completados = 0;
    let esperados = 0;
    for (let i = 0; i < dias; i++) {
      const dia = sumarDias(hasta, -i);
      const r = evaluarDia(datos.habitos, datos.porDia.get(claveDia(dia)), dia);
      completados += r.completados;
      esperados += r.esperados;
    }
    return porcentaje(completados, esperados);
  }

  /** Tarjetas del dashboard y de la página de estadísticas. */
  async resumen(usuarioId: string) {
    const datos = await this.cargarDatos(usuarioId);
    const hoy = inicioDelDia(new Date());

    const rachas = calcularRachas(new Set(datos.porDia.keys()), hoy);
    const hoyEval = evaluarDia(datos.habitos, datos.porDia.get(claveDia(hoy)), hoy);

    return {
      totalHabitos: datos.habitos.length,
      habitosActivos: datos.habitos.filter((h) => h.activo).length,
      habitosFinalizados: datos.habitos.filter(
        (h) => h.fechaFin && inicioDelDia(h.fechaFin) < hoy,
      ).length,
      completadosHoy: hoyEval.completados,
      esperadosHoy: redondear1(hoyEval.esperados),
      rachaActual: rachas.actual,
      mejorRacha: rachas.mejor,
      cumplimiento: {
        hoy: porcentaje(hoyEval.completados, hoyEval.esperados),
        semana: this.cumplimientoEnRango(datos, hoy, 7),
        mes: this.cumplimientoEnRango(datos, hoy, 30),
      },
    };
  }

  /** Actividad día por día (para la gráfica semanal: dias=7, mensual: dias=30). */
  async actividad(usuarioId: string, dias: number) {
    const n = Math.min(Math.max(dias, 1), 90);
    const datos = await this.cargarDatos(usuarioId);
    const hoy = inicioDelDia(new Date());

    const resultado: {
      fecha: string;
      completados: number;
      esperados: number;
      porcentaje: number;
    }[] = [];

    for (let i = n - 1; i >= 0; i--) {
      const dia = sumarDias(hoy, -i);
      const clave = claveDia(dia);
      const r = evaluarDia(datos.habitos, datos.porDia.get(clave), dia);
      resultado.push({
        fecha: clave,
        completados: r.completados,
        esperados: redondear1(r.esperados),
        porcentaje: porcentaje(r.completados, r.esperados),
      });
    }
    return resultado;
  }

  /** Cumplimiento semana por semana (últimas `semanas` semanas). */
  async tendencia(usuarioId: string, semanas: number) {
    const n = Math.min(Math.max(semanas, 1), 12);
    const datos = await this.cargarDatos(usuarioId);
    const hoy = inicioDelDia(new Date());

    const resultado: {
      desde: string;
      hasta: string;
      porcentaje: number;
    }[] = [];

    for (let i = n - 1; i >= 0; i--) {
      const hasta = sumarDias(hoy, -7 * i);
      const desde = sumarDias(hasta, -6);
      resultado.push({
        desde: claveDia(desde),
        hasta: claveDia(hasta),
        porcentaje: this.cumplimientoEnRango(datos, hasta, 7),
      });
    }
    return resultado;
  }

  /** Seguimiento por hábito: hoy, semana, mes y rachas propias. */
  async porHabito(usuarioId: string) {
    const datos = await this.cargarDatos(usuarioId);
    const hoy = inicioDelDia(new Date());
    const claveHoy = claveDia(hoy);

    const contar = (dias: Set<string>, ventana: number) => {
      let total = 0;
      for (let i = 0; i < ventana; i++) {
        if (dias.has(claveDia(sumarDias(hoy, -i)))) total++;
      }
      return total;
    };

    return datos.habitos.map((h) => {
      const dias = datos.porHabito.get(h.id) ?? new Set<string>();
      const rachas = calcularRachas(dias, hoy);
      return {
        id: h.id,
        nombre: h.nombre,
        frecuencia: h.frecuencia,
        activo: h.activo,
        completadoHoy: dias.has(claveHoy),
        completadosSemana: contar(dias, 7),
        completadosMes: contar(dias, 30),
        rachaActual: rachas.actual,
        mejorRacha: rachas.mejor,
      };
    });
  }
}
