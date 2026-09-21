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
  @IsString()
  @MinLength(2)
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsIn(['diario', 'semanal', 'personalizada'])
  frecuencia: string;

  // Nivel: 1 = alta, 2 = media, 3 = baja
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'La prioridad debe ser 1 (alta), 2 (media) o 3 (baja)' })
  @Max(3, { message: 'La prioridad debe ser 1 (alta), 2 (media) o 3 (baja)' })
  prioridad?: number;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  // null = sin fecha de fin (permite quitarla al editar). @IsOptional() acepta null.
  @IsOptional()
  @IsDateString()
  fechaFin?: string | null;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}