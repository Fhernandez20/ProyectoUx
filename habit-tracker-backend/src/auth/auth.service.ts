import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existente = await this.prisma.usuario.findUnique({
      where: { correo: dto.correo },
    });
    if (existente) {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }

    const contrasenaHash = await bcrypt.hash(dto.contrasena, 10);

    const usuario = await this.prisma.usuario.create({
      data: {
        nombre: dto.nombre,
        correo: dto.correo,
        contrasena: contrasenaHash,
      },
    });

    return this.generarToken(usuario.id, usuario.correo, usuario.nombre);
  }

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { correo: dto.correo },
    });
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const contrasenaValida = await bcrypt.compare(dto.contrasena, usuario.contrasena);
    if (!contrasenaValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.generarToken(usuario.id, usuario.correo, usuario.nombre);
  }

  private generarToken(userId: string, correo: string, nombre: string) {
    const payload = { sub: userId, correo, nombre };
    return {
      access_token: this.jwtService.sign(payload),
      usuario: { id: userId, correo, nombre },
    };
  }
}