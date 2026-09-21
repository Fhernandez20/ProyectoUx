import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

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
/** GET /statistics/seguimiento?desde=2026-09-14&hasta=2026-09-20 */
export class SeguimientoQueryDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'desde debe tener el formato AAAA-MM-DD',
  })
  desde: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'hasta debe tener el formato AAAA-MM-DD',
  })
  hasta: string;
}