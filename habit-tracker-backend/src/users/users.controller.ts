import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Body, Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

interface RequestConUsuario extends ExpressRequest {
  user: { userId: string; correo: string; nombre: string };
}

@ApiTags('Users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido o vencido' })
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  /** Perfil del usuario autenticado (datos frescos desde la base de datos). */
  @Get('me')
  @ApiOperation({ summary: 'Perfil del usuario autenticado', description: 'Datos actualizados desde la base de datos (nunca incluye la contraseña).' })
  @ApiOkResponse({ description: 'Perfil del usuario' })
  me(@Request() req: RequestConUsuario) {
    return this.usersService.findMe(req.user.userId);
  }

  /** Actualiza el nombre del usuario autenticado. */
  @Patch('me')
  @ApiOperation({ summary: 'Actualizar el nombre del usuario autenticado' })
  @ApiOkResponse({ description: 'Perfil actualizado' })
  @ApiBadRequestResponse({ description: 'Nombre inválido (2 a 80 caracteres)' })
  update(@Request() req: RequestConUsuario, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(req.user.userId, dto);
  }
}
