import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HabitsService } from './habits.service';
import { CreateHabitoDto } from './dto/create-habito.dto';
import { UpdateHabitoDto } from './dto/update-habito.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

interface RequestConUsuario extends ExpressRequest {
  user: { userId: string; correo: string; nombre: string };
}

@ApiTags('Habits')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido o vencido' })
@UseGuards(JwtAuthGuard)
@Controller('habits')
export class HabitsController {
  constructor(private habitsService: HabitsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un hábito' })
  @ApiCreatedResponse({ description: 'Hábito creado' })
  @ApiBadRequestResponse({ description: 'Datos inválidos (por ejemplo, fecha de fin anterior a la de inicio)' })
  create(@Request() req: RequestConUsuario, @Body() dto: CreateHabitoDto) {
    return this.habitsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar mis hábitos', description: 'Ordenados por prioridad (1 = alta primero).' })
  @ApiOkResponse({ description: 'Lista de hábitos del usuario' })
  findAll(@Request() req: RequestConUsuario) {
    return this.habitsService.findAll(req.user.userId);
  }

  // Debe ir ANTES de @Get(':id'), si no Nest interpretaría "completados-hoy" como un id
  @Get('completados-hoy')
  @ApiOperation({ summary: 'IDs de los hábitos completados hoy' })
  @ApiOkResponse({ description: 'Arreglo de ids' })
  completadosHoy(@Request() req: RequestConUsuario) {
    return this.habitsService.completadosHoy(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un hábito' })
  @ApiOkResponse({ description: 'El hábito' })
  @ApiBadRequestResponse({ description: 'Identificador no válido' })
  @ApiForbiddenResponse({ description: 'El hábito pertenece a otro usuario' })
  @ApiNotFoundResponse({ description: 'El hábito no existe' })
  findOne(@Request() req: RequestConUsuario, @Param('id', ParseObjectIdPipe) id: string) {
    return this.habitsService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar un hábito', description: 'Solo se modifican los campos enviados. fechaFin: null quita la fecha de fin.' })
  @ApiOkResponse({ description: 'Hábito actualizado' })
  @ApiBadRequestResponse({ description: 'Identificador o datos no válidos' })
  @ApiForbiddenResponse({ description: 'El hábito pertenece a otro usuario' })
  @ApiNotFoundResponse({ description: 'El hábito no existe' })
  update(
    @Request() req: RequestConUsuario,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateHabitoDto,
  ) {
    return this.habitsService.update(req.user.userId, id, dto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Activar o desactivar un hábito', description: 'Un hábito inactivo no cuenta en el cumplimiento ni se puede completar.' })
  @ApiOkResponse({ description: 'Hábito actualizado' })
  @ApiBadRequestResponse({ description: 'Identificador no válido' })
  @ApiForbiddenResponse({ description: 'El hábito pertenece a otro usuario' })
  @ApiNotFoundResponse({ description: 'El hábito no existe' })
  toggleActivo(@Request() req: RequestConUsuario, @Param('id', ParseObjectIdPipe) id: string) {
    return this.habitsService.toggleActivo(req.user.userId, id);
  }

  @Post(':id/completar')
  @ApiOperation({ summary: 'Marcar un hábito como completado hoy' })
  @ApiCreatedResponse({ description: 'Registro creado' })
  @ApiBadRequestResponse({ description: 'Identificador no válido, hábito inactivo o fuera de vigencia (fechas de inicio y fin)' })
  @ApiConflictResponse({ description: 'Ya se completó hoy' })
  @ApiForbiddenResponse({ description: 'El hábito pertenece a otro usuario' })
  @ApiNotFoundResponse({ description: 'El hábito no existe' })
  completar(@Request() req: RequestConUsuario, @Param('id', ParseObjectIdPipe) id: string) {
    return this.habitsService.completar(req.user.userId, id);
  }

  @Get(':id/registros')
  @ApiOperation({ summary: 'Historial de registros de un hábito' })
  @ApiOkResponse({ description: 'Registros del hábito' })
  @ApiBadRequestResponse({ description: 'Identificador no válido' })
  @ApiForbiddenResponse({ description: 'El hábito pertenece a otro usuario' })
  @ApiNotFoundResponse({ description: 'El hábito no existe' })
  historial(@Request() req: RequestConUsuario, @Param('id', ParseObjectIdPipe) id: string) {
    return this.habitsService.historial(req.user.userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un hábito', description: 'También elimina todos sus registros.' })
  @ApiOkResponse({ description: 'Hábito eliminado' })
  @ApiBadRequestResponse({ description: 'Identificador no válido' })
  @ApiForbiddenResponse({ description: 'El hábito pertenece a otro usuario' })
  @ApiNotFoundResponse({ description: 'El hábito no existe' })
  remove(@Request() req: RequestConUsuario, @Param('id', ParseObjectIdPipe) id: string) {
    return this.habitsService.remove(req.user.userId, id);
  }
}