import { Body, Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

interface RequestConUsuario extends ExpressRequest {
  user: { userId: string; correo: string; nombre: string };
}

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  /** Perfil del usuario autenticado (datos frescos desde la base de datos). */
  @Get('me')
  me(@Request() req: RequestConUsuario) {
    return this.usersService.findMe(req.user.userId);
  }

  /** Actualiza el nombre del usuario autenticado. */
  @Patch('me')
  update(@Request() req: RequestConUsuario, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(req.user.userId, dto);
  }
}
