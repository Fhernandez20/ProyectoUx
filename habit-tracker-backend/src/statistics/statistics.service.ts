import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  EstadoHabito,
  HabitoBase,
  aplicaEnDia,
  calcularRachas,
  claveDia,
  estadoHabito,
  evaluarDia,
  fechaDesdeClave,
  inicioDelDia,
  porcentaje,
  redondear1,
  sumarDias,
} from './statistics.utils';

export const MAX_DIAS_SEGUIMIENTO = 62;

interface Datos {
  habitos: HabitoBase[];
  porDia: Map<string, Set<string>>;
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

  private totalesEnRango(datos: Datos, hasta: Date, dias: number) {
    let completados = 0;
    let esperados = 0;
    for (let i = 0; i < dias; i++) {
      const dia = sumarDias(hasta, -i);
      const r = evaluarDia(datos.habitos, datos.porDia.get(claveDia(dia)), dia);
      completados += r.completadosPonderados;
      esperados += r.esperados;
    }
    return { completados, esperados };
  }

  private cumplimientoEnRango(datos: Datos, hasta: Date, dias: number): number {
    const { completados, esperados } = this.totalesEnRango(datos, hasta, dias);
    return porcentaje(completados, esperados);
  }

  async resumen(usuarioId: string) {
    const datos = await this.cargarDatos(usuarioId);
    const hoy = inicioDelDia(new Date());

    const rachas = calcularRachas(new Set(datos.porDia.keys()), hoy);
    const hoyEval = evaluarDia(
      datos.habitos,
      datos.porDia.get(claveDia(hoy)),
      hoy,
    );
    const contarEstado = (estado: EstadoHabito) =>
      datos.habitos.filter((h) => estadoHabito(h, hoy) === estado).length;

    return {
      totalHabitos: datos.habitos.length,
      habitosActivos: contarEstado('activo'),
      habitosFinalizados: contarEstado('finalizado'),
      habitosInactivos: contarEstado('inactivo'),
      totalCompletados: datos.habitos.reduce(
        (suma, h) => suma + (datos.porHabito.get(h.id)?.size ?? 0),
        0,
      ),
      completadosHoy: hoyEval.completados,
      esperadosHoy: redondear1(hoyEval.esperados),
      rachaActual: rachas.actual,
      mejorRacha: rachas.mejor,
      cumplimiento: {
        hoy: porcentaje(hoyEval.completadosPonderados, hoyEval.esperados),
        semana: this.cumplimientoEnRango(datos, hoy, 7),
        mes: this.cumplimientoEnRango(datos, hoy, 30),
      },
    };
  }

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
        porcentaje: porcentaje(r.completadosPonderados, r.esperados),
      });
    }
    return resultado;
  }

  async tendencia(usuarioId: string, semanas: number) {
    const n = Math.min(Math.max(semanas, 1), 12);
    const datos = await this.cargarDatos(usuarioId);
    const hoy = inicioDelDia(new Date());

    const resultado: {
      desde: string;
      hasta: string;
      porcentaje: number;
      conHabitos: boolean;
    }[] = [];

    for (let i = n - 1; i >= 0; i--) {
      const hasta = sumarDias(hoy, -7 * i);
      const desde = sumarDias(hasta, -6);
      const { completados, esperados } = this.totalesEnRango(datos, hasta, 7);
      resultado.push({
        desde: claveDia(desde),
        hasta: claveDia(hasta),
        porcentaje: porcentaje(completados, esperados),
        conHabitos: esperados > 0,
      });
    }
    return resultado;
  }

  private parsearClave(clave: string, nombre: string): Date {
    const fecha = fechaDesdeClave(clave);
    if (Number.isNaN(fecha.getTime()) || claveDia(fecha) !== clave) {
      throw new BadRequestException(`${nombre} no es una fecha válida`);
    }
    return fecha;
  }

  async seguimiento(usuarioId: string, desdeClave: string, hastaClave: string) {
    const desde = this.parsearClave(desdeClave, 'La fecha inicial');
    const hasta = this.parsearClave(hastaClave, 'La fecha final');
    if (hasta < desde) {
      throw new BadRequestException(
        'La fecha final no puede ser anterior a la inicial',
      );
    }
    const cantidad =
      Math.round((hasta.getTime() - desde.getTime()) / (24 * 60 * 60 * 1000)) +
      1;
    if (cantidad > MAX_DIAS_SEGUIMIENTO) {
      throw new BadRequestException(
        `El rango máximo es de ${MAX_DIAS_SEGUIMIENTO} días`,
      );
    }

    const datos = await this.cargarDatos(usuarioId);
    const idsExistentes = new Set(datos.habitos.map((h) => h.id));
    const relevantes = new Set<string>();

    const dias: {
      fecha: string;
      completados: number;
      esperados: number;
      porcentaje: number;
      completadosIds: string[];
      aplicanIds: string[];
    }[] = [];
    let totalCompletados = 0;
    let totalCompletadosPonderados = 0;
    let totalEsperados = 0;

    for (let i = 0; i < cantidad; i++) {
      const dia = sumarDias(desde, i);
      const clave = claveDia(dia);
      const hechos = datos.porDia.get(clave);
      const r = evaluarDia(datos.habitos, hechos, dia);

      const aplicanIds = datos.habitos
        .filter((h) => aplicaEnDia(h, dia))
        .map((h) => h.id);
      const completadosIds = [...(hechos ?? [])].filter((id) =>
        idsExistentes.has(id),
      );
      aplicanIds.forEach((id) => relevantes.add(id));
      completadosIds.forEach((id) => relevantes.add(id));

      totalCompletados += r.completados;
      totalCompletadosPonderados += r.completadosPonderados;
      totalEsperados += r.esperados;
      dias.push({
        fecha: clave,
        completados: r.completados,
        esperados: redondear1(r.esperados),
        porcentaje: porcentaje(r.completadosPonderados, r.esperados),
        completadosIds,
        aplicanIds,
      });
    }

    const habitos = datos.habitos
      .filter((h) => relevantes.has(h.id))
      .map((h) => ({
        id: h.id,
        nombre: h.nombre,
        frecuencia: h.frecuencia,
        activo: h.activo,
        prioridad: h.prioridad ?? null,
      }))
      .sort(
        (a, b) =>
          (a.prioridad ?? 99) - (b.prioridad ?? 99) ||
          a.nombre.localeCompare(b.nombre, 'es'),
      );

    return {
      desde: desdeClave,
      hasta: hastaClave,
      habitos,
      dias,
      resumen: {
        completados: totalCompletados,
        esperados: redondear1(totalEsperados),
        porcentaje: porcentaje(totalCompletadosPonderados, totalEsperados),
        diasConActividad: dias.filter((d) => d.completados > 0).length,
      },
    };
  }

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