import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'fernando@correo.com' })
  @IsEmail()
  correo: string;

  @ApiProperty({ example: 'Clave123' })
  @IsString()
  contrasena: string;
}
