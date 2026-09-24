import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHabitoDto } from './dto/create-habito.dto';
import { UpdateHabitoDto } from './dto/update-habito.dto';
import { aplicaEnDia } from '../statistics/statistics.utils';

@Injectable()
export class HabitsService {
  constructor(private prisma: PrismaService) {}

  private validarRangoFechas(inicio?: string | null, fin?: string | null) {
    if (inicio && fin && fin.slice(0, 10) < inicio.slice(0, 10)) {
      throw new BadRequestException(
        'La fecha de fin no puede ser anterior a la fecha de inicio',
      );
    }
  }

  create(usuarioId: string, dto: CreateHabitoDto) {
    this.validarRangoFechas(
      dto.fechaInicio ?? new Date().toISOString(),
      dto.fechaFin,
    );

    return this.prisma.habito.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        categoria: dto.categoria,
        frecuencia: dto.frecuencia,
        prioridad: dto.prioridad,
        fechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : new Date(),
        fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : undefined,
        activo: dto.activo ?? true,
        usuarioId,
      },
    });
  }

  findAll(usuarioId: string) {
    return this.prisma.habito.findMany({
      where: { usuarioId },
      orderBy: { prioridad: 'asc' },
    });
  }

  async findOne(usuarioId: string, id: string) {
    const habito = await this.prisma.habito.findUnique({ where: { id } });

    if (!habito) {
      throw new NotFoundException('Hábito no encontrado');
    }
    if (habito.usuarioId !== usuarioId) {
      throw new ForbiddenException('Este hábito no te pertenece');
    }

    return habito;
  }

  async update(usuarioId: string, id: string, dto: UpdateHabitoDto) {
    const actual = await this.findOne(usuarioId, id);

    const inicioFinal = dto.fechaInicio ?? actual.fechaInicio.toISOString();
    const finFinal =
      dto.fechaFin === null
        ? null
        : (dto.fechaFin ?? actual.fechaFin?.toISOString());
    this.validarRangoFechas(inicioFinal, finFinal);

    return this.prisma.habito.update({
      where: { id },
      data: {
        ...dto,
        fechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : undefined,
        fechaFin:
          dto.fechaFin === null
            ? null
            : dto.fechaFin
              ? new Date(dto.fechaFin)
              : undefined,
      },
    });
  }

  async remove(usuarioId: string, id: string) {
    await this.findOne(usuarioId, id);
    await this.prisma.registro.deleteMany({ where: { habitoId: id } });
    return this.prisma.habito.delete({ where: { id } });
  }

  async toggleActivo(usuarioId: string, id: string) {
    const habito = await this.findOne(usuarioId, id);
    return this.prisma.habito.update({
      where: { id },
      data: { activo: !habito.activo },
    });
  }

  private rangoDeHoy() {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 1);
    return { inicio, fin };
  }

  async completadosHoy(usuarioId: string) {
    const { inicio, fin } = this.rangoDeHoy();
    const registros = await this.prisma.registro.findMany({
      where: {
        usuarioId,
        completado: true,
        fecha: { gte: inicio, lt: fin },
      },
      select: { habitoId: true },
    });
    return registros.map((r) => r.habitoId);
  }

  async completar(usuarioId: string, habitoId: string) {
    const habito = await this.findOne(usuarioId, habitoId);

    if (!habito.activo) {
      throw new BadRequestException('Este hábito está inactivo');
    }
    if (!aplicaEnDia(habito, new Date())) {
      throw new BadRequestException(
        'Este hábito no está vigente hoy (revisa sus fechas de inicio y fin)',
      );
    }

    const { inicio, fin } = this.rangoDeHoy();
    const yaCompletado = await this.prisma.registro.findFirst({
      where: {
        habitoId,
        usuarioId,
        completado: true,
        fecha: { gte: inicio, lt: fin },
      },
    });
    if (yaCompletado) {
      throw new ConflictException('Ya completaste este hábito hoy');
    }

    return this.prisma.registro.create({
      data: {
        habitoId,
        usuarioId,
        fecha: new Date(),
        completado: true,
      },
    });
  }

  async descompletar(usuarioId: string, habitoId: string) {
    await this.findOne(usuarioId, habitoId);

    const { inicio, fin } = this.rangoDeHoy();
    const { count } = await this.prisma.registro.deleteMany({
      where: {
        habitoId,
        usuarioId,
        completado: true,
        fecha: { gte: inicio, lt: fin },
      },
    });
    if (count === 0) {
      throw new NotFoundException(
        'Este hábito no está marcado como completado hoy',
      );
    }
    return { habitoId, completadoHoy: false };
  }

  async historial(usuarioId: string, habitoId: string) {
    await this.findOne(usuarioId, habitoId);

    return this.prisma.registro.findMany({
      where: { habitoId },
      orderBy: { fecha: 'desc' },
    });
  }
}