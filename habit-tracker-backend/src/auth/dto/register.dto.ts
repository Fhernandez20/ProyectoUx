import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Fernando', minLength: 2, description: 'Nombre del usuario' })
  @IsString()
  @MinLength(2)
  nombre: string;

  @ApiProperty({ example: 'fernando@correo.com', description: 'Correo electrónico (único)' })
  @IsEmail()
  correo: string;

  @ApiProperty({ example: 'Clave123', minLength: 6, description: 'Contraseña (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6)
  contrasena: string;
}
