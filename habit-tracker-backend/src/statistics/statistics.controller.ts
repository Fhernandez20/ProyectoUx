import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StatisticsService } from './statistics.service';
import {
  ActividadQueryDto,
  SeguimientoQueryDto,
  TendenciaQueryDto,
} from './dto/statistics-query.dto';

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

  /**
   * Seguimiento día por día en un rango (máx. 62 días): qué hábitos tocaban y
   * cuáles se completaron cada día. Sirve para las vistas diaria, semanal y mensual.
   */
  @Get('seguimiento')
  seguimiento(
    @Request() req: RequestConUsuario,
    @Query() query: SeguimientoQueryDto,
  ) {
    return this.statisticsService.seguimiento(
      req.user.userId,
      query.desde,
      query.hasta,
    );
  }

  /** Seguimiento por hábito (hoy / semana / mes / rachas). */
  @Get('habitos')
  porHabito(@Request() req: RequestConUsuario) {
    return this.statisticsService.porHabito(req.user.userId);
  }
}