import { PartialType } from '@nestjs/swagger';
import { CreateHabitoDto } from './create-habito.dto';

// PartialType de @nestjs/swagger: todos los campos de CreateHabitoDto pasan a ser
// opcionales, conservando tanto la validación como la documentación.
export class UpdateHabitoDto extends PartialType(CreateHabitoDto) {}
