import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** GET /statistics/actividad?dias=7 */
export class ActividadQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'dias debe ser un número entero' })
  @Min(1, { message: 'dias debe ser al menos 1' })
  @Max(90, { message: 'dias no puede ser mayor a 90' })
  dias: number = 7;
}

/** GET /statistics/tendencia?semanas=8 */
export class TendenciaQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'semanas debe ser un número entero' })
  @Min(1, { message: 'semanas debe ser al menos 1' })
  @Max(12, { message: 'semanas no puede ser mayor a 12' })
  semanas: number = 8;
}
