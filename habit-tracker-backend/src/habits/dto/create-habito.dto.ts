import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateHabitoDto {
  @ApiProperty({ example: 'Leer 20 minutos', minLength: 2 })
  @IsString()
  @MinLength(2)
  nombre: string;

  @ApiPropertyOptional({ example: 'Leer antes de dormir' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ example: 'Estudio', description: 'Para agrupar y filtrar hábitos' })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiProperty({ enum: ['diario', 'semanal', 'personalizada'], example: 'diario' })
  @IsIn(['diario', 'semanal', 'personalizada'])
  frecuencia: string;

  // Nivel: 1 = alta, 2 = media, 3 = baja
  @ApiPropertyOptional({ minimum: 1, maximum: 3, example: 2, description: 'Nivel de prioridad: 1 = alta, 2 = media, 3 = baja' })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'La prioridad debe ser 1 (alta), 2 (media) o 3 (baja)' })
  @Max(3, { message: 'La prioridad debe ser 1 (alta), 2 (media) o 3 (baja)' })
  prioridad?: number;

  @ApiPropertyOptional({ example: '2026-09-20T12:00:00.000Z', description: 'Si se omite, es la fecha de hoy' })
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  // null = sin fecha de fin (permite quitarla al editar). @IsOptional() acepta null.
  @ApiPropertyOptional({ type: String, nullable: true, example: '2026-12-31T12:00:00.000Z', description: 'Opcional. No puede ser anterior a la fecha de inicio. null la quita' })
  @IsOptional()
  @IsDateString()
  fechaFin?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}