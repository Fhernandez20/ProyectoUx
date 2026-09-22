import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
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

@ApiTags('Statistics')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido o vencido' })
@UseGuards(JwtAuthGuard)
@Controller('statistics')
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  /** Tarjetas: totales, completados hoy, rachas y % de cumplimiento. */
  @Get('resumen')
  @ApiOperation({ summary: 'Resumen para el dashboard', description: 'Totales, completados hoy, racha actual, mejor racha y % de cumplimiento (hoy, semana y mes).' })
  @ApiOkResponse({ description: 'Resumen de estadísticas' })
  resumen(@Request() req: RequestConUsuario) {
    return this.statisticsService.resumen(req.user.userId);
  }

  /** Actividad diaria. ?dias=7 (semanal) o ?dias=30 (mensual). Entre 1 y 90. */
  @Get('actividad')
  @ApiOperation({ summary: 'Actividad día por día', description: 'Con dias=7 sirve para la gráfica semanal y con dias=30 para la mensual.' })
  @ApiOkResponse({ description: 'Un elemento por día, del más antiguo al más reciente' })
  @ApiBadRequestResponse({ description: 'dias fuera de rango (1 a 90)' })
  actividad(
    @Request() req: RequestConUsuario,
    @Query() query: ActividadQueryDto,
  ) {
    return this.statisticsService.actividad(req.user.userId, query.dias);
  }

  /** Cumplimiento por semana. ?semanas=8 (entre 1 y 12). */
  @Get('tendencia')
  @ApiOperation({ summary: 'Tendencia de cumplimiento por semana' })
  @ApiOkResponse({ description: 'Un elemento por semana, con su porcentaje' })
  @ApiBadRequestResponse({ description: 'semanas fuera de rango (1 a 12)' })
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
  @ApiOperation({ summary: 'Seguimiento día por día en un rango de fechas', description: 'Indica qué hábitos tocaban y cuáles se completaron cada día. Con un día sirve de vista diaria; con siete, de semanal; con un mes, de calendario.' })
  @ApiOkResponse({ description: 'Hábitos, días y resumen del rango' })
  @ApiBadRequestResponse({ description: 'Fechas inválidas, final anterior a la inicial o rango mayor a 62 días' })
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
  @ApiOperation({ summary: 'Seguimiento por hábito', description: 'Completados hoy, en la semana y en el mes, con rachas propias.' })
  @ApiOkResponse({ description: 'Un elemento por hábito' })
  porHabito(@Request() req: RequestConUsuario) {
    return this.statisticsService.porHabito(req.user.userId);
  }
}