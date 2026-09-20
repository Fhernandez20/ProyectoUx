import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StatisticsService } from './statistics.service';
import { ActividadQueryDto, TendenciaQueryDto } from './dto/statistics-query.dto';

interface RequestConUsuario extends ExpressRequest {
  user: { userId: string; correo: string; nombre: string };
}

@UseGuards(JwtAuthGuard)
@Controller('statistics')
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  /** Tarjetas: totales, completados hoy, rachas y % de cumplimiento. */
  @Get('resumen')
  resumen(@Request() req: RequestConUsuario) {
    return this.statisticsService.resumen(req.user.userId);
  }

  /** Actividad diaria. ?dias=7 (semanal) o ?dias=30 (mensual). Entre 1 y 90. */
  @Get('actividad')
  actividad(
    @Request() req: RequestConUsuario,
    @Query() query: ActividadQueryDto,
  ) {
    return this.statisticsService.actividad(req.user.userId, query.dias);
  }

  /** Cumplimiento por semana. ?semanas=8 (entre 1 y 12). */
  @Get('tendencia')
  tendencia(
    @Request() req: RequestConUsuario,
    @Query() query: TendenciaQueryDto,
  ) {
    return this.statisticsService.tendencia(req.user.userId, query.semanas);
  }

  /** Seguimiento por hábito (hoy / semana / mes / rachas). */
  @Get('habitos')
  porHabito(@Request() req: RequestConUsuario) {
    return this.statisticsService.porHabito(req.user.userId);
  }
}