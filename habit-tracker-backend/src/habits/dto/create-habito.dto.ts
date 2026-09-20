import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
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

  @IsOptional()
  @IsInt()
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