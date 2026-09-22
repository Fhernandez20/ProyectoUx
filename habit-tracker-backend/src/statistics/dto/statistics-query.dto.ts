import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

/** GET /statistics/actividad?dias=7 */
export class ActividadQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 90, default: 7, example: 7, description: 'Días hacia atrás (7 = semanal, 30 = mensual)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'dias debe ser un número entero' })
  @Min(1, { message: 'dias debe ser al menos 1' })
  @Max(90, { message: 'dias no puede ser mayor a 90' })
  dias: number = 7;
}

/** GET /statistics/tendencia?semanas=8 */
export class TendenciaQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 12, default: 8, example: 8, description: 'Número de semanas' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'semanas debe ser un número entero' })
  @Min(1, { message: 'semanas debe ser al menos 1' })
  @Max(12, { message: 'semanas no puede ser mayor a 12' })
  semanas: number = 8;
}
/** GET /statistics/seguimiento?desde=2026-09-14&hasta=2026-09-20 */
export class SeguimientoQueryDto {
  @ApiProperty({ example: '2026-09-14', description: 'Primer día del rango (AAAA-MM-DD)' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'desde debe tener el formato AAAA-MM-DD',
  })
  desde: string;

  @ApiProperty({ example: '2026-09-20', description: 'Último día del rango (AAAA-MM-DD). Máximo 62 días desde "desde"' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'hasta debe tener el formato AAAA-MM-DD',
  })
  hasta: string;
}