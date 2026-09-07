import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHabitoDto } from './dto/create-habito.dto';
import { UpdateHabitoDto } from './dto/update-habito.dto';

@Injectable()
export class HabitsService {
  constructor(private prisma: PrismaService) {}

  create(usuarioId: string, dto: CreateHabitoDto) {
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
    await this.findOne(usuarioId, id);

    return this.prisma.habito.update({
      where: { id },
      data: {
        ...dto,
        fechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : undefined,
        fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : undefined,
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

  async completar(usuarioId: string, habitoId: string) {
    await this.findOne(usuarioId, habitoId);

    return this.prisma.registro.create({
      data: {
        habitoId,
        usuarioId,
        fecha: new Date(),
        completado: true,
      },
    });
  }

  async historial(usuarioId: string, habitoId: string) {
    await this.findOne(usuarioId, habitoId);

    return this.prisma.registro.findMany({
      where: { habitoId },
      orderBy: { fecha: 'desc' },
    });
  }
}