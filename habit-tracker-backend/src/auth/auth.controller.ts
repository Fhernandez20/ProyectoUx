import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Body, Controller, Post, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un usuario', description: 'Crea la cuenta y devuelve el token JWT junto con los datos del usuario.' })
  @ApiCreatedResponse({ description: 'Usuario creado' })
  @ApiBadRequestResponse({ description: 'Datos inválidos (nombre, correo o contraseña)' })
  @ApiConflictResponse({ description: 'El correo ya está registrado' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión', description: 'Devuelve el token JWT (dura 7 días) y los datos del usuario.' })
  @ApiCreatedResponse({ description: 'Sesión iniciada' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiUnauthorizedResponse({ description: 'Correo o contraseña incorrectos' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Datos del usuario contenidos en el token', description: 'Para los datos actualizados desde la base de datos usa GET /users/me.' })
  @ApiOkResponse({ description: 'Datos del token' })
  @ApiUnauthorizedResponse({ description: 'Token ausente, inválido o vencido' })
  @Get('me')
  getPerfil(@Request() req: ExpressRequest) {
    return req.user;
  }
}