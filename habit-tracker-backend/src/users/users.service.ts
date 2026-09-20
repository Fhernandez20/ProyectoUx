import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

// Nunca se devuelve la contraseña (hash)
const CAMPOS_PUBLICOS = {
  id: true,
  nombre: true,
  correo: true,
  fechaRegistro: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findMe(userId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: CAMPOS_PUBLICOS,
    });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return usuario;
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    await this.findMe(userId);
    return this.prisma.usuario.update({
      where: { id: userId },
      data: { nombre: dto.nombre },
      select: CAMPOS_PUBLICOS,
    });
  }
}
