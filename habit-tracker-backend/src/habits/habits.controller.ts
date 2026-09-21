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

@UseGuards(JwtAuthGuard)
@Controller('habits')
export class HabitsController {
  constructor(private habitsService: HabitsService) {}

  @Post()
  create(@Request() req: RequestConUsuario, @Body() dto: CreateHabitoDto) {
    return this.habitsService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Request() req: RequestConUsuario) {
    return this.habitsService.findAll(req.user.userId);
  }

  // Debe ir ANTES de @Get(':id'), si no Nest interpretaría "completados-hoy" como un id
  @Get('completados-hoy')
  completadosHoy(@Request() req: RequestConUsuario) {
    return this.habitsService.completadosHoy(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req: RequestConUsuario, @Param('id', ParseObjectIdPipe) id: string) {
    return this.habitsService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(
    @Request() req: RequestConUsuario,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateHabitoDto,
  ) {
    return this.habitsService.update(req.user.userId, id, dto);
  }

  @Patch(':id/toggle')
  toggleActivo(@Request() req: RequestConUsuario, @Param('id', ParseObjectIdPipe) id: string) {
    return this.habitsService.toggleActivo(req.user.userId, id);
  }

  @Post(':id/completar')
  completar(@Request() req: RequestConUsuario, @Param('id', ParseObjectIdPipe) id: string) {
    return this.habitsService.completar(req.user.userId, id);
  }

  @Get(':id/registros')
  historial(@Request() req: RequestConUsuario, @Param('id', ParseObjectIdPipe) id: string) {
    return this.habitsService.historial(req.user.userId, id);
  }

  @Delete(':id')
  remove(@Request() req: RequestConUsuario, @Param('id', ParseObjectIdPipe) id: string) {
    return this.habitsService.remove(req.user.userId, id);
  }
}